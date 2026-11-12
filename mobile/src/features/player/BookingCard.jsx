import React from 'react';
import { Ticket, Phone, X } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, Row, Badge, Button, AppText, Mono } from '@/components/ui';
import { spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/format';
import { openLink, telUrl } from '@/features/auth/links';
import { bookingStatusMeta } from './constants';

/**
 * One of the player's bookings with its money status and actions (pass, cancel / call to cancel).
 *   past: kick-off already passed or the booking was cancelled (read-only)
 *   canCancel: still inside the online cancellation window
 */
export function BookingCard({ booking: b, past, canCancel, cancelling, cancellationHours, onCancel }) {
    const { setActiveTicketPass, siteSettings, showNotice } = useArena();
    const meta = bookingStatusMeta(b?.paymentStatus);
    const isCancelled = b?.paymentStatus === 'cancelled';
    const isPendingPayment = b?.paymentStatus === 'pending_payment';
    const paid = Number(b?.advanceAmount) || 0;
    const due = Number(b?.dueAmount) || 0;
    const live = !past && !isCancelled;
    const cancelAllowed = live && !isPendingPayment && canCancel;
    const mustCall = live && !isPendingPayment && !canCancel;
    const deskPhone = siteSettings?.phone || '';
    const deskPhoneLabel = siteSettings?.phoneFormatted || siteSettings?.phone || 'the arena desk';

    const callDesk = () => {
        if (!deskPhone) { showNotice('info', `Online cancellation closes ${cancellationHours}h before kick-off. Please contact the arena desk.`); return; }
        openLink(telUrl(deskPhone), () => showNotice('error', `Could not open the phone dialer. Call ${deskPhoneLabel}.`));
    };

    return (
        <Card style={[{ gap: spacing.sm }, isCancelled || past ? { opacity: 0.75 } : null]}>
            <Row wrap gap={6}>
                <Mono size="xs" tone="brand" weight="900">{b?.bookingCode || ''}</Mono>
                <Badge tone={meta.tone} label={meta.label} />
                {b?.played ? <Badge label="Played" /> : null}
            </Row>
            <AppText size="md" weight="800">{`${b?.teamName || 'My squad'}${b?.courtName ? ` · ${b.courtName}` : ''}`}</AppText>
            <AppText size="sm" tone="muted">
                Kickoff: <AppText size="sm" weight="800">{formatIsoDate(b?.date)}</AppText> at <AppText size="sm" tone="brand" weight="800">{b?.displayTime || ''}</AppText>
            </AppText>
            <AppText size="sm" tone="soft" mono>
                {`Paid: ${formatMoney(paid)} · Due: `}<AppText size="sm" mono weight="800" tone={due > 0 ? 'warning' : 'brand'}>{formatMoney(due)}</AppText>
            </AppText>
            {meta.hint && !past ? <AppText size="xs" tone="dim">{meta.hint}</AppText> : null}
            {live && due > 0 ? (
                <Badge tone="warning" label={`Pay ${formatMoney(due)} at arena`} />
            ) : null}
            {live && due > 0 ? (
                <AppText size="xs" tone="dim">Online balance payment is not available. Pay the remaining amount at the arena desk.</AppText>
            ) : null}
            {mustCall ? (
                <AppText size="xs" tone="dim">{`Online cancellation closes ${cancellationHours}h before kick-off. Call ${deskPhoneLabel}.`}</AppText>
            ) : null}

            <Row wrap gap={8} style={{ marginTop: 2 }}>
                <Button title="View Pass" icon={Ticket} variant="secondary" size="sm" onPress={() => setActiveTicketPass(b)} />
                {cancelAllowed ? (
                    <Button title={cancelling ? 'Cancelling…' : 'Cancel Slot'} icon={X} variant="danger" size="sm" loading={cancelling} onPress={() => onCancel(b)} />
                ) : null}
                {mustCall ? (
                    <Button title={`Call to cancel (<${cancellationHours}h)`} icon={Phone} variant="ghost" size="sm" upper={false} onPress={callDesk} />
                ) : null}
            </Row>
        </Card>
    );
}
