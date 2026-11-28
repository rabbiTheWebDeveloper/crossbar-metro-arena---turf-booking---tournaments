import { NextResponse } from 'next/server';
import { parseLocalDate } from '@/lib/dateUtils';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/booking-model';
import { Payment } from '@/models/payment-model';
import { Refund } from '@/models/refund-model';
import { Setting } from '@/models/setting-model';
import { User } from '@/models/user-model';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { BULK_BOOKING_SCHEMA } from '@/lib/schemas';
import { requirePermission, cleanPhone } from '@/lib/apiAuth';
import { actorId, actorLabel, stampCreate, stampUpdate } from '@/lib/audit';
import { trackCustomer } from '@/lib/customers';
import { expireStaleHolds, generateBookingCode, statusFromPayment, todayDhaka, addDays, isIsoDate, resolveRequestedSessions } from '@/lib/booking';
import { safeSendSms, scheduleBookingReminderSms } from '@/service/sms-service';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function buildPlanFromSessions({ sessions, slotPrices, weekendDays, takenMap, pricePerSlot, paidPerSlot, poolPaid = null }) {
    const hasCustomPrice = pricePerSlot !== undefined && pricePerSlot !== null && pricePerSlot !== '';
    const perSlotPaid = Math.max(0, Number(paidPerSlot) || 0);
    let remainingPool = poolPaid !== null ? Math.max(0, Number(poolPaid) || 0) : null;

    const plan = [];
    const conflicts = [];

    for (const { date, slotNumber } of sessions) {
        const dayIndex = parseLocalDate(date).getDay();
        const dayName = DAY_NAMES[dayIndex];
        const isWeekend = weekendDays.includes(dayName);
        const def = slotPrices.find(s => Number(s.slotNumber) === slotNumber)
            || SCHEDULE_SLOTS_DEFINITION.find(s => s.slotNumber === slotNumber);
        if (!def) continue;

        const autoPrice = Number(isWeekend ? def.weekendPrice : def.weekdayPrice) || 0;
        const price = hasCustomPrice ? Math.max(0, Number(pricePerSlot) || 0) : autoPrice;

        const clash = takenMap.get(`${date}#${slotNumber}`);
        const baseItem = {
            date,
            dayIndex,
            dayName,
            slotNumber,
            startTime: def.startTime,
            endTime: def.endTime,
            displayTime: def.displayTime,
            price
        };

        if (clash) {
            conflicts.push({
                ...baseItem,
                advance: 0,
                due: price,
                bookedBy: clash.teamName || 'Reserved',
                bookingCode: clash.bookingCode || '',
                paymentStatus: clash.paymentStatus || ''
            });
        } else {
            let advance = 0;
            if (remainingPool !== null) {
                advance = Math.min(remainingPool, price);
                remainingPool = Math.max(0, remainingPool - advance);
            } else {
                advance = Math.min(perSlotPaid, price);
            }
            const due = Math.max(0, price - advance);
            plan.push({ ...baseItem, advance, due });
        }
    }

    return { plan, conflicts, surplusPaid: remainingPool !== null ? remainingPool : 0 };
}

function makeSeriesLabel(teamName, weekdays, slots, slotPrices, firstDate, lastDate) {
    const dayStr = Array.isArray(weekdays) && weekdays.length > 0 && weekdays.length < 7
        ? weekdays.map(d => DAY_NAMES[d]?.slice(0, 3)).filter(Boolean).join('/')
        : 'All Days';
    const timeStr = (slots || []).map(sn => {
        const def = slotPrices.find(s => Number(s.slotNumber) === Number(sn))
            || SCHEDULE_SLOTS_DEFINITION.find(s => s.slotNumber === Number(sn));
        return def ? def.displayTime : `Slot #${sn}`;
    }).join(', ');
    return `${teamName.trim()} · ${dayStr} · ${timeStr} · ${firstDate} → ${lastDate}`;
}

/**
 * POST /api/bookings/bulk
 * Create multiple bookings at once (Date Range + Weekdays + Time Slots, Specific Dates, or Custom Per-Row Sessions).
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
            captainName, captainPhone, teamName,
            paidPerSlot, paymentMethod, pricePerSlot, notes, matchType,
            skipConflicts, dryRun, seriesLabel
        } = data;

        const resolved = resolveRequestedSessions(raw, data);
        if (resolved.error) return badRequest(resolved.error);
        const { sessions, dates, slots, weekdays } = resolved;

        await connectToDatabase();
        await expireStaleHolds();

        const settings = await Setting.getOrCreateSettings();
        const slotPrices = settings.slotPrices && settings.slotPrices.length ? settings.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        const weekendDays = settings.weekendDays && settings.weekendDays.length ? settings.weekendDays : ['Friday', 'Saturday'];

        const existing = await Booking.find({
            date: { $gte: dates[0], $lte: dates[dates.length - 1] },
            slotNumber: { $in: slots },
            paymentStatus: { $ne: 'cancelled' }
        }).select('date slotNumber teamName bookingCode paymentStatus').lean();
        const taken = new Map(existing.map(b => [`${b.date}#${b.slotNumber}`, b]));

        const { plan, conflicts } = buildPlanFromSessions({
            sessions,
            slotPrices,
            weekendDays,
            takenMap: taken,
            pricePerSlot,
            paidPerSlot
        });

        const totalValue = plan.reduce((s, p) => s + p.price, 0);
        const totalCollected = plan.reduce((s, p) => s + p.advance, 0);
        const totalDue = plan.reduce((s, p) => s + p.due, 0);
        const summary = {
            dates: dates.length,
            slots,
            weekdays,
            weekdayNames: weekdays.map(d => DAY_NAMES[d]),
            requested: sessions.length,
            bookable: plan.length,
            conflicts: conflicts.length,
            totalValue,
            totalCollected,
            totalDue,
            firstDate: plan[0]?.date || dates[0],
            lastDate: plan[plan.length - 1]?.date || dates[dates.length - 1]
        };

        if (dryRun) {
            return NextResponse.json({ success: true, dryRun: true, summary, plan, conflicts });
        }
        if (conflicts.length > 0 && !skipConflicts) {
            return NextResponse.json({
                error: `${conflicts.length} of the requested slots are already booked. Tick "Skip already-booked slots" or edit the clashing Date/Time in Preview.`,
                summary,
                conflicts
            }, { status: 409 });
        }
        if (plan.length === 0) {
            return NextResponse.json({
                error: 'Every requested slot in this schedule is already booked.',
                summary,
                conflicts
            }, { status: 409 });
        }

        const seriesId = `SER-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        const label = seriesLabel || makeSeriesLabel(teamName, weekdays, slots, slotPrices, summary.firstDate, summary.lastDate);
        const now = new Date();

        const usedCodes = new Set();
        const nextCode = () => {
            let code = generateBookingCode('CMA-R');
            while (usedCodes.has(code)) code = generateBookingCode('CMA-R');
            usedCodes.add(code);
            return code;
        };

        const customerUser = await User.findOne({ phone: cleanPhone(captainPhone) }).select('_id').lean();
        const linkedUserId = customerUser?._id ? String(customerUser._id) : actorId(actor);
        const seriesAudit = stampCreate(actor, { fallback: 'Admin Desk', userId: linkedUserId });

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
                notes: notes || `Fixed slot (${p.dayName} · ${p.displayTime} · ${seriesId})`,
                ...seriesAudit
            };
        });

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

        await trackCustomer({ name: captainName, phone: captainPhone, source: 'fixed_slot', actor });

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
                recordedBy: actorLabel(actor, 'Admin Desk'),
                verifiedAt: now,
                notes: `Bulk / fixed slot series (${seriesId})`,
                ...seriesAudit
            }));
            await Payment.insertMany(paymentRows, { ordered: false }).catch(err => {
                console.error('Bulk booking payment log failed:', err?.message || err);
            });
        }

        const createdValue = created.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
        const createdCollected = created.reduce((s, b) => s + (Number(b.advanceAmount) || 0), 0);
        const createdDue = created.reduce((s, b) => s + (Number(b.dueAmount) || 0), 0);

        const firstBooking = created[0];
        const weekAhead = addDays(todayDhaka(), 7);
        await safeSendSms({
            to: captainPhone,
            msg: `Crossbar Metro Arena: ${created.length} fixed slots CONFIRMED for ${teamName.trim()} (${firstBooking.displayTime}) from ${summary.firstDate} to ${summary.lastDate}. Paid: Tk ${Math.round(createdCollected).toLocaleString('en-IN')}, Due: Tk ${Math.round(createdDue).toLocaleString('en-IN')}.`,
            logMeta: {
                category: 'bulk_booking_series',
                bookingCode: seriesId,
                recipientSummary: `${captainName.trim()} (${captainPhone.trim()})`,
                sentBy: actor?.name || 'Admin Desk'
            }
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
 * PATCH /api/bookings/bulk
 * Edit an existing bulk series' Date Range, Weekdays, Time Slots, or Custom Per-Row Sessions!
 * Supports `dryRun: true` for live clash checking before saving.
 */
export async function PATCH(request) {
    try {
        const { user: actor, denied } = await requirePermission(request, 'bookings');
        if (denied) return denied;

        const { body: raw, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const seriesId = String(raw.seriesId || '').trim();
        if (!seriesId) return badRequest('seriesId is required.');

        await connectToDatabase();
        await expireStaleHolds();

        const allSeriesDocs = await Booking.find({ seriesId }).sort({ date: 1, slotNumber: 1 });
        if (allSeriesDocs.length === 0) {
            return NextResponse.json({ error: 'Series not found.' }, { status: 404 });
        }

        const today = todayDhaka();
        const scope = raw.scope === 'all' ? 'all' : 'upcoming';
        const targetDocs = allSeriesDocs.filter(b =>
            b.paymentStatus !== 'cancelled' &&
            !b.played &&
            (scope === 'all' || b.date >= today)
        );

        if (targetDocs.length === 0) {
            return badRequest('No unplayed active bookings remain in this scope to reschedule.');
        }

        const sample = targetDocs[0] || allSeriesDocs[0];
        const teamName = String(raw.teamName || sample.teamName || '').trim();
        const captainName = String(raw.captainName || sample.captainName || '').trim();
        const captainPhone = String(raw.captainPhone || sample.captainPhone || '').trim();
        const notes = raw.notes !== undefined ? String(raw.notes).trim() : (sample.notes || '');
        const matchType = ['friendly', 'competitive', 'practice', 'corporate'].includes(raw.matchType) ? raw.matchType : (sample.matchType || 'friendly');
        const skipConflicts = Boolean(raw.skipConflicts);
        const dryRun = Boolean(raw.dryRun);

        const resolved = resolveRequestedSessions(raw, {
            startDate: raw.startDate,
            endDate: raw.endDate
        });
        if (resolved.error) return badRequest(resolved.error);
        const { sessions, dates, slots, weekdays } = resolved;

        const settings = await Setting.getOrCreateSettings();
        const slotPrices = settings.slotPrices && settings.slotPrices.length ? settings.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        const weekendDays = settings.weekendDays && settings.weekendDays.length ? settings.weekendDays : ['Friday', 'Saturday'];

        const targetIds = targetDocs.map(b => b._id);
        const existingOutside = await Booking.find({
            _id: { $nin: targetIds },
            date: { $gte: dates[0], $lte: dates[dates.length - 1] },
            slotNumber: { $in: slots },
            paymentStatus: { $ne: 'cancelled' }
        }).select('date slotNumber teamName bookingCode paymentStatus').lean();
        const taken = new Map(existingOutside.map(b => [`${b.date}#${b.slotNumber}`, b]));

        // Carry forward already-collected money across the rescheduled slots
        const poolPaid = targetDocs.reduce((s, b) => s + (Number(b.advanceAmount) || 0), 0);
        const pricePerSlot = raw.pricePerSlot !== undefined && raw.pricePerSlot !== '' ? Number(raw.pricePerSlot) : undefined;

        const { plan, conflicts, surplusPaid } = buildPlanFromSessions({
            sessions,
            slotPrices,
            weekendDays,
            takenMap: taken,
            pricePerSlot,
            paidPerSlot: 0,
            poolPaid
        });

        const totalValue = plan.reduce((s, p) => s + p.price, 0);
        const totalCollected = plan.reduce((s, p) => s + p.advance, 0);
        const totalDue = plan.reduce((s, p) => s + p.due, 0);
        const summary = {
            previousCount: targetDocs.length,
            dates: dates.length,
            slots,
            weekdays,
            weekdayNames: weekdays.map(d => DAY_NAMES[d]),
            requested: sessions.length,
            bookable: plan.length,
            conflicts: conflicts.length,
            totalValue,
            totalCollected,
            totalDue,
            surplusPaid,
            firstDate: plan[0]?.date || dates[0],
            lastDate: plan[plan.length - 1]?.date || dates[dates.length - 1]
        };

        if (dryRun) {
            return NextResponse.json({ success: true, dryRun: true, summary, plan, conflicts });
        }
        if (conflicts.length > 0 && !skipConflicts) {
            return NextResponse.json({
                error: `${conflicts.length} slot(s) in the new schedule clash with existing bookings. Tick "Skip clashing slots" or edit those dates/times.`,
                summary,
                conflicts
            }, { status: 409 });
        }
        if (plan.length === 0) {
            return NextResponse.json({
                error: 'Every slot in the new schedule is already booked.',
                summary,
                conflicts
            }, { status: 409 });
        }

        const label = makeSeriesLabel(teamName, weekdays, slots, slotPrices, summary.firstDate, summary.lastDate);
        const usedCodes = new Set(targetDocs.map(d => d.bookingCode));
        const nextCode = () => {
            let code = generateBookingCode('CMA-R');
            while (usedCodes.has(code)) code = generateBookingCode('CMA-R');
            usedCodes.add(code);
            return code;
        };

        const preservedMethod = sample.paymentMethod && sample.paymentMethod !== 'pay_at_turf' ? sample.paymentMethod : 'cash';
        const now = new Date();

        const replacementDocs = plan.map((p, idx) => {
            const advance = p.advance;
            const due = p.due;
            const paymentStatus = statusFromPayment(advance, p.price);
            const reusedCode = idx < targetDocs.length ? targetDocs[idx].bookingCode : nextCode();

            return {
                bookingCode: reusedCode,
                courtId: 'main-turf',
                courtName: 'Crossbar Metro Arena (Main Turf)',
                date: p.date,
                slotNumber: p.slotNumber,
                startTime: p.startTime,
                endTime: p.endTime,
                displayTime: p.displayTime,
                captainName,
                captainPhone,
                teamName,
                playerCount: sample.playerCount || 14,
                matchType,
                addOns: [],
                courtPrice: p.price,
                addOnsPrice: 0,
                totalPrice: p.price,
                paymentType: advance >= p.price && p.price > 0 ? 'full_payment' : (advance > 0 ? 'advance_500' : 'pay_at_turf'),
                advanceAmount: advance,
                dueAmount: due,
                paymentMethod: advance > 0 ? preservedMethod : 'pay_at_turf',
                paymentGateway: 'counter',
                paymentStatus,
                transactionId: sample.transactionId || `TX-${seriesId}`,
                paidAt: advance > 0 ? (sample.paidAt || now) : undefined,
                isWalkIn: true,
                isRecurring: true,
                seriesId,
                seriesLabel: label,
                notes: notes || `Rescheduled fixed slot (${p.dayName} · ${p.displayTime})`,
                userId: sample.userId || actorId(actor),
                createdBy: sample.createdBy || actorLabel(actor, 'Admin Desk'),
                createdById: sample.createdById || actorId(actor),
                updatedBy: actorLabel(actor, 'Admin Desk'),
                updatedById: actorId(actor)
            };
        });

        // Replace unplayed targetDocs atomically without intermediate unique-index swap collisions
        await Booking.deleteMany({ _id: { $in: targetIds } });
        const inserted = await Booking.insertMany(replacementDocs, { ordered: false });

        // Also keep team/captain metadata consistent across played bookings in the same series
        await Booking.updateMany(
            { seriesId },
            { $set: { teamName, captainName, captainPhone, seriesLabel: label, ...stampUpdate(actor, { fallback: 'Admin Desk' }) } }
        );

        let refundQueued = null;
        if (surplusPaid > 0) {
            refundQueued = await Refund.create({
                bookingId: String(inserted[0]?._id || ''),
                bookingCode: seriesId,
                customerName: captainName,
                customerPhone: captainPhone,
                amount: surplusPaid,
                reason: 'series_reschedule_surplus',
                refundMethod: ['bkash', 'nagad', 'rocket'].includes(preservedMethod) ? preservedMethod : 'cash',
                status: 'pending',
                requestDate: today,
                recordedBy: actorLabel(actor, 'Admin Desk'),
                ...stampCreate(actor, { fallback: 'Admin Desk', userId: sample.userId || actorId(actor) })
            });
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${inserted.length} booking${inserted.length === 1 ? '' : 's'} in ${seriesId} (${summary.firstDate} → ${summary.lastDate}).`,
            seriesId,
            summary: { ...summary, updated: inserted.length },
            bookings: inserted.map(b => b.toJSON()),
            refund: refundQueued ? refundQueued.toJSON() : null
        });
    } catch (err) {
        return errorResponse(err, 'PATCH /api/bookings/bulk');
    }
}

/**
 * GET /api/bookings/bulk -> list recurring series with full Date, Day, Time & per-session breakdown
 */
export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, 'bookings');
        if (denied) return denied;
        await connectToDatabase();
        const today = todayDhaka();
        const settings = await Setting.getOrCreateSettings();
        const slotPrices = settings.slotPrices && settings.slotPrices.length ? settings.slotPrices : SCHEDULE_SLOTS_DEFINITION;

        const slotTimeLabel = (sn) => {
            const def = slotPrices.find(s => Number(s.slotNumber) === Number(sn))
                || SCHEDULE_SLOTS_DEFINITION.find(s => s.slotNumber === Number(sn));
            return def ? def.displayTime : `Slot #${sn}`;
        };

        const docs = await Booking.find({ seriesId: { $exists: true, $nin: [null, ''] } })
            .sort({ date: 1, slotNumber: 1 })
            .lean();

        const bySeries = new Map();
        for (const b of docs) {
            const sid = b.seriesId;
            if (!bySeries.has(sid)) {
                bySeries.set(sid, {
                    seriesId: sid,
                    seriesLabel: b.seriesLabel || '',
                    teamName: b.teamName || '',
                    captainName: b.captainName || '',
                    captainPhone: b.captainPhone || '',
                    matchType: b.matchType || 'friendly',
                    notes: b.notes || '',
                    createdAt: b.createdAt,
                    createdBy: b.createdBy || '',
                    updatedBy: b.updatedBy || '',
                    userId: b.userId || b.createdById || '',
                    total: 0,
                    active: 0,
                    cancelled: 0,
                    upcoming: 0,
                    playedCount: 0,
                    firstDate: '',
                    lastDate: '',
                    totalValue: 0,
                    collected: 0,
                    slotSet: new Set(),
                    weekdaySet: new Set(),
                    bookings: []
                });
            }
            const g = bySeries.get(sid);
            g.total += 1;
            if (b.createdAt && (!g.createdAt || b.createdAt < g.createdAt)) g.createdAt = b.createdAt;
            if (b.updatedBy) g.updatedBy = b.updatedBy;
            if (!g.createdBy && b.createdBy) g.createdBy = b.createdBy;
            if (!g.userId && (b.userId || b.createdById)) g.userId = b.userId || b.createdById;

            const dayIdx = isIsoDate(b.date) ? parseLocalDate(b.date).getDay() : 0;
            const dayName = DAY_NAMES[dayIdx] || '';
            const isCancelled = b.paymentStatus === 'cancelled';

            if (isCancelled) {
                g.cancelled += 1;
            } else {
                g.active += 1;
                if (b.played) g.playedCount += 1;
                if (b.date >= today) g.upcoming += 1;
                if (!g.firstDate || b.date < g.firstDate) g.firstDate = b.date;
                if (!g.lastDate || b.date > g.lastDate) g.lastDate = b.date;
                g.slotSet.add(Number(b.slotNumber));
                g.weekdaySet.add(dayIdx);
                g.totalValue += Number(b.totalPrice) || 0;
                const paidAmt = b.paymentStatus === 'paid_full'
                    ? (Number(b.totalPrice) || 0)
                    : ['paid_advance', 'needs_refund'].includes(b.paymentStatus)
                        ? (Number(b.advanceAmount) || 0)
                        : 0;
                g.collected += paidAmt;
            }

            // Fall back to cancelled dates if every single slot in the series was cancelled
            if (!g.firstDate || b.date < g.firstDate) g.firstDate = g.firstDate || b.date;
            if (!g.lastDate || b.date > g.lastDate) g.lastDate = g.lastDate || b.date;

            g.bookings.push({
                id: String(b._id),
                bookingCode: b.bookingCode,
                date: b.date,
                dayIndex: dayIdx,
                dayName,
                slotNumber: Number(b.slotNumber),
                startTime: b.startTime,
                endTime: b.endTime,
                displayTime: b.displayTime || slotTimeLabel(b.slotNumber),
                courtPrice: Number(b.courtPrice) || 0,
                totalPrice: Number(b.totalPrice) || 0,
                advanceAmount: Number(b.advanceAmount) || 0,
                dueAmount: Number(b.dueAmount) || 0,
                paymentMethod: b.paymentMethod || 'pay_at_turf',
                paymentStatus: b.paymentStatus,
                played: Boolean(b.played),
                teamName: b.teamName,
                captainName: b.captainName,
                captainPhone: b.captainPhone,
                isRecurring: true,
                seriesId: sid,
                userId: b.userId || b.createdById || '',
                createdBy: b.createdBy || '',
                updatedBy: b.updatedBy || ''
            });
        }

        const seriesList = [...bySeries.values()]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .map(g => {
                const slots = [...g.slotSet].sort((a, b) => a - b);
                const weekdays = [...g.weekdaySet].sort((a, b) => a - b);
                const slotDetails = slots.map(sn => ({
                    slotNumber: sn,
                    displayTime: slotTimeLabel(sn)
                }));
                return {
                    seriesId: g.seriesId,
                    seriesLabel: g.seriesLabel,
                    teamName: g.teamName,
                    captainName: g.captainName,
                    captainPhone: g.captainPhone,
                    matchType: g.matchType,
                    notes: g.notes,
                    createdAt: g.createdAt,
                    createdBy: g.createdBy,
                    updatedBy: g.updatedBy,
                    userId: g.userId,
                    total: g.total,
                    active: g.active,
                    cancelled: g.cancelled,
                    upcoming: g.upcoming,
                    playedCount: g.playedCount,
                    firstDate: g.firstDate,
                    lastDate: g.lastDate,
                    slots,
                    slotDetails,
                    weekdays,
                    weekdayNames: weekdays.map(d => DAY_NAMES[d]),
                    totalValue: g.totalValue,
                    collected: g.collected,
                    due: Math.max(0, g.totalValue - g.collected),
                    bookings: g.bookings
                };
            });

        return NextResponse.json({
            success: true,
            series: seriesList
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
        if (scope === 'all' && actor?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Only Super Admin can cancel an entire series including past dates.' },
                { status: 403 }
            );
        }
        const query = { seriesId, paymentStatus: { $ne: 'cancelled' } };
        if (scope !== 'all') query.date = { $gte: todayDhaka() };
        const result = await Booking.updateMany(query, {
            $set: {
                paymentStatus: 'cancelled',
                dueAmount: 0,
                cancelledAt: new Date(),
                cancelledBy: `admin:${actor?.name || 'Admin Desk'}`,
                ...stampUpdate(actor, { fallback: 'Admin Desk' })
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
