import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { Card, AppText, Heading, Label, Mono, Badge, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { slotDefinitions, advanceSetting } from '@/features/booking/slots';

/** Official rate card: the 12 slots with their weekday and weekend prices. */
export function PriceTable({ pricing, onBook }) {
    const slots = slotDefinitions(pricing);
    const advance = formatMoney(advanceSetting(pricing));

    return (
        <View style={{ gap: spacing.md }}>
            <View style={{ gap: spacing.sm }}>
                <Badge tone="brand" icon={Calendar} label="Official Rate Card" />
                <Heading level={2} upper>Full 12-Slot Price Table · Weekday vs Weekend</Heading>
                <AppText size="xs" tone="muted">{`Weekday (Sun – Thu) & Weekend (Fri & Sat). Lock in your slot with just ${advance} advance.`}</AppText>
                {onBook ? <Button title="Book Any Slot Now" size="sm" onPress={onBook} style={{ alignSelf: 'flex-start' }} /> : null}
            </View>

            <Card padded={false}>
                <View style={[styles.row, styles.head]}>
                    <Label style={styles.slotCol}>Slot · Kickoff time</Label>
                    <Label tone="soft" style={styles.priceCol}>Weekday (Sun–Thu)</Label>
                    <Label tone="brand" style={styles.priceCol}>Weekend (Fri–Sat)</Label>
                </View>
                {slots.map((s) => (
                    <View key={s.slotNumber} style={styles.row}>
                        <View style={styles.slotCol}>
                            <AppText size="sm" weight="800">
                                <Mono size="sm" tone="muted">{`#${s.slotNumber} `}</Mono>
                                {s.displayTime}
                            </AppText>
                            <AppText size="xxs" tone="muted" weight="800" upper>{String(s.period || '')}</AppText>
                        </View>
                        <Mono size="sm" tone="soft" style={styles.priceCol}>{formatMoney(s.weekdayPrice)}</Mono>
                        <Mono size="sm" tone="brand" style={styles.priceCol}>{formatMoney(s.weekendPrice)}</Mono>
                    </View>
                ))}
                <View style={[styles.row, { borderBottomWidth: 0 }]}>
                    <AppText size="xs" tone="muted" style={{ flex: 1 }}>Online advance (every slot)</AppText>
                    <Mono size="sm" tone="soft">{advance}</Mono>
                </View>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    head: { backgroundColor: colors.glass },
    slotCol: { flex: 1.5 },
    priceCol: { flex: 1, textAlign: 'right' }
});
