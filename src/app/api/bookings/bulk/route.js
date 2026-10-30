import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { Setting } from '@/models/Setting';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { requireAdmin as requireAdminGuard } from '@/lib/apiAuth';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseIso = (iso) => {
    const [y, m, d] = String(iso).split('-').map(Number);
    return new Date(y, m - 1, d);
};

/**
 * Expand a recurrence rule into concrete dates.
 * weekdays: array of 0..6 (Sunday = 0). Empty array means "every day".
 */
function expandDates({ startDate, endDate, weekdays }) {
    const start = parseIso(startDate);
    const end = parseIso(endDate);
    const out = [];
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return out;
    const days = Array.isArray(weekdays) ? weekdays.map(Number).filter(n => n >= 0 && n <= 6) : [];
    const cursor = new Date(start);
    while (cursor <= end) {
        if (days.length === 0 || days.includes(cursor.getDay())) out.push(toIso(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return out;
}

async function requireAdmin(request) {
    const { denied } = await requireAdminGuard(request);
    return denied;
}

/**
 * POST /api/bookings/bulk
 * Create many bookings at once for a weekly fixed-slot customer
 * (e.g. every Friday & Saturday, slot 10, for the next 12 months).
 *
 * Body:
 *  { captainName, captainPhone, teamName, startDate, endDate, weekdays[], slotNumbers[],
 *    paidPerSlot (taka already collected for each booking), paymentMethod, pricePerSlot (optional override),
 *    notes, matchType, skipConflicts (bool), dryRun (bool) }
 *
 * dryRun = true returns the computed plan (dates, prices, conflicts) without writing anything.
 */
export async function POST(request) {
    try {
        const denied = await requireAdmin(request);
        if (denied) return denied;

        await connectToDatabase();
        const body = await request.json();
        const {
            captainName, captainPhone, teamName,
            startDate, endDate,
            weekdays = [], slotNumbers = [],
            paidPerSlot = 0, paymentMethod = 'cash',
            pricePerSlot, notes = '', matchType = 'friendly',
            skipConflicts = false, dryRun = false, seriesLabel
        } = body;

        if (!captainName || !captainPhone || !teamName) {
            return NextResponse.json({ error: 'Team name, captain name and mobile number are required.' }, { status: 400 });
        }
        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Start date and end date are required.' }, { status: 400 });
        }
        const slots = [...new Set((slotNumbers || []).map(Number))].filter(n => n >= 1 && n <= 12).sort((a, b) => a - b);
        if (slots.length === 0) {
            return NextResponse.json({ error: 'Select at least one time slot.' }, { status: 400 });
        }
        const dates = expandDates({ startDate, endDate, weekdays });
        if (dates.length === 0) {
            return NextResponse.json({ error: 'No dates match the selected weekdays in that date range.' }, { status: 400 });
        }
        if (dates.length * slots.length > 800) {
            return NextResponse.json({ error: `That is ${dates.length * slots.length} bookings. Please keep one series under 800 bookings (shorten the date range).` }, { status: 400 });
        }

        // Pricing from admin settings (falls back to defaults)
        const settings = await Setting.getOrCreateSettings();
        const slotPrices = (settings.slotPrices && settings.slotPrices.length ? settings.slotPrices : SCHEDULE_SLOTS_DEFINITION);
        const weekendDays = settings.weekendDays && settings.weekendDays.length ? settings.weekendDays : ['Friday', 'Saturday'];

        // Existing (active) bookings in the range for conflict detection
        const existing = await Booking.find({
            date: { $gte: dates[0], $lte: dates[dates.length - 1] },
            slotNumber: { $in: slots },
            paymentStatus: { $ne: 'cancelled' }
        }).select('date slotNumber teamName bookingCode');
        const taken = new Map(existing.map(b => [`${b.date}#${b.slotNumber}`, b]));

        const plan = [];
        const conflicts = [];
        for (const date of dates) {
            const dayName = DAY_NAMES[parseIso(date).getDay()];
            const isWeekend = weekendDays.includes(dayName);
            for (const slotNumber of slots) {
                const def = slotPrices.find(s => s.slotNumber === slotNumber) || SCHEDULE_SLOTS_DEFINITION.find(s => s.slotNumber === slotNumber);
                const autoPrice = isWeekend ? def.weekendPrice : def.weekdayPrice;
                const price = pricePerSlot && Number(pricePerSlot) > 0 ? Number(pricePerSlot) : autoPrice;
                const clash = taken.get(`${date}#${slotNumber}`);
                const item = { date, dayName, slotNumber, startTime: def.startTime, endTime: def.endTime, displayTime: def.displayTime, price };
                if (clash) {
                    conflicts.push({ ...item, bookedBy: clash.teamName, bookingCode: clash.bookingCode });
                } else {
                    plan.push(item);
                }
            }
        }

        const totalValue = plan.reduce((s, p) => s + p.price, 0);
        const summary = {
            dates: dates.length,
            slots,
            requested: dates.length * slots.length,
            bookable: plan.length,
            conflicts: conflicts.length,
            totalValue,
            firstDate: dates[0],
            lastDate: dates[dates.length - 1]
        };

        if (dryRun) {
            return NextResponse.json({ success: true, dryRun: true, summary, plan, conflicts });
        }
        if (conflicts.length > 0 && !skipConflicts) {
            return NextResponse.json({
                error: `${conflicts.length} of the requested slots are already booked. Tick "skip already-booked slots" to create the rest.`,
                summary, conflicts
            }, { status: 409 });
        }
        if (plan.length === 0) {
            return NextResponse.json({ error: 'Every requested slot is already booked.', summary, conflicts }, { status: 409 });
        }

        const seriesId = `SER-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        const label = seriesLabel || `${teamName.trim()} · ${weekdays.length ? weekdays.map(d => DAY_NAMES[d].slice(0, 3)).join('/') : 'Daily'} · ${startDate} → ${endDate}`;
        const paid = Math.max(0, Number(paidPerSlot) || 0);

        const docs = plan.map((p, i) => {
            const advance = Math.min(paid, p.price);
            const due = Math.max(0, p.price - advance);
            let paymentStatus = 'confirmed_unpaid';
            if (advance >= p.price) paymentStatus = 'paid_full';
            else if (advance > 0) paymentStatus = 'paid_advance';
            return {
                bookingCode: `CMA-R${(Date.now() + i).toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
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
                paymentType: advance >= p.price ? 'full_payment' : (advance > 0 ? 'advance_500' : 'pay_at_turf'),
                advanceAmount: advance,
                dueAmount: due,
                paymentMethod,
                paymentStatus,
                transactionId: `TX-${seriesId}`,
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
            if (err && err.insertedDocs) {
                created = err.insertedDocs;
            } else {
                throw err;
            }
        }

        return NextResponse.json({
            success: true,
            message: `${created.length} bookings created for ${teamName.trim()}.`,
            seriesId,
            summary: { ...summary, created: created.length },
            conflicts,
            bookings: created.map(b => b.toJSON())
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/bookings/bulk error:', err);
        return NextResponse.json({ error: err.message || 'Failed to create bookings' }, { status: 500 });
    }
}

/**
 * GET /api/bookings/bulk  -> list recurring series (grouped)
 */
export async function GET(request) {
    try {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const today = toIso(new Date());
        const series = await Booking.aggregate([
            { $match: { seriesId: { $exists: true, $ne: null } } },
            { $group: {
                _id: '$seriesId',
                seriesLabel: { $first: '$seriesLabel' },
                teamName: { $first: '$teamName' },
                captainName: { $first: '$captainName' },
                captainPhone: { $first: '$captainPhone' },
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $ne: ['$paymentStatus', 'cancelled'] }, 1, 0] } },
                upcoming: { $sum: { $cond: [{ $and: [{ $ne: ['$paymentStatus', 'cancelled'] }, { $gte: ['$date', today] }] }, 1, 0] } },
                firstDate: { $min: '$date' },
                lastDate: { $max: '$date' },
                slots: { $addToSet: '$slotNumber' },
                totalValue: { $sum: { $cond: [{ $ne: ['$paymentStatus', 'cancelled'] }, '$totalPrice', 0] } },
                collected: { $sum: { $cond: [{ $ne: ['$paymentStatus', 'cancelled'] }, '$advanceAmount', 0] } },
                createdAt: { $min: '$createdAt' }
            } },
            { $sort: { createdAt: -1 } }
        ]);
        return NextResponse.json({
            success: true,
            series: series.map(s => ({ ...s, seriesId: s._id, slots: (s.slots || []).sort((a, b) => a - b) }))
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * DELETE /api/bookings/bulk?seriesId=...&scope=upcoming|all
 * Cancels every booking in a series (default: only today and future dates).
 */
export async function DELETE(request) {
    try {
        const denied = await requireAdmin(request);
        if (denied) return denied;

        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');
        const scope = searchParams.get('scope') || 'upcoming';
        if (!seriesId) {
            return NextResponse.json({ error: 'seriesId is required' }, { status: 400 });
        }
        const query = { seriesId, paymentStatus: { $ne: 'cancelled' } };
        if (scope !== 'all') query.date = { $gte: toIso(new Date()) };
        const result = await Booking.updateMany(query, { $set: { paymentStatus: 'cancelled' } });
        return NextResponse.json({
            success: true,
            message: `${result.modifiedCount} bookings cancelled.`,
            cancelled: result.modifiedCount
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
