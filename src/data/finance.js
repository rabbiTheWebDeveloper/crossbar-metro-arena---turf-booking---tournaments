/**
 * Shared finance constants and formatters used by the investor portal and the admin finance pages.
 * Dates are `YYYY-MM-DD` strings and are always parsed as LOCAL dates (never `new Date('YYYY-MM-DD')`).
 */

export const EXPENSE_CATEGORIES = [
    { key: 'turf_maintenance', label: 'Turf Maintenance' },
    { key: 'floodlight_electricity', label: 'Floodlights & Electricity' },
    { key: 'staff_wages', label: 'Staff Wages' },
    { key: 'rent', label: 'Rent / Lease' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'other', label: 'Other' }
];

export const EXPENSE_CATEGORY_LABELS = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.key, c.label]));

export const expenseCategoryLabel = (key) => {
    const k = String(key || '').toLowerCase();
    if (EXPENSE_CATEGORY_LABELS[k]) return EXPENSE_CATEGORY_LABELS[k];
    if (!k) return 'Other';
    return k.replaceAll('_', ' ').replace(/\b\w/g, ch => ch.toUpperCase());
};

export const INCOME_SOURCES = [
    { key: 'shop_sales', label: 'Shop Sales' },
    { key: 'event_fees', label: 'Tournament & Event Fees' },
    { key: 'sponsorship', label: 'Sponsorship' },
    { key: 'other', label: 'Other' }
];

/** Payout methods accepted by POST /api/payouts */
export const PAYOUT_METHODS = ['bank_transfer', 'bkash', 'nagad', 'rocket', 'cheque', 'cash'];
/** Refund methods accepted by PATCH /api/refunds/:id */
export const REFUND_METHODS = ['bkash', 'nagad', 'rocket', 'bank', 'bank_transfer', 'card', 'cash'];

export const PAYMENT_METHOD_LABELS = {
    bank_transfer: 'Bank Transfer',
    bank: 'Bank',
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
    cheque: 'Cheque',
    cash: 'Cash',
    card: 'Card'
};

export const paymentMethodLabel = (method) => {
    if (!method) return '';
    return PAYMENT_METHOD_LABELS[method] || String(method).replaceAll('_', ' ').replace(/\b\w/g, ch => ch.toUpperCase());
};

export const REFUND_STATUS_LABELS = { pending: 'Pending', approved: 'Approved', completed: 'Completed', rejected: 'Rejected' };

export const formatMoney = (num) => `৳${Math.round(Number(num) || 0).toLocaleString('en-IN')}`;

/** Parse `YYYY-MM-DD` (or `YYYY-MM`) as a local Date. Returns null when the string is not a date. */
export const parseLocalDate = (str) => {
    if (!str) return null;
    const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(str));
    if (!m) {
        const d = new Date(str);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3] || 1));
};

/** `2026-10-05` -> `5 Oct` (or whatever `options` asks for). Falls back to the raw string. */
export const formatDate = (str, options = { day: 'numeric', month: 'short' }) => {
    const d = parseLocalDate(str);
    if (!d) return str || '';
    return d.toLocaleDateString('en-US', options);
};

/** `2026-10` -> `October 2026` */
export const formatMonth = (monthStr, options = { month: 'long', year: 'numeric' }) => {
    const d = parseLocalDate(monthStr);
    if (!d) return monthStr || '';
    return d.toLocaleDateString('en-US', options);
};

/** Shift a `YYYY-MM` string by `delta` months. */
export const shiftMonth = (monthStr, delta) => {
    const d = parseLocalDate(monthStr) || new Date();
    const next = new Date(d.getFullYear(), d.getMonth() + delta, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
};

/** The last `count` months ending at `endMonth` (inclusive), oldest first: [{ key, label, short }] */
export const buildMonthList = (endMonth, count = 6) => {
    const list = [];
    for (let i = count - 1; i >= 0; i--) {
        const key = shiftMonth(endMonth, -i);
        list.push({ key, label: formatMonth(key).toUpperCase(), short: formatMonth(key, { month: 'short' }) });
    }
    return list;
};

/** `06:00 AM – 07:30 AM` -> `06:00 AM` (the slot's start time, for compact chart labels) */
export const slotShortLabel = (displayTime, slotNumber) => {
    if (!displayTime) return `S${slotNumber ?? ''}`;
    return String(displayTime).split(/[–-]/)[0].trim();
};
