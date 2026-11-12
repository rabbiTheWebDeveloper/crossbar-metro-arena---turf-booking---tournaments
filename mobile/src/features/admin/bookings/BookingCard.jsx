import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Banknote, CheckCheck } from 'lucide-react-native';
import { AppText, Mono, Button, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { parseLocalDate, SHORT_MONTHS } from '@/lib/dateUtils';
import { bookingFlags } from './status';
import { BookingStatusBadge, BookingOriginBadge } from './BookingBadges';

/**
 * A booking in the "All bookings" list: play date tile, who, when, money, status and quick actions.
 * Tapping the card opens the full actions sheet (onPress).
 */
export function BookingCard({ booking, busy, onPress, onCollect, onMarkPlayed }) {
    const b = booking;
    const flags = bookingFlags(b);
    const d = parseLocalDate(b.date);
    const validDate = !Number.isNaN(d.getTime());
    const showActions = flags.canCollect || flags.canMarkPlayed;

    return (
        <Pressable
            onPress={() => onPress(b)}
            style={({ pressed }) => [styles.card, flags.isCancelled ? { opacity: 0.6 } : null, flags.isHold ? { borderStyle: 'dashed', borderColor: colors.borderStrong } : null, pressed ? { opacity: 0.8 } : null]}
            accessibilityRole="button"
            accessibilityLabel={`Booking ${b.bookingCode}`}
        >
            <View style={styles.dateTile}>
                <AppText size="xxs" tone="muted" weight="800" upper>{validDate ? SHORT_MONTHS[d.getMonth()] : '—'}</AppText>
                <AppText size="md" weight="900" mono>{validDate ? String(d.getDate()) : '—'}</AppText>
                {validDate ? <AppText size={9} tone="dim">{String(d.getFullYear())}</AppText> : null}
            </View>

            <View style={{ flex: 1, gap: 3 }}>
                <Row justify="space-between" align="flex-start" gap={6}>
                    <View style={{ flex: 1 }}>
                        <AppText size="sm" weight="800" numberOfLines={1}>{b.captainName || 'Booked'}</AppText>
                        <AppText size="xs" tone="muted" numberOfLines={1}>{b.teamName ? `${b.teamName} · ${b.bookingCode}` : String(b.bookingCode || '')}</AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <BookingStatusBadge booking={b} style={{ alignSelf: 'flex-end' }} />
                        <BookingOriginBadge booking={b} style={{ alignSelf: 'flex-end' }} />
                    </View>
                </Row>
                <Mono size="xs" tone="muted" weight="600" numberOfLines={1}>{`${b.displayTime || `${b.startTime} - ${b.endTime}`} · ${b.captainPhone || ''}`}</Mono>
                <Row wrap gap={6}>
                    <Mono size="xs" tone="brand">{`${formatMoney(flags.paid)} of ${formatMoney(flags.total)}`}</Mono>
                    {flags.canCollect ? <Mono size="xs" tone="warning">{`(Due ${formatMoney(flags.due)})`}</Mono> : null}
                    {flags.isHold ? <AppText size="xs" tone="dim">gateway hold</AppText> : null}
                </Row>
                {showActions ? (
                    <Row wrap gap={6} style={{ marginTop: 4 }}>
                        {flags.canCollect ? <Button title="Collect" icon={Banknote} variant="warning" size="sm" disabled={busy} onPress={() => onCollect(b)} /> : null}
                        {flags.canMarkPlayed ? <Button title="Mark played" icon={CheckCheck} variant="secondary" size="sm" loading={busy} onPress={() => onMarkPlayed(b)} /> : null}
                    </Row>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    dateTile: { width: 46, paddingVertical: 6, borderRadius: radius.md, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }
});
