import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Sheet, AppText, Row } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { MONTH_NAMES, parseLocalDate, toIsoLocal } from '@/lib/dateUtils';
import { ACTIVE_STATUSES, TOTAL_DAILY_SLOTS } from './slots';

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOT_COLORS = { many: colors.brand, few: colors.warning, full: colors.danger };
const LEGEND = [
    { key: 'many', label: 'Many' },
    { key: 'few', label: 'Few' },
    { key: 'full', label: 'Full' }
];

const monthIndexOf = (iso) => {
    const d = parseLocalDate(iso);
    return d.getFullYear() * 12 + d.getMonth();
};

/**
 * Month calendar limited to the booking window, with a per-day availability dot
 * (many / few / full) counted from every active booking including payment holds.
 *   value: selected `YYYY-MM-DD`     minDate / maxDate: inclusive window bounds
 */
export function AvailabilityCalendarSheet({ visible, onClose, value, onChange, minDate, maxDate, bookings }) {
    const [cursor, setCursor] = useState(() => monthIndexOf(value));
    const [openedFor, setOpenedFor] = useState(null);
    // Jump to the selected date's month each time the sheet opens
    if (visible && openedFor !== value) { setOpenedFor(value); setCursor(monthIndexOf(value)); }
    if (!visible && openedFor !== null) setOpenedFor(null);

    const minIndex = monthIndexOf(minDate);
    const maxIndex = monthIndexOf(maxDate);
    const canPrev = cursor > minIndex;
    const canNext = cursor < maxIndex;
    const year = Math.floor(cursor / 12);
    const month = cursor % 12;

    const bookedByDate = useMemo(() => {
        const counts = {};
        (bookings || []).forEach((b) => {
            if (ACTIVE_STATUSES.includes(b.paymentStatus)) counts[b.date] = (counts[b.date] || 0) + 1;
        });
        return counts;
    }, [bookings]);

    const cells = useMemo(() => {
        const firstDayIndex = new Date(year, month, 1).getDay();
        const total = new Date(year, month + 1, 0).getDate();
        const out = [];
        for (let i = 0; i < firstDayIndex; i++) out.push(null);
        for (let d = 1; d <= total; d++) {
            const iso = toIsoLocal(new Date(year, month, d));
            const freeSlots = Math.max(0, TOTAL_DAILY_SLOTS - (bookedByDate[iso] || 0));
            out.push({ dayNum: d, iso, status: freeSlots === 0 ? 'full' : freeSlots <= 6 ? 'few' : 'many', disabled: iso < minDate || iso > maxDate });
        }
        while (out.length % 7 !== 0) out.push(null);
        return out;
    }, [year, month, bookedByDate, minDate, maxDate]);

    return (
        <Sheet visible={visible} onClose={onClose} title="Pick a match date" icon={Calendar} scroll={false}>
            <Row justify="space-between">
                <Pressable onPress={() => canPrev && setCursor(cursor - 1)} style={[styles.nav, !canPrev ? { opacity: 0.3 } : null]} accessibilityLabel="Previous month">
                    <ChevronLeft size={18} color={colors.text} />
                </Pressable>
                <AppText size="md" weight="800" upper>{`${MONTH_NAMES[month]} ${year}`}</AppText>
                <Pressable onPress={() => canNext && setCursor(cursor + 1)} style={[styles.nav, !canNext ? { opacity: 0.3 } : null]} accessibilityLabel="Next month">
                    <ChevronRight size={18} color={colors.text} />
                </Pressable>
            </Row>

            <Row justify="center" gap={spacing.lg}>
                {LEGEND.map(l => (
                    <Row key={l.key} gap={5}>
                        <View style={[styles.legendDot, { backgroundColor: DOT_COLORS[l.key] }]} />
                        <AppText size="xs" weight="800" tone={DOT_COLORS[l.key]}>{l.label}</AppText>
                    </Row>
                ))}
            </Row>

            <View style={{ flexDirection: 'row' }}>
                {WEEKDAY_INITIALS.map((d, i) => (
                    <View key={`${d}${i}`} style={styles.cell}>
                        <AppText size="xs" tone="dim" weight="800">{d}</AppText>
                    </View>
                ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {cells.map((c, idx) => {
                    if (!c) return <View key={`empty-${idx}`} style={styles.cell} />;
                    const selected = c.iso === value;
                    return (
                        <Pressable key={c.iso} disabled={c.disabled} onPress={() => { onChange(c.iso); onClose(); }} style={styles.cell}>
                            <View style={[styles.day, selected ? { backgroundColor: colors.brand } : null, c.disabled ? { opacity: 0.25 } : null]}>
                                <AppText size="sm" weight={selected ? '900' : '600'} style={{ color: selected ? colors.onBrand : colors.textSoft, lineHeight: 17 }}>{String(c.dayNum)}</AppText>
                                {!c.disabled ? <View style={[styles.dot, { backgroundColor: selected ? colors.onBrand : DOT_COLORS[c.status] }]} /> : <View style={styles.dot} />}
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    nav: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.glassStrong, alignItems: 'center', justifyContent: 'center' },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    cell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
    day: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2 },
    dot: { width: 5, height: 5, borderRadius: 3 }
});
