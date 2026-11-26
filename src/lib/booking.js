import crypto from 'crypto';
import { Setting } from '@/models/setting-model';
import { Booking } from '@/models/booking-model';
import { BookingAddOn } from '@/models/booking-addon-model';
import { SCHEDULE_SLOTS_DEFINITION, BOOKING_ADDONS } from '@/data/initialData';

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const ACTIVE_STATUSES = ['pending_payment', 'confirmed_unpaid', 'paid_advance', 'paid_full', 'needs_refund'];

/** Today's date in Asia/Dhaka as YYYY-MM-DD (the arena's local day, independent of server timezone). */
export function todayDhaka() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

/** Parse YYYY-MM-DD as a local-calendar date (never UTC midnight). */
export function parseLocalDate(iso) {
    const [y, m, d] = String(iso).split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function addDays(iso, days) {
    const d = parseLocalDate(iso);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isWeekend(dateIso, weekendDays = ['Friday', 'Saturday']) {
    return weekendDays.includes(DAY_NAMES[parseLocalDate(dateIso).getDay()]);
}

/** Kick-off as a real Date in Dhaka time (+06:00). */
export function kickoffDate(dateIso, startTime = '00:00') {
    return new Date(`${dateIso}T${startTime}:00+06:00`);
}

export async function loadPricing() {
    await BookingAddOn.ensureSeeded();
    const [settings, addOnDocs] = await Promise.all([
        Setting.getOrCreateSettings(),
        BookingAddOn.find({ enabled: { $ne: false } }).sort({ sortOrder: 1, createdAt: 1 })
    ]);
    const slotPrices = settings.slotPrices && settings.slotPrices.length === 12 ? settings.slotPrices : SCHEDULE_SLOTS_DEFINITION;
    const bookingAddOns = addOnDocs.map(doc => doc.toJSON());
    return {
        settings,
        slotPrices,
        bookingAddOns,
        weekendDays: settings.weekendDays && settings.weekendDays.length ? settings.weekendDays : ['Friday', 'Saturday'],
        advanceAmount: settings.advanceAmount ?? 500,
        holdMinutes: settings.holdMinutes ?? 10,
        bookingWindowDays: settings.bookingWindowDays ?? 60,
        cancellationHours: settings.cancellationHours ?? 24
    };
}

export function slotDefinition(slotPrices, slotNumber) {
    const n = Number(slotNumber);
    return slotPrices.find(s => Number(s.slotNumber) === n) || SCHEDULE_SLOTS_DEFINITION.find(s => s.slotNumber === n) || null;
}

/** Court price for one slot on one date according to admin pricing. */
export function slotPrice(pricing, dateIso, slotNumber) {
    const def = slotDefinition(pricing.slotPrices, slotNumber);
    if (!def) return null;
    return isWeekend(dateIso, pricing.weekendDays) ? Number(def.weekendPrice) : Number(def.weekdayPrice);
}

/** Resolve add-on ids (MongoDB ObjectId or slug) to active BookingAddOn model entries and their total. */
export function resolveAddOns(input, catalogue = BOOKING_ADDONS) {
    const activeList = (Array.isArray(catalogue) ? catalogue : BOOKING_ADDONS).filter(a => a && a.enabled !== false);
    const ids = (Array.isArray(input) ? input : []).map(a => (typeof a === 'string' ? a : (a?.id || a?.slug))).filter(Boolean);
    const seen = new Set();
    const addOns = [];
    for (const rawId of ids) {
        const key = String(rawId);
        const match = activeList.find(a => String(a.id || a._id || '') === key || (a.slug && a.slug === key));
        if (!match) continue;
        const resolvedId = String(match.id || match._id || match.slug);
        if (seen.has(resolvedId)) continue;
        seen.add(resolvedId);
        addOns.push({
            id: resolvedId,
            name: match.name,
            description: match.description || '',
            price: Number(match.price) || 0,
            iconName: match.iconName || ''
        });
    }
    return { addOns, addOnsPrice: addOns.reduce((s, a) => s + a.price, 0) };
}

/** Validate that a date is bookable (not in the past, within the booking window). */
export function validateBookingDate(dateIso, bookingWindowDays, { allowPast = false } = {}) {
    if (!isIsoDate(dateIso)) return 'Invalid date.';
    const today = todayDhaka();
    if (!allowPast && dateIso < today) return 'That date has already passed.';
    const last = addDays(today, bookingWindowDays);
    if (!allowPast && dateIso > last) return `Bookings open up to ${bookingWindowDays} days ahead (until ${last}).`;
    return null;
}

export function generateBookingCode(prefix = 'CMA') {
    // 6 unambiguous characters -> ~1 billion combinations
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(6);
    let out = '';
    for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
    return `${prefix}-${out}`;
}

export function generateTranId() {
    return `CMA-SSL-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

let lastHoldSweepAt = 0;

/** Release payment holds whose timer ran out so the slot becomes bookable again. */
export async function expireStaleHolds({ throttled = false } = {}) {
    const now = Date.now();
    if (throttled && now - lastHoldSweepAt < 20000) return;
    lastHoldSweepAt = now;
    await Booking.updateMany(
        { paymentStatus: 'pending_payment', holdExpiresAt: { $lt: now } },
        { $set: { paymentStatus: 'cancelled', notes: 'Payment hold expired' } }
    );
}

/** Find an active booking (or live payment hold) for a slot. */
export async function findActiveBooking(dateIso, slotNumber) {
    return Booking.findOne({ date: dateIso, slotNumber: Number(slotNumber), paymentStatus: { $in: ACTIVE_STATUSES } });
}

/** Derive the payment status from money collected. */
export function statusFromPayment(advance, total) {
    if (advance >= total && total > 0) return 'paid_full';
    if (advance > 0) return 'paid_advance';
    return 'confirmed_unpaid';
}

/** Public projection of a booking: enough to render availability, nothing personal. */
export function publicBookingView(b) {
    const j = typeof b.toJSON === 'function' ? b.toJSON() : b;
    return {
        id: j.id,
        date: j.date,
        slotNumber: j.slotNumber,
        startTime: j.startTime,
        endTime: j.endTime,
        displayTime: j.displayTime,
        courtId: j.courtId,
        teamName: j.teamName,
        paymentStatus: j.paymentStatus,
        holdExpiresAt: j.holdExpiresAt,
        isRecurring: !!j.isRecurring,
        isPublicView: true
    };
}

/** Map an EPS FinancialEntity or SSLCommerz card_type string to our paymentMethod enum. */
export function mapGatewayMethod(cardType = '') {
    const t = String(cardType).toLowerCase();
    if (t.includes('bkash')) return 'bkash';
    if (t.includes('nagad')) return 'nagad';
    if (t.includes('rocket') || t.includes('dbbl mobile')) return 'rocket';
    if (t.includes('upay')) return 'upay';
    if (t.includes('visa') || t.includes('master') || t.includes('amex') || t.includes('card')) return 'card';
    if (t.includes('bank') || t.includes('ibbl') || t.includes('city') || t.includes('brac')) return 'bank';
    if (t.includes('okwallet') || t.includes('eps')) return 'eps';
    return 'card';
}

function toIsoDateLocal(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Expand a recurrence rule into concrete YYYY-MM-DD dates.
 * `weekdays`: array of 0..6 (Sunday = 0). Empty array means "every day".
 */
export function expandDates({ startDate, endDate, weekdays }) {
    if (!isIsoDate(startDate) || !isIsoDate(endDate) || endDate < startDate) return [];
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
    const days = Array.isArray(weekdays) ? weekdays.map(Number).filter(n => n >= 0 && n <= 6) : [];
    const out = [];
    const cursor = new Date(start);
    while (cursor <= end) {
        if (days.length === 0 || days.includes(cursor.getDay())) out.push(toIsoDateLocal(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return out;
}

/**
 * Build deduplicated, sorted `(date, slotNumber)` session pairs from either:
 *   1. Explicit `raw.sessions = [{ date, slotNumber }, ...]`,
 *   2. `raw.specificDates` + `raw.slotNumbers`, OR
 *   3. `startDate` + `endDate` + `weekdays` + `slotNumbers`.
 */
export function resolveRequestedSessions(raw, data = {}) {
    if (Array.isArray(raw?.sessions) && raw.sessions.length > 0) {
        if (raw.sessions.length > 800) {
            return { error: 'Please keep one bulk series under 800 slot sessions.' };
        }
        const seen = new Set();
        const sessions = [];
        for (let i = 0; i < raw.sessions.length; i++) {
            const item = raw.sessions[i] || {};
            const date = String(item.date || '').trim();
            const slotNumber = Number(item.slotNumber);
            if (!isIsoDate(date)) {
                return { error: `Session #${i + 1}: enter a valid date (YYYY-MM-DD).` };
            }
            if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 12) {
                return { error: `Session on ${date}: select a valid time slot (1–12).` };
            }
            const key = `${date}#${slotNumber}`;
            if (seen.has(key)) continue;
            seen.add(key);
            sessions.push({ date, slotNumber });
        }
        sessions.sort((a, b) => (a.date === b.date ? a.slotNumber - b.slotNumber : a.date.localeCompare(b.date)));
        const distinctDates = [...new Set(sessions.map(s => s.date))];
        const distinctSlots = [...new Set(sessions.map(s => s.slotNumber))].sort((a, b) => a - b);
        const distinctWeekdays = [...new Set(distinctDates.map(d => parseLocalDate(d).getDay()))];
        return { sessions, dates: distinctDates, slots: distinctSlots, weekdays: distinctWeekdays };
    }

    const slotNumbers = Array.isArray(raw?.slotNumbers) ? raw.slotNumbers : [];
    const slots = [...new Set(slotNumbers.map(Number))]
        .filter(n => Number.isInteger(n) && n >= 1 && n <= 12)
        .sort((a, b) => a - b);
    if (slots.length === 0) {
        return { error: 'Select at least one time slot.' };
    }

    if (Array.isArray(raw?.specificDates) && raw.specificDates.length > 0) {
        const cleanDates = [...new Set(raw.specificDates.map(d => String(d || '').trim()))].filter(isIsoDate).sort();
        if (cleanDates.length === 0) {
            return { error: 'Pick at least one valid date.' };
        }
        if (cleanDates.length * slots.length > 800) {
            return { error: 'Please keep one bulk series under 800 bookings.' };
        }
        const sessions = [];
        for (const date of cleanDates) {
            for (const slotNumber of slots) sessions.push({ date, slotNumber });
        }
        const distinctWeekdays = [...new Set(cleanDates.map(d => parseLocalDate(d).getDay()))];
        return { sessions, dates: cleanDates, slots, weekdays: distinctWeekdays };
    }

    const startDate = data.startDate || raw?.startDate;
    const endDate = data.endDate || raw?.endDate;
    if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
        return { error: 'Select both a start date and an end date.' };
    }
    if (endDate < startDate) {
        return { error: 'End date must be on or after the start date.' };
    }
    if ((parseLocalDate(endDate) - parseLocalDate(startDate)) / 86400000 > 800) {
        return { error: 'A series can cover at most 800 days. Shorten the date range.' };
    }

    const weekdays = Array.isArray(raw?.weekdays) ? [...new Set(raw.weekdays.map(Number))] : [];
    if (weekdays.some(d => !Number.isInteger(d) || d < 0 || d > 6)) {
        return { error: 'Weekdays must be numbers from 0 (Sunday) to 6 (Saturday).' };
    }

    const dates = expandDates({ startDate, endDate, weekdays });
    if (dates.length === 0) {
        return { error: 'No dates match the selected weekdays in that date range.' };
    }
    if (dates.length * slots.length > 800) {
        return { error: `That is ${dates.length * slots.length} bookings. Please keep one series under 800 bookings.` };
    }

    const sessions = [];
    for (const date of dates) {
        for (const slotNumber of slots) sessions.push({ date, slotNumber });
    }
    return { sessions, dates, slots, weekdays };
}
