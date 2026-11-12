import React from 'react';
import { Badge } from '@/components/ui';
import { bookingPill } from './status';

/** Status pill of a booking (Paid / Advance paid / Pay at arena / Played / Cancelled ...). */
export function BookingStatusBadge({ booking, unpaidLabel, holdLabel, style }) {
    const pill = bookingPill(booking, { unpaidLabel, holdLabel });
    if (!pill) return null;
    return <Badge label={pill.label} tone={pill.tone} style={style} />;
}

/** "FIXED" (part of a weekly series) or "WALK-IN" (counter booking) marker. */
export function BookingOriginBadge({ booking, style }) {
    if (!booking) return null;
    if (booking.isRecurring) return <Badge label="Fixed" tone="neutral" style={style} />;
    if (booking.isWalkIn) return <Badge label="Walk-in" tone="neutral" style={style} />;
    return null;
}
