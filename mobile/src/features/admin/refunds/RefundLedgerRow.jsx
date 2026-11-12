import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Badge, Mono, Row } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatMoney, formatDate, paymentMethodLabel } from '@/data/finance';
import { refundStatusLabel, refundStatusTone } from './status';

/** A closed refund (completed or rejected) in the ledger. */
export function RefundLedgerRow({ refund }) {
    const ref = refund;
    const completed = ref.status === 'completed';
    const reference = completed
        ? `${paymentMethodLabel(ref.refundMethod)}${ref.transactionRef ? ` (${ref.transactionRef})` : ''}`
        : (ref.transactionRef || '—');
    return (
        <View style={styles.row}>
            <Row justify="space-between" align="flex-start">
                <View style={{ flex: 1 }}>
                    <Mono size="sm">{ref.bookingCode || '—'}</Mono>
                    <AppText size="xs" tone="soft">{`${ref.customerName || '—'} (${ref.customerPhone || '—'})`}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Mono size="sm" tone={completed ? 'brand' : 'dim'} style={completed ? null : { textDecorationLine: 'line-through' }}>{formatMoney(ref.amount)}</Mono>
                    <Badge label={refundStatusLabel(ref.status)} tone={refundStatusTone(ref.status)} style={{ alignSelf: 'flex-end' }} />
                </View>
            </Row>
            <AppText size="xs" tone="muted">{`${formatDate(ref.refundedDate || ref.requestDate, { year: true })} · ${reference || '—'}`}</AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { gap: 4, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }
});
