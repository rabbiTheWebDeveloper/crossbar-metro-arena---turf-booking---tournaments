import { REFUND_STATUS_LABELS } from '@/data/finance';
import { titleCase } from '@/lib/format';

/** Tone (see theme.tones) of each refund status. */
export const REFUND_STATUS_TONES = { pending: 'warning', approved: 'info', completed: 'success', rejected: 'danger' };

export const refundStatusLabel = (status) => REFUND_STATUS_LABELS[status] || titleCase(status);
export const refundStatusTone = (status) => REFUND_STATUS_TONES[status] || 'neutral';

/** "player_cancelled" -> "Player cancelled" */
export const refundReasonLabel = (reason) => {
    const text = String(reason || 'player_cancelled').replace(/_/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
};
