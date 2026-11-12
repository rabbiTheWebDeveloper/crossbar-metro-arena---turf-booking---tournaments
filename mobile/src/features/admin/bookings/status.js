import { colors, tones } from '@/theme';

/**
 * Label + tone of the status pill shown on a booking (same rules as the website's admin pages).
 *   unpaidLabel: wording for "confirmed_unpaid" ("Pay at arena" on lists, "Unpaid" on the schedule)
 *   holdLabel:   wording for a live payment-gateway hold
 */
export function bookingPill(booking, { unpaidLabel = 'Pay at arena', holdLabel = 'Paying…' } = {}) {
    if (!booking) return null;
    const status = booking.paymentStatus;
    if (status === 'cancelled') return { label: 'Cancelled', tone: 'danger' };
    if (booking.played) return { label: 'Played', tone: 'info' };
    if (status === 'paid_full') return { label: 'Paid', tone: 'success' };
    if (status === 'paid_advance') return { label: 'Advance paid', tone: 'success' };
    if (status === 'confirmed_unpaid') return { label: unpaidLabel, tone: 'warning' };
    if (status === 'needs_refund') return { label: 'Needs refund', tone: 'danger' };
    if (status === 'pending_payment') return { label: holdLabel, tone: 'neutral' };
    return { label: String(status || 'unknown').replace(/_/g, ' '), tone: 'neutral' };
}

/** Money figures and which desk actions are allowed for a booking. */
export function bookingFlags(booking) {
    const status = booking?.paymentStatus;
    const isCancelled = status === 'cancelled';
    const isHold = status === 'pending_payment';
    const due = Number(booking?.dueAmount) || 0;
    return {
        isCancelled,
        isHold,
        due,
        paid: Number(booking?.advanceAmount) || 0,
        total: Number(booking?.totalPrice) || 0,
        canCollect: due > 0 && !isCancelled && !isHold,
        canMarkPlayed: !isCancelled && !isHold && !booking?.played,
        canUndoPlayed: !isCancelled && !!booking?.played,
        canCancel: !isCancelled
    };
}

/** Border / background of a slot row, by what is happening in the slot. */
export function slotSurface(booking) {
    if (!booking) return null;
    if (booking.played) return { borderColor: tones.info.border, backgroundColor: colors.infoSoft };
    if (booking.paymentStatus === 'pending_payment') return { borderColor: colors.borderStrong, borderStyle: 'dashed' };
    if (booking.paymentStatus === 'confirmed_unpaid') return { borderColor: tones.warning.border, backgroundColor: colors.warningSoft };
    return { borderColor: tones.success.border, backgroundColor: colors.successSoft };
}
