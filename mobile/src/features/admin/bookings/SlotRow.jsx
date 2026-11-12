import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Plus, Banknote, CheckCheck } from 'lucide-react-native';
import { AppText, Mono, Button, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { bookingFlags, slotSurface } from './status';
import { slotStartLabel } from './slots';
import { BookingStatusBadge, BookingOriginBadge } from './BookingBadges';

/**
 * One of the 12 slots of a day (Today and Schedule screens).
 *   slot: a row from buildDaySlots() -> { slotNumber, startTime, displayTime, price, booking }
 *   onPress(booking): open the booking            onWalkIn(slot): book the free slot at the counter
 *   onCollect(booking) / onMarkPlayed(booking): inline quick actions
 */
export function SlotRow({ slot, busy, unpaidLabel, holdLabel, onPress, onWalkIn, onCollect, onMarkPlayed }) {
    const b = slot.booking;
    const flags = bookingFlags(b);

    if (!b) {
        return (
            <View style={styles.row}>
                <View style={styles.time}>
                    <Mono size="sm">{slotStartLabel(slot.startTime)}</Mono>
                    <AppText size="xxs" tone="dim">{`Slot ${slot.slotNumber}`}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                    <AppText size="sm" tone="soft" weight="600">Not booked</AppText>
                    <Mono size="xs" tone="dim" weight="600">{formatMoney(slot.price)}</Mono>
                </View>
                {onWalkIn ? <Button title="Walk-in" icon={Plus} variant="outline" size="sm" onPress={() => onWalkIn(slot)} accessibilityLabel={`Book walk-in for ${slot.displayTime}`} /> : null}
            </View>
        );
    }

    const showActions = (flags.canCollect && onCollect) || (flags.canMarkPlayed && onMarkPlayed);
    return (
        <Pressable onPress={() => onPress && onPress(b)} style={({ pressed }) => [styles.row, slotSurface(b), pressed ? { opacity: 0.85 } : null]} accessibilityRole="button" accessibilityLabel={`Booking ${b.bookingCode}`}>
            <View style={styles.time}>
                <Mono size="sm">{slotStartLabel(slot.startTime)}</Mono>
                <AppText size="xxs" tone="dim">{`Slot ${slot.slotNumber}`}</AppText>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
                <Row justify="space-between" align="flex-start" gap={6}>
                    <View style={{ flex: 1 }}>
                        <AppText size="sm" weight="800" numberOfLines={1}>{b.captainName || 'Booked'}</AppText>
                        <AppText size="xs" tone="muted" numberOfLines={1}>{b.teamName ? `${b.teamName} · ${b.bookingCode}` : String(b.bookingCode || '')}</AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <BookingStatusBadge booking={b} unpaidLabel={unpaidLabel} holdLabel={holdLabel} style={{ alignSelf: 'flex-end' }} />
                        <BookingOriginBadge booking={b} style={{ alignSelf: 'flex-end' }} />
                    </View>
                </Row>
                <Row wrap gap={6}>
                    <Mono size="xs" tone="muted" weight="600">{`${formatMoney(flags.paid)} of ${formatMoney(flags.total)}`}</Mono>
                    {flags.due > 0 && !flags.isHold ? <Mono size="xs" tone="warning">{`(Due ${formatMoney(flags.due)})`}</Mono> : null}
                </Row>
                {showActions ? (
                    <Row wrap gap={6} style={{ marginTop: 4 }}>
                        {flags.canCollect && onCollect ? <Button title="Collect" icon={Banknote} variant="warning" size="sm" disabled={busy} onPress={() => onCollect(b)} /> : null}
                        {flags.canMarkPlayed && onMarkPlayed ? <Button title="Mark played" icon={CheckCheck} variant="secondary" size="sm" loading={busy} onPress={() => onMarkPlayed(b)} /> : null}
                    </Row>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    time: { width: 74 }
});
