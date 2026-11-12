import React, { useMemo, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Calendar, ChevronDown } from 'lucide-react-native';
import { AppText, Label, Row, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { SHORT_DAYS, SHORT_MONTHS, addDaysIso, parseLocalDate, isWeekendDate, weekendDaysLabel, formatIsoDate } from '@/lib/dateUtils';
import { AvailabilityCalendarSheet } from './AvailabilityCalendarSheet';

/**
 * Match-date controls: a 7-day quick strip, the selected date (opens the availability calendar)
 * and a "today" shortcut. Dates outside today..maxDate cannot be chosen.
 */
export function BookingDatePicker({ selectedDate, onSelect, today, maxDate, windowDays, weekendDays, bookings }) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const weekendSelected = isWeekendDate(selectedDate, weekendDays);

    const next7Days = useMemo(() => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const iso = addDaysIso(today, i);
            const d = parseLocalDate(iso);
            dates.push({
                iso,
                dayName: i === 0 ? 'Today' : SHORT_DAYS[d.getDay()],
                dayNum: d.getDate(),
                monthName: SHORT_MONTHS[d.getMonth()],
                isWeekend: isWeekendDate(iso, weekendDays),
                disabled: iso > maxDate
            });
        }
        return dates;
    }, [today, maxDate, weekendDays]);

    return (
        <View style={{ gap: spacing.md }}>
            <Row justify="space-between" align="flex-start">
                <Label style={{ flex: 1 }}>Quick date picker (next 7 days)</Label>
                <AppText size="xs" tone="brand" weight="700" style={{ flexShrink: 1, textAlign: 'right' }}>
                    {weekendSelected ? `Weekend pricing (${weekendDaysLabel(weekendDays)})` : 'Regular weekday rates'}
                </AppText>
            </Row>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm }}>
                {next7Days.map((d) => {
                    const selected = selectedDate === d.iso;
                    const fg = selected ? colors.onBrand : colors.textSoft;
                    return (
                        <Pressable
                            key={d.iso}
                            disabled={d.disabled}
                            onPress={() => onSelect(d.iso)}
                            style={[styles.day, selected ? styles.daySelected : null, d.disabled ? { opacity: 0.4 } : null]}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                        >
                            <AppText size="xs" weight="800" upper style={{ color: fg }}>{d.dayName}</AppText>
                            <AppText size="xl" weight="900" style={{ color: fg, lineHeight: 24 }}>{String(d.dayNum)}</AppText>
                            <AppText size="xs" style={{ color: fg, opacity: 0.8 }}>{d.monthName}</AppText>
                            <View style={[styles.weekendDot, d.isWeekend && !selected ? { backgroundColor: colors.brand } : null]} />
                        </Pressable>
                    );
                })}
            </ScrollView>

            <Row>
                <Pressable onPress={() => setCalendarOpen(true)} style={styles.dateField} accessibilityRole="button" accessibilityLabel="Open the booking calendar">
                    <Calendar size={16} color={colors.brand} />
                    <AppText size="sm" weight="700" style={{ flex: 1 }} numberOfLines={1}>{formatIsoDate(selectedDate, { weekday: 'long' })}</AppText>
                    <ChevronDown size={16} color={colors.textDim} />
                </Pressable>
                <Button title="Today" variant="secondary" size="md" disabled={selectedDate === today} onPress={() => onSelect(today)} accessibilityLabel="Jump to today" />
            </Row>
            <AppText size="xs" tone="dim">{`Bookings open up to ${windowDays} days ahead (until ${formatIsoDate(maxDate)}).`}</AppText>

            <AvailabilityCalendarSheet
                visible={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                value={selectedDate}
                onChange={onSelect}
                minDate={today}
                maxDate={maxDate}
                bookings={bookings}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    day: { width: 62, paddingVertical: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' },
    daySelected: { backgroundColor: colors.brand, borderColor: colors.brandLight },
    weekendDot: { width: 6, height: 6, borderRadius: 3, marginTop: 3, backgroundColor: 'transparent' },
    dateField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 11, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input }
});
