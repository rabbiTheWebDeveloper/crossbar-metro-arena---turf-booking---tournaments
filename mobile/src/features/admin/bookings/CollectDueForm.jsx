import React, { useState } from 'react';
import { View } from 'react-native';
import { Banknote } from 'lucide-react-native';
import { AppText, Input, Button, Notice, Row, KeyValue } from '@/components/ui';
import { formatMoney } from '@/lib/format';

/**
 * "Collect due balance" form: record a partial or full payment for a booking.
 *   onSubmit(amount) must resolve to { ok, error } (see useBookingDesk().collect)
 */
export function CollectDueForm({ booking, onSubmit, onCancel }) {
    const due = Number(booking?.dueAmount) || 0;
    const [amount, setAmount] = useState(String(due));
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        if (submitting) return;
        const value = Number(amount) || 0;
        if (value <= 0) { setError('Enter an amount greater than zero.'); return; }
        if (value > due) { setError(`Cannot collect more than the due ${formatMoney(due)}.`); return; }
        setSubmitting(true);
        const res = await onSubmit(value);
        setSubmitting(false);
        if (!res?.ok) setError(res?.error || 'Could not record the payment.');
    };

    return (
        <View style={{ gap: 12 }}>
            <AppText size="sm" tone="muted">
                {`${booking.captainName || 'Booked'}${booking.teamName ? ` (${booking.teamName})` : ''} · ${booking.bookingCode}`}
            </AppText>
            <View>
                <KeyValue label="Paid so far" value={formatMoney(booking.advanceAmount)} mono />
                <KeyValue label="Due" value={formatMoney(due)} tone="warning" mono bold />
            </View>
            <Input
                label="Amount to collect (৳)"
                type="number"
                icon={Banknote}
                value={amount}
                onChangeText={(t) => { setAmount(t.replace(/[^0-9.]/g, '')); setError(''); }}
                hint="Partial amounts are fine; the status updates from what has been paid."
                returnKeyType="done"
                onSubmitEditing={submit}
            />
            {error ? <Notice type="error" message={error} /> : null}
            <Row>
                <Button title="Cancel" variant="secondary" onPress={onCancel} disabled={submitting} style={{ flex: 1 }} />
                <Button title={submitting ? 'Saving…' : 'Record payment'} loading={submitting} onPress={submit} style={{ flex: 1.4 }} />
            </Row>
        </View>
    );
}
