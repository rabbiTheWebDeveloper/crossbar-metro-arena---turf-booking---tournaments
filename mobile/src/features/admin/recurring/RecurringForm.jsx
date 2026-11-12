import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { CalendarRange } from 'lucide-react-native';
import { AppText, Card, Checkbox, Chip, DateField, Input, Label, Mono, Row, Select } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { WEEKDAYS, RANGE_PRESETS, PRICE_MODES, SERIES_PAYMENT_METHODS } from './constants';

const digits = (text) => String(text || '').replace(/[^0-9]/g, '');

/** The five steps of the bulk booking form. `form` is the object returned by useRecurringBooking(). */
export function RecurringForm({ form }) {
    const f = form;
    const paidModes = [
        { value: 'none', label: 'Nothing yet (pay at turf)' },
        { value: 'advance', label: `Advance ${formatMoney(f.advanceAmount)} each` },
        { value: 'full', label: 'Full price each' },
        { value: 'custom', label: 'Custom amount each' }
    ];

    return (
        <Card style={{ gap: spacing.lg }}>
            {/* 1 · Customer */}
            <View style={styles.step}>
                <Label tone="brand">1 · Customer</Label>
                <Input label="Team / club name" required value={f.teamName} onChangeText={f.setTeamName} placeholder="e.g. Uttara Veterans FC" autoCapitalize="words" />
                <Input label="Captain name" required value={f.captainName} onChangeText={f.setCaptainName} placeholder="Captain" autoCapitalize="words" />
                <Input label="Mobile" required type="phone" value={f.captainPhone} onChangeText={f.setCaptainPhone} placeholder="01711223344" maxLength={14} />
            </View>

            {/* 2 · Weekdays */}
            <View style={styles.step}>
                <Label tone="brand">2 · Weekdays</Label>
                <Row wrap gap={6}>
                    {WEEKDAYS.map(d => <Chip key={d.value} label={d.label} selected={f.weekdays.includes(d.value)} onPress={() => f.toggleWeekday(d.value)} />)}
                    <Chip label={f.weekdays.length === 7 ? 'Clear' : 'Every day'} onPress={f.toggleAllWeekdays} />
                </Row>
                <AppText size="xs" tone="dim">No weekday selected = every day in the range.</AppText>
            </View>

            {/* 3 · Time slots */}
            <View style={styles.step}>
                <Label tone="brand">3 · Time slots</Label>
                <View style={styles.slotGrid}>
                    {f.slotDefs.map(s => {
                        const on = f.slotNumbers.includes(s.slotNumber);
                        return (
                            <Pressable key={s.slotNumber} onPress={() => f.toggleSlot(s.slotNumber)} style={[styles.slot, on ? styles.slotOn : null]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                                <Mono size="xs" style={{ color: on ? colors.onBrand : colors.text }}>{s.displayTime}</Mono>
                                <AppText size="xxs" style={{ color: on ? colors.onBrand : colors.textDim }}>{`${formatMoney(s.weekdayPrice)} · wknd ${formatMoney(s.weekendPrice)}`}</AppText>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* 4 · Date range */}
            <View style={styles.step}>
                <Label tone="brand">4 · Date range</Label>
                <DateField label="From" value={f.startDate} onChange={(iso) => { if (iso) f.setStartDate(iso); }} minDate={f.todayStr} />
                <DateField label="To (inclusive)" value={f.endDate} onChange={(iso) => { if (iso) f.setEndDate(iso); }} minDate={f.startDate} />
                <Row wrap gap={6}>
                    {RANGE_PRESETS.map(p => <Chip key={p.label} label={p.label} icon={CalendarRange} onPress={() => f.applyPreset(p.months)} />)}
                </Row>
            </View>

            {/* 5 · Price & payment */}
            <View style={styles.step}>
                <Label tone="brand">{'5 · Price & payment'}</Label>
                <Select label="Price per slot" value={f.priceMode} onChange={f.setPriceMode} options={PRICE_MODES} />
                {f.priceMode === 'custom' ? <Input type="number" value={f.customPrice} onChangeText={(t) => f.setCustomPrice(digits(t))} placeholder="৳ per slot" /> : null}
                <Select label="Already collected per slot" value={f.paidMode} onChange={f.setPaidMode} options={paidModes} />
                {f.paidMode === 'custom' ? <Input type="number" value={f.customPaid} onChangeText={(t) => f.setCustomPaid(digits(t))} placeholder="৳ collected per slot" /> : null}
                <Select label="Payment method" value={f.paymentMethod} onChange={f.setPaymentMethod} options={SERIES_PAYMENT_METHODS} />
                <Input label="Notes (optional)" value={f.notes} onChangeText={f.setNotes} placeholder="e.g. Yearly contract, paid monthly" />
                <Checkbox label="Skip already-booked slots and create the rest" checked={f.skipConflicts} onChange={f.setSkipConflicts} />
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    step: { gap: spacing.sm },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    slot: { flexBasis: '47%', flexGrow: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass, gap: 2 },
    slotOn: { backgroundColor: colors.brand, borderColor: colors.brand }
});
