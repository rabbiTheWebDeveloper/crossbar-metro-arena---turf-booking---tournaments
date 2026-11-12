import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Card, AppText, Label, Mono, Row } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';
import { formatMoney } from '@/lib/format';
import { formatTime12 } from '@/lib/dateUtils';
import { PulseDot } from './PulseDot';

const statusLabel = (slot) => {
    if (slot.status === 'booked') return slot.bookedTeam ? String(slot.bookedTeam).slice(0, 9) : 'Booked';
    if (slot.status === 'on_hold') return 'Hold';
    return 'Passed';
};

/**
 * Live strip of today's 12 slots with the next free slot called out.
 *   slots: buildDaySlots() for today     onBook: opens the booking tab
 */
export function TodaySlotsStrip({ slots, today, onBook }) {
    const nextFreeSlot = slots.find(s => s.status === 'available');

    return (
        <Card>
            <Row gap={spacing.sm} wrap>
                <PulseDot />
                <Label tone="white" style={{ flexShrink: 1 }}>Live Pitch Status · Today's 12 Slots</Label>
                <Mono size="xs" tone="muted" weight="600">{`(${today})`}</Mono>
            </Row>

            {nextFreeSlot ? (
                <Pressable onPress={onBook} style={styles.nextFree} accessibilityRole="button">
                    <View style={{ flex: 1 }}>
                        <AppText size="xs" tone="soft">Next Free Slot:</AppText>
                        <AppText size="sm" weight="800" tone="brand">{nextFreeSlot.displayTime}</AppText>
                    </View>
                    <Mono size="md" tone="brand">{formatMoney(nextFreeSlot.price)}</Mono>
                    <Row gap={2}>
                        <AppText size="xs" weight="800" tone="brand" upper>Book</AppText>
                        <ArrowRight size={13} color={colors.brand} />
                    </Row>
                </Pressable>
            ) : (
                <AppText size="sm" weight="800" tone="warning" style={{ marginTop: spacing.md }}>All slots booked today! Check tomorrow.</AppText>
            )}

            <View style={styles.grid}>
                {slots.map((s) => {
                    const time = formatTime12(s.startTime);
                    if (s.status === 'available') {
                        return (
                            <Pressable key={s.slotNumber} onPress={onBook} style={[styles.tile, styles.tileFree]} accessibilityRole="button" accessibilityLabel={`Slot ${s.slotNumber}, ${s.displayTime}, ${formatMoney(s.price)}, free`}>
                                <Mono size="xxs" tone="muted">{`#${s.slotNumber}`}</Mono>
                                <AppText size="xs" weight="800" tone="brand" numberOfLines={1}>{time}</AppText>
                                <Mono size="xs" tone="brand" weight="900" numberOfLines={1}>{formatMoney(s.price)}</Mono>
                                <AppText size="xxs" weight="900" tone="brand" upper>Free</AppText>
                            </Pressable>
                        );
                    }
                    const isHold = s.status === 'on_hold';
                    const isBooked = s.status === 'booked';
                    return (
                        <View key={s.slotNumber} style={[styles.tile, isHold ? styles.tileHold : null, { opacity: isBooked ? 0.75 : isHold ? 0.9 : 0.45 }]}>
                            <Mono size="xxs" tone="dim">{`#${s.slotNumber}`}</Mono>
                            <AppText size="xs" weight="700" tone="soft" numberOfLines={1}>{time}</AppText>
                            <AppText size="xxs" weight="900" tone={isHold ? 'warning' : 'muted'} upper numberOfLines={1}>{statusLabel(s)}</AppText>
                        </View>
                    );
                })}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    nextFree: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderBrand, backgroundColor: colors.brandSoft },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
    tile: { flexBasis: '22%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 1, minHeight: 66, paddingVertical: 6, paddingHorizontal: 2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    tileFree: { borderColor: colors.borderBrand, backgroundColor: colors.brandSoft },
    tileHold: { borderColor: tones.warning.border, backgroundColor: colors.warningSoft }
});
