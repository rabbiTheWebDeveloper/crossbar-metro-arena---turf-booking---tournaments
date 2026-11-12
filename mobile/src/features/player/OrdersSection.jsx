import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingBag, Trophy } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, Row, Button, Badge, AppText, Mono, SectionHeader, EmptyState, Divider } from '@/components/ui';
import { spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/format';
import { paymentMethodLabel } from '@/data/finance';
import { shopOrderStatus, registrationStatus } from './constants';

const PAGE_SIZE = 6;

const itemsLabel = (order) => {
    if (Array.isArray(order?.items) && order.items.length) {
        return order.items.map(i => `${i.name}${i.size ? ` (${i.size})` : ''} ×${i.quantity || 1}`).join(', ');
    }
    return order?.productName || 'Shop order';
};

/**
 * Read-only history of the player's own shop pickup orders and tournament registrations
 * (the API returns only the caller's records for a player account).
 */
export function OrdersSection() {
    const router = useRouter();
    const { shopReservations, registrations } = useArena();
    const [ordersShown, setOrdersShown] = useState(PAGE_SIZE);
    const [regsShown, setRegsShown] = useState(PAGE_SIZE);
    const orders = shopReservations || [];
    const regs = registrations || [];

    return (
        <>
            <Card style={{ gap: spacing.md }}>
                <SectionHeader title={`My Shop Orders (${orders.length})`} subtitle="Items reserved for pickup at the arena counter." action="Shop" onAction={() => router.navigate('/shop')} style={{ marginBottom: 0 }} />
                {orders.length === 0 ? (
                    <EmptyState
                        icon={ShoppingBag}
                        title="No shop orders yet"
                        message="Reserve gear in the arena shop and collect it at the counter."
                        action={<Button title="Open the shop" size="sm" onPress={() => router.navigate('/shop')} style={{ marginTop: spacing.sm }} />}
                        style={{ paddingVertical: spacing.lg }}
                    />
                ) : orders.slice(0, ordersShown).map((o, i) => {
                    const status = shopOrderStatus(o.status);
                    return (
                        <View key={o.id} style={{ gap: 4 }}>
                            {i > 0 ? <Divider style={{ marginVertical: 0, marginBottom: spacing.sm }} /> : null}
                            <Row justify="space-between" gap={spacing.sm}>
                                <Mono size="sm" tone="brand" weight="900">{o.reservationCode || ''}</Mono>
                                <Badge tone={status.tone} label={status.label} />
                            </Row>
                            <AppText size="sm" weight="700">{itemsLabel(o)}</AppText>
                            <Row justify="space-between" gap={spacing.sm}>
                                <AppText size="xs" tone="muted">{o.pickupDate ? `Pickup: ${formatIsoDate(o.pickupDate)}` : 'Pickup at the arena counter'}</AppText>
                                <Mono size="sm">{formatMoney(o.totalAmount)}</Mono>
                            </Row>
                        </View>
                    );
                })}
                {orders.length > ordersShown ? (
                    <Button title={`Show more (${orders.length - ordersShown})`} variant="secondary" size="sm" onPress={() => setOrdersShown(n => n + PAGE_SIZE)} />
                ) : null}
            </Card>

            <Card style={{ gap: spacing.md }}>
                <SectionHeader title={`My Tournament Entries (${regs.length})`} subtitle="Squads you registered for arena events." action="Events" onAction={() => router.push('/events')} style={{ marginBottom: 0 }} />
                {regs.length === 0 ? (
                    <EmptyState
                        icon={Trophy}
                        title="No tournament entries yet"
                        message="Register your squad for an upcoming arena event."
                        action={<Button title="Browse events" size="sm" onPress={() => router.push('/events')} style={{ marginTop: spacing.sm }} />}
                        style={{ paddingVertical: spacing.lg }}
                    />
                ) : regs.slice(0, regsShown).map((r, i) => {
                    const status = registrationStatus(r.status);
                    return (
                        <View key={r.id} style={{ gap: 4 }}>
                            {i > 0 ? <Divider style={{ marginVertical: 0, marginBottom: spacing.sm }} /> : null}
                            <Row justify="space-between" gap={spacing.sm} align="flex-start">
                                <AppText size="md" weight="800" style={{ flex: 1 }}>{r.tournamentTitle || 'Tournament'}</AppText>
                                <Badge tone={status.tone} label={status.label} />
                            </Row>
                            <AppText size="sm" tone="soft">{`Team: ${r.teamName || ''}`}</AppText>
                            <Row justify="space-between" gap={spacing.sm}>
                                <AppText size="xs" tone="muted">{`Entry fee via ${paymentMethodLabel(r.paymentMethod || 'bkash')}${r.transactionId ? ` · ${r.transactionId}` : ''}`}</AppText>
                                <Mono size="sm">{formatMoney(r.amount)}</Mono>
                            </Row>
                        </View>
                    );
                })}
                {regs.length > regsShown ? (
                    <Button title={`Show more (${regs.length - regsShown})`} variant="secondary" size="sm" onPress={() => setRegsShown(n => n + PAGE_SIZE)} />
                ) : null}
            </Card>
        </>
    );
}
