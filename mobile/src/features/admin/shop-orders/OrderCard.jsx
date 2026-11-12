import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Row, AppText, Label, Mono, Badge, Button, Notice } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { formatIsoDate, formatDateTime } from '@/lib/dateUtils';
import { colors, radius, spacing } from '@/theme';

const STATUS_TONE = { collected: 'success', cancelled: 'danger' };

/**
 * One pickup reservation with its itemised lines and counter actions.
 *   busy: an action on this card is in flight      error: last failed update for this order
 */
export function OrderCard({ order: res, busy, error, onSetStatus }) {
    const isCollected = res.status === 'collected';
    const isCancelled = res.status === 'cancelled';
    const items = Array.isArray(res.items) && res.items.length ? res.items : null;
    const total = Number(res.totalAmount ?? res.price) || 0;
    const open = !isCollected && !isCancelled;

    return (
        <Card tone={open ? 'brand' : (isCancelled ? 'danger' : undefined)} style={[{ gap: spacing.md }, isCollected ? { opacity: 0.8 } : null, isCancelled ? { opacity: 0.6 } : null]}>
            <Row justify="space-between">
                <Mono size="md" tone="brand">{res.reservationCode}</Mono>
                <Badge tone={STATUS_TONE[res.status] || 'warning'} label={String(res.status || '').replace(/_/g, ' ')} />
            </Row>

            <View style={{ gap: 2 }}>
                <AppText size="sm" tone="muted">
                    Customer: <AppText size="sm" weight="700">{res.customerName}</AppText>
                    <AppText size="sm" tone="muted" mono>{` (${res.customerPhone || ''})`}</AppText>
                </AppText>
                {res.pickupDate ? <AppText size="xs" tone="dim">{`Pickup: ${formatIsoDate(res.pickupDate, { weekday: false })}`}</AppText> : null}
                {res.notes ? <AppText size="xs" tone="dim" italic>{`"${res.notes}"`}</AppText> : null}
            </View>

            {/* Itemised lines */}
            <View style={styles.lines}>
                {items ? items.map((it, i) => (
                    <Row key={`${it.productId || it.name}-${i}`} justify="space-between" style={styles.line}>
                        <View style={{ flex: 1 }}>
                            <AppText size="sm" weight="700" numberOfLines={1}>{it.name}</AppText>
                            <AppText size="xs" tone="dim" mono>{`× ${it.quantity}${it.size ? ` · size ${it.size}` : ''} · ${formatMoney(it.price)} each`}</AppText>
                        </View>
                        <Mono size="sm" tone="soft">{formatMoney((Number(it.price) || 0) * (Number(it.quantity) || 0))}</Mono>
                    </Row>
                )) : (
                    <View style={styles.line}>
                        <AppText size="sm" weight="700">{res.productName || 'Item'}</AppText>
                        {res.size ? <AppText size="xs" tone="dim" mono>{`Size/Variant: ${res.size}`}</AppText> : null}
                    </View>
                )}
                <Row justify="space-between" style={[styles.line, { borderBottomWidth: 0 }]}>
                    <Label>Total</Label>
                    <Mono size="lg" tone="brand">{formatMoney(total)}</Mono>
                </Row>
            </View>

            {error ? <Notice type="error" message={error} /> : null}

            {open ? (
                <Row gap={6} style={styles.actions}>
                    <Button title={busy ? 'Saving…' : 'Mark Collected (Paid)'} size="sm" loading={busy} onPress={() => onSetStatus('collected')} style={{ flex: 1 }} />
                    <Button title="Cancel" variant="danger" size="sm" disabled={busy} onPress={() => onSetStatus('cancelled')} />
                </Row>
            ) : null}
            {isCollected && res.collectedAt ? <AppText size="xs" tone="dim" mono>{`Collected ${formatDateTime(res.collectedAt)}`}</AppText> : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    lines: { borderRadius: radius.lg, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border },
    line: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    actions: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }
});
