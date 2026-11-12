import React, { useRef } from 'react';
import { View, Linking } from 'react-native';
import { Banknote, CheckCircle2, CheckCheck, Undo2, Ticket, XCircle, Phone, ClipboardList } from 'lucide-react-native';
import { Sheet, AppText, Button, Row, KeyValue, Divider, Notice } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { formatIsoDate, formatDateTime } from '@/lib/dateUtils';
import { paymentMethodLabel } from '@/data/finance';
import { bookingFlags } from './status';
import { BookingStatusBadge, BookingOriginBadge } from './BookingBadges';
import { CollectDueForm } from './CollectDueForm';

/** Read-only summary of a booking shown at the top of the actions sheet. */
function BookingDetails({ booking, flags, unpaidLabel, holdLabel }) {
    const b = booking;
    const call = () => { Linking.openURL(`tel:${b.captainPhone}`).catch(() => { }); };
    return (
        <View style={{ gap: 10 }}>
            <Row wrap gap={6}>
                <BookingStatusBadge booking={b} unpaidLabel={unpaidLabel} holdLabel={holdLabel} />
                <BookingOriginBadge booking={b} />
            </Row>
            <View>
                <KeyValue label="Booking code" value={b.bookingCode || '—'} mono bold />
                <KeyValue label="Play date" value={formatIsoDate(b.date)} />
                <KeyValue label="Slot" value={b.displayTime || `${b.startTime} - ${b.endTime}`} mono />
                <KeyValue label="Captain" value={b.captainName || '—'} />
                {b.teamName ? <KeyValue label="Team" value={b.teamName} /> : null}
                <KeyValue label="Mobile" value={b.captainPhone || '—'} mono />
            </View>
            {b.captainPhone ? <Button title="Call captain" icon={Phone} variant="secondary" size="sm" onPress={call} style={{ alignSelf: 'flex-start' }} /> : null}
            <Divider style={{ marginVertical: 2 }} />
            <View>
                <KeyValue label="Total price" value={formatMoney(flags.total)} mono />
                <KeyValue label="Paid" value={formatMoney(flags.paid)} tone="brand" mono bold />
                {flags.due > 0 && !flags.isCancelled && !flags.isHold ? <KeyValue label="Due" value={formatMoney(flags.due)} tone="warning" mono bold /> : null}
                {b.paymentMethod ? <KeyValue label="Payment method" value={paymentMethodLabel(b.paymentMethod)} /> : null}
                {b.createdAt ? <KeyValue label="Booked on" value={formatDateTime(b.createdAt)} /> : null}
                {b.seriesLabel ? <KeyValue label="Series" value={b.seriesLabel} /> : null}
                {b.notes ? <KeyValue label="Notes" value={b.notes} /> : null}
            </View>
            {flags.isHold ? <Notice type="info" message="Gateway hold: the customer is paying online right now. The slot is released automatically if the payment is not completed." /> : null}
        </View>
    );
}

/**
 * Bottom sheet for one booking. Two modes:
 *   'actions': details + every desk action (collect, settle, played, pass, cancel)
 *   'collect': the "collect due balance" form
 * Action callbacks resolve to `null` when the admin backed out of a confirmation (the sheet then
 * stays open); any other result closes the sheet so the toast underneath is visible.
 */
export function BookingSheet({ booking, mode = 'actions', formKey, busy, unpaidLabel, holdLabel, onClose, onModeChange, onCollectSubmit, onSettle, onMarkPlayed, onCancel, onOpenPass }) {
    // Keep the last booking on screen while the sheet slides away
    const last = useRef({ booking: null, mode: 'actions', formKey: 0 });
    if (booking) last.current = { booking, mode, formKey };
    const { booking: b, mode: shownMode, formKey: shownKey } = last.current;
    if (!b) return null;

    const flags = bookingFlags(b);
    const collecting = shownMode === 'collect' && flags.canCollect;
    const run = async (action) => {
        const result = await action();
        if (result !== null) onClose();
    };

    return (
        <Sheet
            visible={!!booking}
            onClose={onClose}
            title={collecting ? 'Collect due balance' : (b.teamName || b.captainName || 'Booking')}
            subtitle={collecting ? undefined : `${b.bookingCode} · ${formatIsoDate(b.date, { year: false })} · ${b.displayTime || ''}`}
            icon={collecting ? Banknote : ClipboardList}
        >
            {collecting ? (
                <CollectDueForm key={`${b.id}-${shownKey}`} booking={b} onSubmit={onCollectSubmit} onCancel={onClose} />
            ) : (
                <>
                    <BookingDetails booking={b} flags={flags} unpaidLabel={unpaidLabel} holdLabel={holdLabel} />
                    <Divider style={{ marginVertical: 2 }} />
                    <View style={{ gap: 8 }}>
                        {flags.canCollect ? <Button title={`Collect · due ${formatMoney(flags.due)}`} icon={Banknote} variant="warning" disabled={busy} onPress={() => onModeChange('collect')} /> : null}
                        {flags.canCollect ? <Button title="Settle in full" icon={CheckCircle2} variant="secondary" disabled={busy} onPress={() => run(() => onSettle(b))} /> : null}
                        {flags.canMarkPlayed ? <Button title="Mark played" icon={CheckCheck} variant="info" disabled={busy} onPress={() => run(() => onMarkPlayed(b, true))} /> : null}
                        {flags.canUndoPlayed ? <Button title="Undo played" icon={Undo2} variant="secondary" disabled={busy} onPress={() => run(() => onMarkPlayed(b, false))} /> : null}
                        {!flags.isCancelled && !flags.isHold ? <Button title="Open digital pass" icon={Ticket} variant="outline" onPress={() => onOpenPass(b)} /> : null}
                        {flags.canCancel ? <Button title="Cancel booking" icon={XCircle} variant="danger" disabled={busy} onPress={() => run(() => onCancel(b))} /> : null}
                        {flags.isCancelled ? <AppText size="sm" tone="muted" center>This booking is cancelled. No further actions are available.</AppText> : null}
                    </View>
                </>
            )}
        </Sheet>
    );
}
