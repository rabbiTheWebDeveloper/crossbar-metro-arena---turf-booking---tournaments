import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/booking-model';
import { requirePermission } from '@/lib/apiAuth';
import { todayDhaka, addDays, kickoffDate } from '@/lib/booking';
import { errorResponse } from '@/lib/validate';
import {
    safeSendSms,
    scheduleBookingReminderSms,
    buildPreMatchReminderSms
} from '@/service/sms-service';

async function isAuthorized(request) {
    const cronSecret = (process.env.CRON_SECRET || '').trim();
    if (cronSecret) {
        const auth = request.headers.get('authorization') || '';
        const headerSecret = request.headers.get('x-cron-secret') || '';
        if (auth === `Bearer ${cronSecret}` || headerSecret === cronSecret) {
            return { ok: true };
        }
    }
    const { denied } = await requirePermission(request, ['bookings', 'settings']);
    return denied ? { ok: false, denied } : { ok: true };
}

/**
 * GET / POST /api/sms/reminders
 * Ensures every active confirmed booking starting in the next 24 hours has a 15-minute pre-match
 * reminder SMS scheduled (or sent immediately if kickoff is 1..20 minutes away).
 * Safe to invoke repeatedly (idempotent via reminderSmsRequestId / reminderSmsSentAt).
 */
async function runReminders(request) {
    try {
        const auth = await isAuthorized(request);
        if (!auth.ok) return auth.denied;

        await connectToDatabase();
        const today = todayDhaka();
        const tomorrow = addDays(today, 1);

        const bookings = await Booking.find({
            date: { $gte: today, $lte: tomorrow },
            paymentStatus: { $in: ['confirmed_unpaid', 'paid_advance', 'paid_full'] },
            reminderSmsRequestId: { $in: ['', null] },
            reminderSmsSentAt: null
        }).limit(100);

        const nowMs = Date.now();
        let sentNow = 0;
        let scheduled = 0;
        let skipped = 0;

        for (const booking of bookings) {
            const kickoffMs = kickoffDate(booking.date, booking.startTime).getTime();
            const minsUntilKickoff = (kickoffMs - nowMs) / 60000;

            if (minsUntilKickoff < 1) {
                skipped += 1;
                continue;
            }

            if (minsUntilKickoff <= 20) {
                // Inside the 15-minute window: send right away
                const res = await safeSendSms({
                    to: booking.captainPhone,
                    msg: buildPreMatchReminderSms(booking)
                });
                if (res.ok) {
                    booking.reminderSmsRequestId = res.requestId || 'sent';
                    booking.reminderSmsSentAt = new Date();
                    await booking.save().catch(() => {});
                    sentNow += 1;
                }
            } else {
                // More than 20 mins away: schedule at kickoff - 15 mins via sms.net.bd
                const res = await scheduleBookingReminderSms(booking);
                if (res.ok && !res.skipped) scheduled += 1;
                else skipped += 1;
            }
        }

        return NextResponse.json({
            success: true,
            checked: bookings.length,
            sentNow,
            scheduled,
            skipped
        });
    } catch (err) {
        return errorResponse(err, '/api/sms/reminders');
    }
}

export async function GET(request) {
    return runReminders(request);
}

export async function POST(request) {
    return runReminders(request);
}
