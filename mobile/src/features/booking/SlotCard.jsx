import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Clock, Timer, ArrowRight } from 'lucide-react-native';
import { AppText, Heading, Label, Mono, Badge, Button, Row } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';
import { formatMoney } from '@/lib/format';

const STATUS_META = {
    available: { label: 'Available', tone: 'success', note: '' },
    on_hold: { label: 'On hold', tone: 'warning', note: 'In checkout' },
    booked: { label: 'Booked', tone: 'neutral', note: 'Reserved' },
    time_passed: { label: 'Time passed', tone: 'neutral', note: 'Unavailable' }
};

/**
 * One of the 12 daily slots: time, live status, rate and the "Book slot" action.
 *   slot: item from buildDaySlots()     rateLabel: "Weekday rate" / "Weekend rate (Fri/Sat)"
 */
export function SlotCard({ slot, rateLabel, onBook }) {
    const meta = STATUS_META[slot.status] || STATUS_META.time_passed;
    const isAvail = slot.status === 'available';
    const isHold = slot.status === 'on_hold';
    const isBooked = slot.status === 'booked';
    const isPassed = slot.status === 'time_passed';

    return (
        <View style={[styles.card, isAvail ? styles.available : null, isHold ? styles.hold : null, isBooked ? { opacity: 0.85 } : null, isPassed ? { opacity: 0.6 } : null]}>
            <Row justify="space-between">
                <Mono size="xs" tone="muted">{`Slot #${slot.slotNumber}`}</Mono>
                <Badge tone={meta.tone} label={meta.label} />
            </Row>

            <Heading level={3}>{slot.displayTime}</Heading>
            <Row gap={6}>
                <Clock size={13} color={colors.brand} />
                <AppText size="xs" tone="muted">90-Minute Match</AppText>
            </Row>

            {isBooked ? (
                <View style={styles.info}>
                    <Label>Booked by squad</Label>
                    <AppText size="sm" weight="800" numberOfLines={1}>{slot.bookedTeam || 'Confirmed Squad'}</AppText>
                </View>
            ) : null}

            {isHold ? (
                <View style={[styles.info, styles.infoHold]}>
                    <Row gap={5}>
                        <Timer size={13} color={colors.warning} />
                        <Label tone="warning">Payment in progress</Label>
                    </Row>
                    <AppText size="xs" tone="soft">The slot frees up automatically if the payment is not completed.</AppText>
                </View>
            ) : null}

            {isPassed ? (
                <View style={styles.info}>
                    <AppText size="xs" tone="dim">Kickoff time passed.</AppText>
                </View>
            ) : null}

            <Row justify="space-between" style={styles.footer}>
                <View style={{ flex: 1 }}>
                    <Label>{rateLabel}</Label>
                    <Mono size="lg" tone="brand" weight="900">{formatMoney(slot.price)}</Mono>
                </View>
                {isAvail
                    ? <Button title="Book Slot" size="sm" iconRight={ArrowRight} onPress={() => onBook(slot)} />
                    : <AppText size="xs" weight="700" tone="dim">{meta.note}</AppText>}
            </Row>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { gap: 6, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    available: { borderColor: colors.borderBrand },
    hold: { borderColor: tones.warning.border, backgroundColor: colors.warningSoft },
    info: { marginTop: 4, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass, gap: 2 },
    infoHold: { borderColor: tones.warning.border, backgroundColor: colors.warningSoft },
    footer: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }
});
