/**
 * Number / money / text formatters. Written by hand (no Intl) so output is identical on every device.
 */

/** 1234567 -> "12,34,567" (South-Asian grouping, as used on the website). */
export function formatNumber(value) {
    const n = Math.round(Number(value) || 0);
    const sign = n < 0 ? '-' : '';
    const digits = String(Math.abs(n));
    if (digits.length <= 3) return sign + digits;
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${sign}${rest},${last3}`;
}

/** 3500 -> "৳3,500" */
export const formatMoney = (value) => {
    const n = Math.round(Number(value) || 0);
    return n < 0 ? `-৳${formatNumber(Math.abs(n))}` : `৳${formatNumber(n)}`;
};
export const money = formatMoney;

/** 12.345 -> "12.3%" */
export const formatPercent = (value, digits = 1) => `${(Number(value) || 0).toFixed(digits)}%`;

/** "turf_maintenance" -> "Turf Maintenance" */
export const titleCase = (key) => String(key || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());

/** "Rahim Uddin" -> "RU" */
export const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';

/** Compact money for chart labels: 125000 -> "1.3L", 4500 -> "4.5k" */
export function compactMoney(value) {
    const n = Number(value) || 0;
    const abs = Math.abs(n);
    if (abs >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
    return String(Math.round(n));
}

export const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ''));

/** Human labels for booking payment statuses. */
export const BOOKING_STATUS_LABELS = {
    pending_payment: 'Awaiting payment',
    confirmed_unpaid: 'Confirmed · unpaid',
    paid_advance: 'Advance paid',
    paid_full: 'Paid in full',
    needs_refund: 'Refund pending',
    cancelled: 'Cancelled'
};
export const bookingStatusLabel = (s) => BOOKING_STATUS_LABELS[s] || titleCase(s);

/** Tone name (see theme.tones) for a booking payment status. */
export const bookingStatusTone = (s) => ({
    pending_payment: 'warning',
    confirmed_unpaid: 'info',
    paid_advance: 'warning',
    paid_full: 'success',
    needs_refund: 'purple',
    cancelled: 'danger'
}[s] || 'neutral');
