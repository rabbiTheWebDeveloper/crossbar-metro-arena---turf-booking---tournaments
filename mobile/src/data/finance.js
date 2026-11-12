/**
 * Shared finance constants and formatters used by the investor portal and the admin finance screens.
 * (Mobile port of the web `src/data/finance.js`; date/number formatting is delegated to src/lib.)
 */
import { formatMoney as fmtMoney, titleCase } from '../lib/format';
import { formatIsoDate, formatMonth as fmtMonth, shiftMonth as shift, buildMonthList as buildList, parseLocalDate as parseIso } from '../lib/dateUtils';

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
    return titleCase(k);
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
    upay: 'Upay',
    cheque: 'Cheque',
    cash: 'Cash',
    card: 'Card'
};

export const paymentMethodLabel = (method) => {
    if (!method) return '';
    return PAYMENT_METHOD_LABELS[method] || titleCase(method);
};

export const REFUND_STATUS_LABELS = { pending: 'Pending', approved: 'Approved', completed: 'Completed', rejected: 'Rejected' };

export const formatMoney = fmtMoney;

/** Parse `YYYY-MM-DD` (or `YYYY-MM`) as a local Date. Returns null when the string is not a date. */
export const parseLocalDate = (str) => {
    if (!str) return null;
    const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(str));
    if (!m) {
        const d = new Date(str);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = parseIso(`${m[1]}-${m[2]}-${m[3] || '01'}`);
    return Number.isNaN(d.getTime()) ? null : d;
};

/** `2026-10-05` -> `5 Oct`. Pass { year: true } / { weekday: 'short' } for longer forms. */
export const formatDate = (str, options = {}) => {
    if (!parseLocalDate(str)) return str || '';
    return formatIsoDate(String(str).slice(0, 10), { weekday: false, year: false, ...options });
};

/** `2026-10` -> `October 2026` */
export const formatMonth = (monthStr, options) => fmtMonth(monthStr, options);
export const shiftMonth = shift;
export const buildMonthList = buildList;

/** `06:00 AM – 07:30 AM` -> `06:00 AM` (the slot's start time, for compact chart labels) */
export const slotShortLabel = (displayTime, slotNumber) => {
    if (!displayTime) return `S${slotNumber ?? ''}`;
    return String(displayTime).split(/[–-]/)[0].trim();
};
