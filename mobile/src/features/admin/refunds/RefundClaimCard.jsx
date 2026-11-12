import React from 'react';
import { View } from 'react-native';
import { AppText, Badge, Button, Card, Divider, Mono, Row } from '@/components/ui';
import { formatMoney, formatDate, paymentMethodLabel } from '@/data/finance';
import { refundStatusLabel, refundStatusTone, refundReasonLabel } from './status';

/**
 * An open refund claim (pending or approved) with its Approve / Reject / Process actions.
 *   onApprove(refund)   onReject(refund)   onProcess(refund)
 */
export function RefundClaimCard({ refund, busy, onApprove, onReject, onProcess }) {
    const ref = refund;
    return (
        <Card tone={ref.status === 'approved' ? 'info' : 'warning'} style={{ gap: 8 }}>
            <Row justify="space-between">
                <Mono size="sm">{ref.bookingCode || '—'}</Mono>
                <Badge label={refundStatusLabel(ref.status)} tone={refundStatusTone(ref.status)} />
            </Row>

            <View style={{ gap: 2 }}>
                <AppText size="md" weight="800">{ref.customerName || '—'}</AppText>
                <Mono size="xs" tone="muted" weight="600">{ref.customerPhone || '—'}</Mono>
                <AppText size="xs" tone="muted" style={{ marginTop: 4 }}>{`Reason: ${refundReasonLabel(ref.reason)}`}</AppText>
                <AppText size="xs" tone="dim">
                    {`Requested ${formatDate(ref.requestDate, { year: true })}${ref.refundMethod ? ` · prefers ${paymentMethodLabel(ref.refundMethod)}` : ''}`}
                </AppText>
            </View>

            <Divider style={{ marginVertical: 2 }} />

            <Row justify="space-between" wrap gap={8}>
                <Mono size="lg" tone="warning">{formatMoney(ref.amount)}</Mono>
                <Row gap={6}>
                    {ref.status === 'pending' ? <Button title="Approve" variant="secondary" size="sm" loading={busy} onPress={() => onApprove(ref)} /> : null}
                    <Button title="Reject" variant="danger" size="sm" disabled={busy} onPress={() => onReject(ref)} />
                    <Button title="Process" size="sm" disabled={busy} onPress={() => onProcess(ref)} />
                </Row>
            </Row>
        </Card>
    );
}
