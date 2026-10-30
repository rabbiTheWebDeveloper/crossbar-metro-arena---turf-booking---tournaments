import crypto from 'crypto';
import { Setting } from '@/models/Setting';
import { Booking } from '@/models/Booking';
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
    const settings = await Setting.getOrCreateSettings();
    const slotPrices = settings.slotPrices && settings.slotPrices.length === 12 ? settings.slotPrices : SCHEDULE_SLOTS_DEFINITION;
    return {
        settings,
        slotPrices,
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

/** Resolve add-on ids (or objects with ids) to the canonical catalogue entries and their total. */
export function resolveAddOns(input) {
    const ids = (Array.isArray(input) ? input : []).map(a => (typeof a === 'string' ? a : a?.id)).filter(Boolean);
    const addOns = [...new Set(ids)].map(id => BOOKING_ADDONS.find(a => a.id === id)).filter(Boolean)
        .map(a => ({ id: a.id, name: a.name, description: a.description, price: a.price, iconName: a.iconName || '' }));
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

/** Release payment holds whose timer ran out so the slot becomes bookable again. */
export async function expireStaleHolds() {
    await Booking.updateMany(
        { paymentStatus: 'pending_payment', holdExpiresAt: { $lt: Date.now() } },
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

/** Map an SSLCommerz card_type string to our paymentMethod enum. */
export function mapGatewayMethod(cardType = '') {
    const t = String(cardType).toLowerCase();
    if (t.includes('bkash')) return 'bkash';
    if (t.includes('nagad')) return 'nagad';
    if (t.includes('rocket') || t.includes('dbbl mobile')) return 'rocket';
    if (t.includes('upay')) return 'upay';
    return 'card';
}
