import { NextResponse } from 'next/server';
import { toIsoLocal, parseLocalDate } from '@/lib/dateUtils';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/booking-model';
import { Payment } from '@/models/payment-model';
import { Setting } from '@/models/setting-model';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { BULK_BOOKING_SCHEMA } from '@/lib/schemas';
import { requirePermission } from '@/lib/apiAuth';
import { trackCustomer } from '@/lib/customers';
import { expireStaleHolds, generateBookingCode, statusFromPayment, todayDhaka, addDays } from '@/lib/booking';
import { safeSendSms, scheduleBookingReminderSms } from '@/service/sms-service';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Expand a recurrence rule into concrete dates.
 * weekdays: array of 0..6 (Sunday = 0). Empty array means "every day".
 */
function expandDates({ startDate, endDate, weekdays }) {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const out = [];
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return out;
    const days = Array.isArray(weekdays) ? weekdays.map(Number).filter(n => n >= 0 && n <= 6) : [];
    const cursor = new Date(start);
    while (cursor <= end) {
        if (days.length === 0 || days.includes(cursor.getDay())) out.push(toIsoLocal(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return out;
}

/**
 * POST /api/bookings/bulk
 * Create many bookings at once for a weekly fixed-slot customer
 * (e.g. every Friday & Saturday, slot 10, for the next 12 months).
 *
 * dryRun = true returns the computed plan (dates, prices, totals, conflicts) without writing anything.
 */
export async function POST(request) {
    try {
        const { user: actor, denied } = await requirePermission(request, 'bookings');
        if (denied) return denied;

        const { body: raw, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        const { data, error: inputError } = validate(raw, BULK_BOOKING_SCHEMA);
        if (inputError) return badRequest(inputError);

        const {
            captainName, captainPhone, teamName, startDate, endDate,
            paidPerSlot, paymentMethod, pricePerSlot, notes, matchType,
            skipConflicts, dryRun, seriesLabel
        } = data;

        if (endDate < startDate) return badRequest('End date must be on or after the start date.');
        if ((parseLocalDate(endDate) - parseLocalDate(startDate)) / 86400000 > 800) {
            return badRequest('A series can cover at most 800 days. Shorten the date range.');
        }

        const weekdays = Array.isArray(raw.weekdays) ? [...new Set(raw.weekdays.map(Number))] : [];
        if (weekdays.some(d => !Number.isInteger(d) || d < 0 || d > 6)) {
            return badRequest('Weekdays must be numbers from 0 (Sunday) to 6 (Saturday).');
        }
        const slotNumbers = Array.isArray(raw.slotNumbers) ? raw.slotNumbers : [];
        const slots = [...new Set(slotNumbers.map(Number))]
            .filter(n => Number.isInteger(n) && n >= 1 && n <= 12)
            .sort((a, b) => a - b);
        if (slots.length === 0) {
            return badRequest('Select at least one time slot.');
        }

        const dates = expandDates({ startDate, endDate, weekdays });
        if (dates.length === 0) {
            return badRequest('No dates match the selected weekdays in that date range.');
        }
        if (dates.length * slots.length > 800) {
            return badRequest(`That is ${dates.length * slots.length} bookings. Please keep one series under 800 bookings (shorten the date range).`);
        }

        await connectToDatabase();
        await expireStaleHolds();

        // Pricing from admin settings (falls back to defaults)
        const settings = await Setting.getOrCreateSettings();
        const slotPrices = settings.slotPrices && settings.slotPrices.length ? settings.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        const weekendDays = settings.weekendDays && settings.weekendDays.length ? settings.weekendDays : ['Friday', 'Saturday'];

        // Existing active bookings (and live payment holds) in the range for conflict detection
        const existing = await Booking.find({
            date: { $gte: dates[0], $lte: dates[dates.length - 1] },
            slotNumber: { $in: slots },
            paymentStatus: { $ne: 'cancelled' }
        }).select('date slotNumber teamName bookingCode paymentStatus').lean();
        const taken = new Map(existing.map(b => [`${b.date}#${b.slotNumber}`, b]));

        const hasCustomPrice = pricePerSlot !== undefined && pricePerSlot !== null;
        const paid = Math.max(0, Number(paidPerSlot) || 0);

        const plan = [];
        const conflicts = [];
        for (const date of dates) {
            const dayName = DAY_NAMES[parseLocalDate(date).getDay()];
            const isWeekend = weekendDays.includes(dayName);
            for (const slotNumber of slots) {
                const def = slotPrices.find(s => Number(s.slotNumber) === slotNumber)
                    || SCHEDULE_SLOTS_DEFINITION.find(s => s.slotNumber === slotNumber);
                if (!def) continue;
                const autoPrice = Number(isWeekend ? def.weekendPrice : def.weekdayPrice) || 0;
                const price = hasCustomPrice ? Number(pricePerSlot) : autoPrice;
                const advance = Math.min(paid, price);
                const due = Math.max(0, price - advance);
                const clash = taken.get(`${date}#${slotNumber}`);
                const item = {
                    date,
                    dayName,
                    slotNumber,
                    startTime: def.startTime,
                    endTime: def.endTime,
                    displayTime: def.displayTime,
                    price,
                    advance,
                    due
                };
                if (clash) {
                    conflicts.push({
                        ...item,
                        bookedBy: clash.teamName || 'Reserved',
                        bookingCode: clash.bookingCode || '',
                        paymentStatus: clash.paymentStatus || ''
                    });
                } else {
                    plan.push(item);
                }
            }
        }

        const totalValue = plan.reduce((s, p) => s + p.price, 0);
        const totalCollected = plan.reduce((s, p) => s + p.advance, 0);
        const totalDue = plan.reduce((s, p) => s + p.due, 0);
        const summary = {
            dates: dates.length,
            slots,
            requested: dates.length * slots.length,
            bookable: plan.length,
            conflicts: conflicts.length,
            totalValue,
            totalCollected,
            totalDue,
            firstDate: dates[0],
            lastDate: dates[dates.length - 1]
        };

        if (dryRun) {
            return NextResponse.json({ success: true, dryRun: true, summary, plan, conflicts });
        }
        if (conflicts.length > 0 && !skipConflicts) {
            return NextResponse.json({
                error: `${conflicts.length} of the requested slots are already booked. Tick "Skip already-booked slots" to create the rest.`,
                summary,
                conflicts
            }, { status: 409 });
        }
        if (plan.length === 0) {
            return NextResponse.json({
                error: 'Every requested slot in this date range is already booked.',
                summary,
                conflicts
            }, { status: 409 });
        }

        const seriesId = `SER-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        const label = seriesLabel || `${teamName.trim()} · ${weekdays.length ? weekdays.map(d => DAY_NAMES[d].slice(0, 3)).join('/') : 'Daily'} · ${startDate} → ${endDate}`;
        const now = new Date();

        // Generate collision-free booking codes across the batch
        const usedCodes = new Set();
        const nextCode = () => {
            let code = generateBookingCode('CMA-R');
            while (usedCodes.has(code)) code = generateBookingCode('CMA-R');
            usedCodes.add(code);
            return code;
        };

        const docs = plan.map((p) => {
            const advance = p.advance;
            const due = p.due;
            const paymentStatus = statusFromPayment(advance, p.price);
            const effectiveMethod = advance > 0
                ? (paymentMethod === 'pay_at_turf' ? 'cash' : (paymentMethod || 'cash'))
                : 'pay_at_turf';
            const code = nextCode();

            return {
                bookingCode: code,
                courtId: 'main-turf',
                courtName: 'Crossbar Metro Arena (Main Turf)',
                date: p.date,
                slotNumber: p.slotNumber,
                startTime: p.startTime,
                endTime: p.endTime,
                displayTime: p.displayTime,
                captainName: captainName.trim(),
                captainPhone: captainPhone.trim(),
                teamName: teamName.trim(),
                playerCount: 14,
                matchType,
                addOns: [],
                courtPrice: p.price,
                addOnsPrice: 0,
                totalPrice: p.price,
                paymentType: advance >= p.price && p.price > 0 ? 'full_payment' : (advance > 0 ? 'advance_500' : 'pay_at_turf'),
                advanceAmount: advance,
                dueAmount: due,
                paymentMethod: effectiveMethod,
                paymentGateway: 'counter',
                paymentStatus,
                transactionId: `TX-${seriesId}`,
                paidAt: advance > 0 ? now : undefined,
                isWalkIn: true,
                isRecurring: true,
                seriesId,
                seriesLabel: label,
                notes: notes || `Fixed weekly slot (series ${seriesId})`
            };
        });

        // ordered:false lets the unique index reject any race-condition duplicates without aborting the rest
        let created = [];
        try {
            created = await Booking.insertMany(docs, { ordered: false });
        } catch (err) {
            if (err && Array.isArray(err.insertedDocs)) {
                created = err.insertedDocs;
            } else {
                throw err;
            }
        }

        if (created.length === 0) {
            return NextResponse.json({
                error: 'All selected slots were booked by someone else just now. Please re-check availability.',
                summary: { ...summary, created: 0 },
                conflicts
            }, { status: 409 });
        }

        // Track customer in CRM
        await trackCustomer({ name: captainName, phone: captainPhone, source: 'fixed_slot' });

        // Record counter payment entries for any upfront money collected so /admin/payments stays accurate
        const paidDocs = created.filter(b => (Number(b.advanceAmount) || 0) > 0);
        if (paidDocs.length > 0) {
            const paymentRows = paidDocs.map(b => ({
                bookingId: String(b._id),
                bookingCode: b.bookingCode,
                merchantTransactionId: `BULK-${b.bookingCode}-${seriesId.slice(-5)}`,
                gatewayTransactionId: b.transactionId || `TX-${seriesId}`,
                gateway: 'counter',
                status: 'success',
                amount: Number(b.advanceAmount),
                currency: 'BDT',
                paymentMethod: b.paymentMethod || 'cash',
                financialEntity: String(b.paymentMethod || 'CASH').toUpperCase(),
                customerName: b.captainName,
                customerPhone: b.captainPhone,
                teamName: b.teamName,
                slotDate: b.date,
                slotNumber: b.slotNumber,
                slotDisplay: b.displayTime,
                recordedBy: actor?.name || 'Admin Desk',
                verifiedAt: now,
                notes: `Bulk / fixed slot series (${seriesId})`
            }));
            await Payment.insertMany(paymentRows, { ordered: false }).catch(err => {
                console.error('Bulk booking payment log failed:', err?.message || err);
            });
        }

        const createdValue = created.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
        const createdCollected = created.reduce((s, b) => s + (Number(b.advanceAmount) || 0), 0);
        const createdDue = created.reduce((s, b) => s + (Number(b.dueAmount) || 0), 0);

        // Send series confirmation SMS + schedule 15-min reminders for upcoming matches in the next 7 days
        const firstBooking = created[0];
        const weekAhead = addDays(todayDhaka(), 7);
        await safeSendSms({
            to: captainPhone,
            msg: `Crossbar Metro Arena: ${created.length} fixed slots CONFIRMED for ${teamName.trim()} (${firstBooking.displayTime}) from ${summary.firstDate} to ${summary.lastDate}. Paid: Tk ${Math.round(createdCollected).toLocaleString('en-IN')}, Due: Tk ${Math.round(createdDue).toLocaleString('en-IN')}.`
        }).catch(() => {});
        const upcomingThisWeek = created.filter(b => b.date <= weekAhead).slice(0, 14);
        await Promise.all(upcomingThisWeek.map(b => scheduleBookingReminderSms(b).catch(() => {})));

        return NextResponse.json({
            success: true,
            message: `${created.length} booking${created.length === 1 ? '' : 's'} created for ${teamName.trim()}.`,
            seriesId,
            summary: {
                ...summary,
                created: created.length,
                totalValue: createdValue,
                totalCollected: createdCollected,
                totalDue: createdDue
            },
            conflicts,
            bookings: created.map(b => b.toJSON())
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/bookings/bulk');
    }
}

/**
 * GET /api/bookings/bulk  -> list recurring series (grouped)
 */
export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, 'bookings');
        if (denied) return denied;
        await connectToDatabase();
        const today = todayDhaka();
        const collectedExpr = {
            $switch: {
                branches: [
                    { case: { $eq: ['$paymentStatus', 'paid_full'] }, then: '$totalPrice' },
                    { case: { $in: ['$paymentStatus', ['paid_advance', 'needs_refund']] }, then: '$advanceAmount' }
                ],
                default: 0
            }
        };
        const series = await Booking.aggregate([
            { $match: { seriesId: { $exists: true, $nin: [null, ''] } } },
            {
                $group: {
                    _id: '$seriesId',
                    seriesLabel: { $first: '$seriesLabel' },
                    teamName: { $first: '$teamName' },
                    captainName: { $first: '$captainName' },
                    captainPhone: { $first: '$captainPhone' },
                    total: { $sum: 1 },
                    active: { $sum: { $cond: [{ $ne: ['$paymentStatus', 'cancelled'] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'cancelled'] }, 1, 0] } },
                    upcoming: {
                        $sum: {
                            $cond: [
                                { $and: [{ $ne: ['$paymentStatus', 'cancelled'] }, { $gte: ['$date', today] }] },
                                1,
                                0
                            ]
                        }
                    },
                    firstDate: { $min: '$date' },
                    lastDate: { $max: '$date' },
                    slots: { $addToSet: '$slotNumber' },
                    totalValue: { $sum: { $cond: [{ $ne: ['$paymentStatus', 'cancelled'] }, '$totalPrice', 0] } },
                    collected: { $sum: { $cond: [{ $ne: ['$paymentStatus', 'cancelled'] }, collectedExpr, 0] } },
                    createdAt: { $min: '$createdAt' }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);
        return NextResponse.json({
            success: true,
            series: series.map(s => ({
                ...s,
                seriesId: s._id,
                due: Math.max(0, (Number(s.totalValue) || 0) - (Number(s.collected) || 0)),
                slots: (s.slots || []).sort((a, b) => a - b)
            }))
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/bookings/bulk');
    }
}

/**
 * DELETE /api/bookings/bulk?seriesId=...&scope=upcoming|all
 * Cancels every booking in a series (default: only today and future dates in Dhaka time).
 */
export async function DELETE(request) {
    try {
        const { user: actor, denied } = await requirePermission(request, 'bookings');
        if (denied) return denied;

        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');
        const scope = searchParams.get('scope') || 'upcoming';
        if (!seriesId) {
            return badRequest('seriesId is required');
        }
        const query = { seriesId, paymentStatus: { $ne: 'cancelled' } };
        if (scope !== 'all') query.date = { $gte: todayDhaka() };
        const result = await Booking.updateMany(query, {
            $set: {
                paymentStatus: 'cancelled',
                dueAmount: 0,
                cancelledAt: new Date(),
                cancelledBy: `admin:${actor?.name || 'Admin Desk'}`
            }
        });
        return NextResponse.json({
            success: true,
            message: `${result.modifiedCount} booking${result.modifiedCount === 1 ? '' : 's'} cancelled.`,
            cancelled: result.modifiedCount
        });
    } catch (err) {
        return errorResponse(err, 'DELETE /api/bookings/bulk');
    }
}
