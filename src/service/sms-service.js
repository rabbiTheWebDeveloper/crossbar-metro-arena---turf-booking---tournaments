import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/setting-model';
import { Booking } from '@/models/booking-model';
import { User } from '@/models/user-model';
import { Customer } from '@/models/customer-model';
import { Investor } from '@/models/investor-model';
import { SmsLog } from '@/models/sms-log-model';
import { applyUpdateAudit } from '@/lib/audit';
import { cleanPhone, isValidBdPhone } from '@/lib/phone';
import { parsePhoneTokens, estimateSmsParts, normalizeScheduleInput } from '@/lib/smsUtils';
import { kickoffDate, todayDhaka } from '@/lib/booking';
import { isDeliverableEmail, safeSendBookingConfirmationEmail } from '@/utils/mail';

const SMS_API_BASE = 'https://api.sms.net.bd';
const SCHEDULE_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export { parsePhoneTokens, estimateSmsParts, normalizeScheduleInput };

export const SMS_ERROR_MESSAGES = {
    0: 'Success',
    400: 'Missing or invalid SMS parameter.',
    403: 'No permission to perform this SMS request.',
    404: 'Requested SMS resource not found.',
    405: 'SMS API authorization required (invalid API key).',
    409: 'Unknown error occurred on SMS server.',
    410: 'SMS account expired.',
    411: 'SMS reseller account expired or suspended.',
    412: 'Invalid schedule date/time (must be Y-m-d H:i:s in the future).',
    413: 'Invalid Sender ID.',
    414: 'SMS message is empty.',
    415: 'SMS message is too long.',
    416: 'No valid recipient phone number found.',
    417: 'Insufficient SMS balance.',
    420: 'SMS content blocked by gateway.',
    421: 'You can only send SMS to your registered phone number until first balance recharge.'
};

export function smsErrorMessage(code, fallback = '') {
    const num = Number(code);
    return SMS_ERROR_MESSAGES[num] || fallback || `SMS gateway error (${code})`;
}

/**
 * Normalize one or more Bangladeshi mobile numbers into `8801XXXXXXXXX` comma-separated list
 * accepted by https://api.sms.net.bd/sendsms.
 */
export function formatSmsPhone(raw) {
    return parsePhoneTokens(raw).formatted;
}

/**
 * Format a Date as `YYYY-MM-DD HH:mm:ss` in Asia/Dhaka (+06:00) for api.sms.net.bd `schedule`.
 */
export function formatDhakaDateTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(d);
    const get = (type) => parts.find(p => p.type === type)?.value || '00';
    const hour = get('hour') === '24' ? '00' : get('hour');
    return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`;
}

/**
 * Compute the 15-minute pre-match reminder schedule time for a booking in Asia/Dhaka time.
 * Only marks `shouldSchedule: true` when the reminder timestamp is at least 1 minute in the future.
 */
export function computeReminderSchedule(dateIso, startTime, minutesBefore = 15, now = new Date()) {
    if (!dateIso || !startTime) return { shouldSchedule: false, schedule: '', reminderAt: null };
    const kickoff = kickoffDate(dateIso, startTime);
    if (Number.isNaN(kickoff.getTime())) return { shouldSchedule: false, schedule: '', reminderAt: null };
    const reminderAt = new Date(kickoff.getTime() - minutesBefore * 60 * 1000);
    const shouldSchedule = reminderAt.getTime() > now.getTime() + 60 * 1000;
    return {
        shouldSchedule,
        schedule: formatDhakaDateTime(reminderAt),
        reminderAt,
        kickoffAt: kickoff
    };
}

/**
 * Load SMS gateway configuration from MongoDB Setting first, falling back to environment variables.
 */
export async function getSmsConfig() {
    let doc = null;
    try {
        await connectToDatabase();
        doc = await Setting.findOne().select('smsApiKey smsSenderId').lean();
    } catch {
        // Fallback to env vars if DB is unavailable
    }
    const apiKey = (doc?.smsApiKey || process.env.SMS_API_KEY || '').trim();
    const senderId = (doc?.smsSenderId || process.env.SMS_SENDER_ID || '').trim();
    return {
        apiKey,
        senderId,
        configured: Boolean(apiKey),
        source: doc?.smsApiKey ? 'db' : (process.env.SMS_API_KEY ? 'env' : 'none')
    };
}

async function persistSmsLog(entry) {
    try {
        await connectToDatabase();
        const doc = await SmsLog.create(entry);
        return doc.toJSON();
    } catch (err) {
        console.warn('[SMS] Failed to persist SmsLog:', err?.message || err);
        return null;
    }
}

/**
 * Send an SMS (immediate or scheduled) via https://api.sms.net.bd/sendsms.
 * Automatically records an SmsLog entry unless `logMeta === false`.
 */
export async function sendSms({ to, msg, schedule = '', senderId = '', contentId = '', logMeta = null }) {
    const parsedPhones = parsePhoneTokens(to);
    const recipients = parsedPhones.formatted;
    const cleanRecipients = parsedPhones.valid;
    const messageText = String(msg || '').trim();
    const sched = normalizeScheduleInput(schedule);

    if (!recipients) {
        return { ok: false, errorCode: 416, message: SMS_ERROR_MESSAGES[416] };
    }
    if (!messageText) {
        return { ok: false, errorCode: 414, message: SMS_ERROR_MESSAGES[414] };
    }
    if (sched && !SCHEDULE_RE.test(sched)) {
        return { ok: false, errorCode: 412, message: SMS_ERROR_MESSAGES[412] };
    }

    const cfg = await getSmsConfig();
    const effectiveSender = String(senderId || cfg.senderId || '').trim();
    const effectiveContentId = String(contentId || '').trim();
    const seg = estimateSmsParts(messageText);

    const shouldLog = logMeta !== false;
    const meta = (logMeta && typeof logMeta === 'object') ? logMeta : {};
    const category = meta.category || (cleanRecipients.length > 1 ? 'bulk_campaign' : 'manual');
    const defaultSummary = cleanRecipients.length === 1
        ? cleanRecipients[0]
        : `${cleanRecipients[0]} + ${cleanRecipients.length - 1} more`;
    const baseLog = {
        category,
        recipients: cleanRecipients,
        recipientCount: cleanRecipients.length,
        recipientSummary: meta.recipientSummary || defaultSummary,
        message: messageText,
        encoding: seg.encoding,
        partsPerRecipient: Math.max(1, seg.parts),
        totalSegments: Math.max(1, seg.parts) * cleanRecipients.length,
        schedule: sched,
        senderId: effectiveSender,
        contentId: effectiveContentId,
        bookingCode: meta.bookingCode || '',
        sentBy: meta.sentBy || 'System',
        userId: meta.userId || '',
        createdBy: meta.sentBy || 'System',
        updatedBy: meta.sentBy || 'System',
        createdById: meta.userId || '',
        updatedById: meta.userId || ''
    };

    if (!cfg.configured) {
        const errMsg = 'SMS gateway is not configured (set SMS_API_KEY in .env or Admin Settings).';
        const log = shouldLog
            ? await persistSmsLog({ ...baseLog, status: 'failed', errorCode: 405, errorMessage: errMsg })
            : null;
        return { ok: false, errorCode: 405, message: errMsg, log };
    }

    const params = new URLSearchParams();
    params.set('api_key', cfg.apiKey);
    params.set('msg', messageText);
    params.set('to', recipients);
    if (effectiveSender) params.set('sender_id', effectiveSender);
    if (sched) params.set('schedule', sched);
    if (effectiveContentId) params.set('content_id', effectiveContentId);

    const res = await fetch(`${SMS_API_BASE}/sendsms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });
    const data = await res.json().catch(() => ({}));
    const errorCode = Number(data?.error ?? (res.ok ? 0 : res.status));

    if (errorCode !== 0) {
        const errMsg = smsErrorMessage(errorCode, data?.msg);
        const log = shouldLog
            ? await persistSmsLog({
                ...baseLog,
                status: 'failed',
                errorCode,
                errorMessage: errMsg,
                deliveryReport: data?.data || null
            })
            : null;
        return {
            ok: false,
            errorCode,
            message: errMsg,
            raw: data,
            log
        };
    }

    const requestId = String(data?.data?.request_id ?? '');
    const log = shouldLog
        ? await persistSmsLog({
            ...baseLog,
            requestId,
            status: sched ? 'scheduled' : 'submitted',
            gatewayStatus: sched ? 'Scheduled' : 'Submitted'
        })
        : null;

    return {
        ok: true,
        errorCode: 0,
        requestId,
        message: data?.msg || 'Request successfully submitted',
        recipients,
        recipientCount: cleanRecipients.length,
        schedule: sched || null,
        raw: data,
        log
    };
}

/** Never throws: safe for booking & payment pipelines. */
export async function safeSendSms(params) {
    try {
        const res = await sendSms(params);
        if (!res.ok) {
            console.warn('[SMS] Delivery failed:', res.errorCode, res.message);
        }
        return res;
    } catch (err) {
        console.error('[SMS] Request error:', err?.message || err);
        return { ok: false, errorCode: 409, message: err?.message || 'SMS request failed' };
    }
}

/** GET https://api.sms.net.bd/report/request/{id}/?api_key=... */
export async function getSmsReport(requestId) {
    const cfg = await getSmsConfig();
    if (!cfg.configured) {
        return { ok: false, errorCode: 405, message: 'SMS gateway is not configured.' };
    }
    const id = encodeURIComponent(String(requestId || '').trim());
    if (!id) return { ok: false, errorCode: 400, message: 'requestId is required.' };

    const res = await fetch(`${SMS_API_BASE}/report/request/${id}/?api_key=${encodeURIComponent(cfg.apiKey)}`, {
        method: 'GET',
        cache: 'no-store'
    });
    const data = await res.json().catch(() => ({}));
    const errorCode = Number(data?.error ?? (res.ok ? 0 : res.status));
    if (errorCode !== 0) {
        return { ok: false, errorCode, message: smsErrorMessage(errorCode, data?.msg), raw: data };
    }
    return { ok: true, errorCode: 0, report: data?.data || null, message: data?.msg || 'Success' };
}

/**
 * Fetch live delivery report from api.sms.net.bd and sync the matching SmsLog record in MongoDB.
 */
export async function syncSmsLogReport({ logId = '', requestId = '', actor = null } = {}) {
    await connectToDatabase();
    let logDoc = null;
    if (logId) {
        logDoc = await SmsLog.findById(logId).catch(() => null);
    }
    const effectiveReqId = String(requestId || logDoc?.requestId || '').trim();
    if (!effectiveReqId) {
        return { ok: false, errorCode: 400, message: 'No gateway Request ID available for this SMS record.' };
    }
    if (!logDoc) {
        logDoc = await SmsLog.findOne({ requestId: effectiveReqId }).sort({ createdAt: -1 }).catch(() => null);
    }

    const reportRes = await getSmsReport(effectiveReqId);
    if (!reportRes.ok) {
        return reportRes;
    }

    const report = reportRes.report || {};
    if (logDoc) {
        const reqStatus = String(report.request_status || '').trim();
        const recips = Array.isArray(report.recipients) ? report.recipients : [];
        let nextStatus = logDoc.status;

        if (/complete/i.test(reqStatus)) {
            if (recips.length > 0) {
                const failedCount = recips.filter(r => /fail|reject|block|invalid|undeliver/i.test(String(r.status || ''))).length;
                if (failedCount === recips.length) nextStatus = 'failed';
                else if (failedCount > 0) nextStatus = 'partial';
                else nextStatus = 'completed';
            } else {
                nextStatus = 'completed';
            }
        } else if (/fail|reject|cancel/i.test(reqStatus)) {
            nextStatus = 'failed';
        } else if (/schedule/i.test(reqStatus) || (logDoc.schedule && /pending|queue/i.test(reqStatus))) {
            nextStatus = 'scheduled';
        }

        logDoc.status = nextStatus;
        logDoc.gatewayStatus = reqStatus || logDoc.gatewayStatus;
        if (report.request_charge !== undefined && report.request_charge !== null) {
            logDoc.charge = String(report.request_charge);
        }
        logDoc.deliveryReport = report;
        logDoc.lastCheckedAt = new Date();
        applyUpdateAudit(logDoc, actor, { fallback: 'SMS Gateway Sync', backfillUserId: true });
        await logDoc.save().catch(() => {});
    }

    return {
        ok: true,
        errorCode: 0,
        report,
        log: logDoc ? logDoc.toJSON() : null,
        message: reportRes.message
    };
}

/** GET https://api.sms.net.bd/user/balance/?api_key=... */
export async function getSmsBalance() {
    const cfg = await getSmsConfig();
    if (!cfg.configured) {
        return { ok: false, errorCode: 405, configured: false, balance: null, validity: '', message: 'SMS gateway is not configured.' };
    }
    const res = await fetch(`${SMS_API_BASE}/user/balance/?api_key=${encodeURIComponent(cfg.apiKey)}`, {
        method: 'GET',
        cache: 'no-store'
    });
    const data = await res.json().catch(() => ({}));
    const errorCode = Number(data?.error ?? (res.ok ? 0 : res.status));
    if (errorCode !== 0) {
        return { ok: false, errorCode, configured: true, balance: null, validity: '', message: smsErrorMessage(errorCode, data?.msg), raw: data };
    }
    return {
        ok: true,
        errorCode: 0,
        configured: true,
        balance: data?.data?.balance ?? '0.0000',
        validity: data?.data?.validity ?? '',
        message: data?.msg || 'Success'
    };
}

/**
 * Resolve server-side audience presets into deduplicated 11-digit BD mobile numbers.
 */
export async function resolveSmsAudiencePhones(audienceKeys = []) {
    const keys = [...new Set((Array.isArray(audienceKeys) ? audienceKeys : []).map(String))];
    if (keys.length === 0) return { phones: [], labels: [] };

    await connectToDatabase();
    const phoneSet = new Set();
    const labels = [];
    const addPhone = (raw) => {
        const p = cleanPhone(raw);
        if (isValidBdPhone(p)) phoneSet.add(p);
    };

    const tasks = [];

    if (keys.includes('all_customers')) {
        labels.push('All Customers');
        tasks.push(
            Customer.find().select('phone').lean().then(rows => rows.forEach(r => addPhone(r.phone)))
        );
    }

    if (keys.includes('booked_customers') || keys.includes('repeat_customers')) {
        const minCount = keys.includes('booked_customers') ? 1 : 2;
        labels.push(minCount === 1 ? 'Booked Customers' : 'Repeat Customers (2+)');
        tasks.push(
            Booking.aggregate([
                { $match: { paymentStatus: { $in: ['confirmed_unpaid', 'paid_advance', 'paid_full'] } } },
                { $group: { _id: '$captainPhone', count: { $sum: 1 } } },
                { $match: { count: { $gte: minCount } } }
            ]).then(rows => rows.forEach(r => addPhone(r._id)))
        );
    }

    if (keys.includes('today_captains')) {
        const today = todayDhaka();
        labels.push(`Today's Match Captains (${today})`);
        tasks.push(
            Booking.find({
                date: today,
                paymentStatus: { $in: ['confirmed_unpaid', 'paid_advance', 'paid_full'] }
            }).select('captainPhone').lean().then(rows => rows.forEach(r => addPhone(r.captainPhone)))
        );
    }

    if (keys.includes('all_players')) {
        labels.push('Registered Players');
        tasks.push(
            User.find({ role: 'player', disabled: { $ne: true } }).select('phone').lean()
                .then(rows => rows.forEach(r => addPhone(r.phone)))
        );
    }

    if (keys.includes('active_investors')) {
        labels.push('Active Investors');
        tasks.push(
            Investor.find({ status: 'active' }).select('phone').lean()
                .then(rows => rows.forEach(r => addPhone(r.phone)))
        );
    }

    if (keys.includes('staff_admins')) {
        labels.push('Staff & Admins');
        tasks.push(
            User.find({ role: { $in: ['staff', 'admin'] }, disabled: { $ne: true } }).select('phone').lean()
                .then(rows => rows.forEach(r => addPhone(r.phone)))
        );
    }

    await Promise.all(tasks);
    return { phones: [...phoneSet], labels };
}

/* ------------------------------------------------------------------ Copy builders */

const fmtTk = (n) => `Tk ${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export function buildBookingConfirmedSms(booking) {
    const code = booking?.bookingCode || '';
    const slot = booking?.displayTime || `Slot #${booking?.slotNumber || ''}`;
    const total = Number(booking?.totalPrice || 0);
    const paid = Number(booking?.advanceAmount || 0);
    const due = Number(booking?.dueAmount ?? Math.max(0, total - paid));
    return `Crossbar Metro Arena: Booking CONFIRMED (${code}) for ${booking?.teamName || 'Squad'}. Date: ${booking?.date}, Time: ${slot}. Paid: ${fmtTk(paid)}, Due: ${fmtTk(due)}. Arrive 15 mins early.`;
}

export function buildPaymentSuccessSms(booking, paidAmount) {
    const code = booking?.bookingCode || '';
    const slot = booking?.displayTime || `Slot #${booking?.slotNumber || ''}`;
    const paid = Number(paidAmount ?? booking?.advanceAmount ?? 0);
    const total = Number(booking?.totalPrice || 0);
    const due = Number(booking?.dueAmount ?? Math.max(0, total - Number(booking?.advanceAmount || 0)));
    return `Crossbar Metro Arena: Payment of ${fmtTk(paid)} RECEIVED! Booking ${code} confirmed for ${booking?.date} (${slot}). Due at arena: ${fmtTk(due)}. See you on the pitch!`;
}

export function buildPreMatchReminderSms(booking) {
    const code = booking?.bookingCode || '';
    const slot = booking?.displayTime || `Slot #${booking?.slotNumber || ''}`;
    const due = Number(booking?.dueAmount || 0);
    const dueText = due > 0 ? ` Due at desk: ${fmtTk(due)}.` : '';
    return `Crossbar Metro Arena Reminder: Your match (${code} - ${booking?.teamName || 'Squad'}) kicks off in 15 mins (${slot}).${dueText} Turf/AG shoes only. Uttara Sector 17.`;
}

/* ------------------------------------------------------------------ High-level hooks */

async function resolveBookingCustomerEmail(booking, explicitEmail = '') {
    if (isDeliverableEmail(explicitEmail)) return String(explicitEmail).trim().toLowerCase();
    try {
        await connectToDatabase();
        if (booking?.userId) {
            const u = await User.findById(booking.userId).select('email').lean().catch(() => null);
            if (isDeliverableEmail(u?.email)) return String(u.email).trim().toLowerCase();
        }
        const phone = cleanPhone(booking?.captainPhone);
        if (phone) {
            const [u, c] = await Promise.all([
                User.findOne({ phone }).select('email').lean().catch(() => null),
                Customer.findOne({ phone }).select('email').lean().catch(() => null)
            ]);
            if (isDeliverableEmail(u?.email)) return String(u.email).trim().toLowerCase();
            if (isDeliverableEmail(c?.email)) return String(c.email).trim().toLowerCase();
        }
    } catch {
        // ignore lookup failures
    }
    return '';
}

function bookingRecipientSummary(booking) {
    const phone = cleanPhone(booking?.captainPhone);
    const label = booking?.captainName || booking?.teamName || '';
    return label ? `${label} (${phone})` : phone;
}

/**
 * Schedule the 15-minute pre-match reminder SMS directly with sms.net.bd (`schedule` parameter).
 * Idempotent: skips if already scheduled or sent on this booking.
 */
export async function scheduleBookingReminderSms(booking) {
    if (!booking || !booking.captainPhone || booking.paymentStatus === 'cancelled') {
        return { ok: false, skipped: true, reason: 'not_eligible' };
    }
    if (booking.reminderSmsRequestId || booking.reminderSmsSentAt) {
        return { ok: true, skipped: true, reason: 'already_scheduled', requestId: booking.reminderSmsRequestId || '' };
    }

    const { shouldSchedule, schedule, reminderAt } = computeReminderSchedule(booking.date, booking.startTime, 15);
    if (!shouldSchedule) {
        return { ok: false, skipped: true, reason: 'within_15_mins_or_past' };
    }

    const res = await safeSendSms({
        to: booking.captainPhone,
        msg: buildPreMatchReminderSms(booking),
        schedule,
        logMeta: {
            category: 'pre_match_reminder',
            bookingCode: booking.bookingCode || '',
            recipientSummary: bookingRecipientSummary(booking),
            sentBy: 'System (15m Reminder)'
        }
    });

    if (res.ok && booking._id) {
        await Booking.updateOne(
            { _id: booking._id },
            {
                $set: {
                    reminderSmsRequestId: res.requestId || 'scheduled',
                    reminderSmsScheduledAt: reminderAt
                }
            }
        ).catch(() => {});
    }
    return res;
}

/**
 * Called when a booking is confirmed (e.g. walk-in / pay-at-turf).
 * Sends immediate confirmation SMS + schedules 15-min pre-match reminder SMS.
 */
export async function notifyBookingConfirmed(booking, { customerEmail = '' } = {}) {
    if (!booking) return { sms: null, reminder: null, email: null };
    const [sms, reminder] = await Promise.all([
        safeSendSms({
            to: booking.captainPhone,
            msg: buildBookingConfirmedSms(booking),
            logMeta: {
                category: 'booking_confirmed',
                bookingCode: booking.bookingCode || '',
                recipientSummary: bookingRecipientSummary(booking),
                sentBy: 'System (Booking)'
            }
        }),
        scheduleBookingReminderSms(booking)
    ]);

    if (sms.ok && booking._id && sms.requestId) {
        await Booking.updateOne(
            { _id: booking._id },
            { $set: { confirmSmsRequestId: sms.requestId } }
        ).catch(() => {});
    }

    let email = { sent: false, reason: 'not_requested' };
    const toEmail = await resolveBookingCustomerEmail(booking, customerEmail);
    if (toEmail) {
        email = await safeSendBookingConfirmationEmail({
            toEmail,
            booking,
            paidAmount: booking.advanceAmount || 0,
            gateway: booking.paymentMethod || 'Counter'
        });
    }

    return { sms, reminder, email };
}

/**
 * Called when a payment succeeds (EPS, SSLCommerz, or counter advance/full payment).
 * Sends payment confirmation SMS + sends booking & payment confirmation email + schedules 15-min reminder SMS.
 */
export async function notifyPaymentSuccess(booking, { paidAmount, customerEmail = '', gateway = '' } = {}) {
    if (!booking) return { sms: null, reminder: null, email: null };
    const toEmail = await resolveBookingCustomerEmail(booking, customerEmail);

    const [sms, reminder, email] = await Promise.all([
        safeSendSms({
            to: booking.captainPhone,
            msg: buildPaymentSuccessSms(booking, paidAmount),
            logMeta: {
                category: 'payment_success',
                bookingCode: booking.bookingCode || '',
                recipientSummary: bookingRecipientSummary(booking),
                sentBy: `System (${gateway || booking.paymentMethod || 'Payment'})`
            }
        }),
        scheduleBookingReminderSms(booking),
        toEmail
            ? safeSendBookingConfirmationEmail({
                toEmail,
                booking,
                paidAmount: paidAmount ?? booking.advanceAmount ?? 0,
                gateway: gateway || booking.paymentMethod || 'Online'
            })
            : Promise.resolve({ sent: false, reason: 'no_deliverable_email' })
    ]);

    if (sms.ok && booking._id && sms.requestId) {
        await Booking.updateOne(
            { _id: booking._id },
            { $set: { paymentSmsRequestId: sms.requestId } }
        ).catch(() => {});
    }

    return { sms, reminder, email };
}
