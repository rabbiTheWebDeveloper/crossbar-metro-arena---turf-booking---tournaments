import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { AppText, Card, Input, Label, Mono, Row } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme';

const digits = (text) => String(text || '').replace(/[^0-9]/g, '');

/**
 * The 12-slot schedule with its 24 editable rates (weekday + weekend price per slot).
 *   slotPrices: [{ slotNumber, displayTime, period, weekdayPrice, weekendPrice }]
 *   onChange(slotNumber, 'weekdayPrice' | 'weekendPrice', value)
 */
export function PriceMatrix({ slotPrices, onChange, weekdayLabel, weekendLabel }) {
    return (
        <Card style={{ gap: spacing.sm }}>
            <Row gap={8}>
                <Clock size={16} color={colors.brand} />
                <Label tone="default">12 slot schedule matrix (all 24 rates)</Label>
            </Row>
            <AppText size="xs" tone="dim">{`Weekday: ${weekdayLabel} · Weekend: ${weekendLabel}`}</AppText>

            <Row style={styles.head}>
                <Label style={{ flex: 1.25 }}>Slot</Label>
                <Label style={styles.priceCol}>Weekday ৳</Label>
                <Label style={styles.priceCol} tone="brand">Weekend ৳</Label>
            </Row>

            {slotPrices.map(slot => (
                <Row key={slot.slotNumber} style={styles.line}>
                    <View style={{ flex: 1.25 }}>
                        <AppText size="sm" weight="800">{`Slot ${slot.slotNumber}`}</AppText>
                        <Mono size={10} tone="soft" weight="600">{slot.displayTime}</Mono>
                        <AppText size="xxs" tone="muted" upper>{String(slot.period || '')}</AppText>
                    </View>
                    <Input
                        type="number"
                        value={slot.weekdayPrice}
                        onChangeText={(t) => onChange(slot.slotNumber, 'weekdayPrice', digits(t))}
                        maxLength={6}
                        style={styles.priceCol}
                        inputStyle={styles.priceInput}
                        accessibilityLabel={`Slot ${slot.slotNumber} weekday price`}
                    />
                    <Input
                        type="number"
                        value={slot.weekendPrice}
                        onChangeText={(t) => onChange(slot.slotNumber, 'weekendPrice', digits(t))}
                        maxLength={6}
                        style={styles.priceCol}
                        inputStyle={[styles.priceInput, { color: colors.brand, fontWeight: '700' }]}
                        accessibilityLabel={`Slot ${slot.slotNumber} weekend price`}
                    />
                </Row>
            ))}
        </Card>
    );
}

const styles = StyleSheet.create({
    head: { paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
    line: { paddingVertical: 4 },
    priceCol: { flex: 1 },
    priceInput: { fontFamily: fonts.mono, paddingVertical: 8, minHeight: 40 }
});
