/** Static option lists and status metadata for the player dashboard (same values as the website). */
import { titleCase } from '@/lib/format';

export const LEVELS = ['Casual', 'Semi-Pro', 'Competitive', 'Pro'];

export const POSITION_OPTIONS = [
    { value: 'FWD', label: 'Forward (FWD)' },
    { value: 'MID', label: 'Midfielder (MID)' },
    { value: 'DEF', label: 'Defender (DEF)' },
    { value: 'GK', label: 'Goalkeeper (GK)' }
];

export const SQUAD_ROLES = ['Player', 'Captain', 'Vice-Captain', 'Goalkeeper', 'Substitute'];

export const MATCH_TYPES = ['7v7 Friendly', '7v7 League Match', '5v5 Friendly', 'Tournament Match'];

export const EVENT_TYPES = [
    { value: 'goal', label: 'Goal' },
    { value: 'assist', label: 'Assist' },
    { value: 'own_goal', label: 'Own Goal' },
    { value: 'yellow', label: 'Yellow Card' },
    { value: 'red', label: 'Red Card' }
];

export const CHALLENGE_FORMATS = ['7 vs 7 Friendly Match', '7 vs 7 League Match', '5 vs 5 Friendly Match'];

export const LOOKING_FOR_OPTIONS = [
    { value: 'Opponent Team', label: 'Opponent Team' },
    { value: '1-2 Players', label: '1-2 Players to complete squad' },
    { value: 'Goalkeeper Needed', label: 'Goalkeeper needed' }
];

export const COST_SHARE_OPTIONS = [
    { value: '50/50 Split', label: '50/50 split of the slot fee' },
    { value: 'We pay the slot', label: 'We pay the slot' },
    { value: 'Opponent pays the slot', label: 'Opponent pays the slot' }
];

/** Value used by the "Opponent Team" picker for a side that is not registered yet. */
export const OTHER_TEAM = '__other__';

export const MAX_SQUAD_SIZE = 20;

/** Booking payment status -> label, badge tone and a hint shown on upcoming bookings. */
const BOOKING_STATUS_META = {
    pending_payment: { label: 'Payment in progress', tone: 'info', hint: 'Online payment has not completed yet. The slot is held briefly while you pay.' },
    confirmed_unpaid: { label: 'Confirmed · pay at arena', tone: 'warning', hint: 'No payment collected yet. Settle the fee at the arena desk before kick-off.' },
    paid_advance: { label: 'Advance paid', tone: 'success', hint: 'Advance received. Pay the balance at the arena desk on match day.' },
    paid_full: { label: 'Paid in full', tone: 'success', hint: '' },
    needs_refund: { label: 'Refund pending', tone: 'purple', hint: 'This slot was released. The arena desk will process your refund.' },
    cancelled: { label: 'Cancelled', tone: 'danger', hint: '' }
};
export const bookingStatusMeta = (s) => BOOKING_STATUS_META[s] || { label: titleCase(s || 'unknown'), tone: 'neutral', hint: '' };

/** Shorter labels used on the match pass list. */
const PASS_STATUS = {
    paid_full: { label: 'Paid', tone: 'success' },
    paid_advance: { label: 'Advance paid', tone: 'success' },
    confirmed_unpaid: { label: 'Pay at arena', tone: 'warning' },
    pending_payment: { label: 'Payment in progress', tone: 'info' },
    needs_refund: { label: 'Refund pending', tone: 'purple' }
};
export const passStatus = (s) => PASS_STATUS[s] || { label: titleCase(s || 'confirmed'), tone: 'neutral' };

export const RESULT_STATUS_TONE = { published: 'success', pending_approval: 'warning', rejected: 'danger' };
export const CHALLENGE_STATUS_TONE = { open: 'success', matched: 'info', closed: 'neutral' };

const SHOP_ORDER_STATUS = {
    reserved_pickup: { label: 'Awaiting pickup', tone: 'warning' },
    picked_up: { label: 'Collected', tone: 'success' },
    collected: { label: 'Collected', tone: 'success' },
    cancelled: { label: 'Cancelled', tone: 'danger' }
};
export const shopOrderStatus = (s) => SHOP_ORDER_STATUS[s] || { label: titleCase(s || 'reserved'), tone: 'neutral' };

const REGISTRATION_STATUS = {
    pending: { label: 'Pending', tone: 'warning' },
    confirmed: { label: 'Confirmed', tone: 'success' },
    verified: { label: 'Confirmed', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' }
};
export const registrationStatus = (s) => REGISTRATION_STATUS[s] || { label: titleCase(s || 'pending'), tone: 'neutral' };

/** Jersey colours offered when creating / editing a team (the phone has no native colour picker). */
export const DEFAULT_TEAM_COLOR = '#4cbf02';
export const TEAM_COLORS = [
    '#4cbf02', '#16a34a', '#14b8a6', '#38bdf8', '#2563eb', '#4f46e5', '#a78bfa', '#db2777',
    '#f43f5e', '#dc2626', '#f97316', '#fbbf24', '#facc15', '#ffffff', '#94a3b8', '#111827'
];

/** Dark or light text for a label printed on top of `hex`. */
export function readableOn(hex) {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || ''));
    if (!m) return '#04130c';
    const n = parseInt(m[1], 16);
    const luminance = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return luminance > 0.55 ? '#04130c' : '#ffffff';
}
