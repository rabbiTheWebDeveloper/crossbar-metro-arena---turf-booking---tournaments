import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing, tones } from '../../theme';
import { AppText, Label } from './Typography';
import { compactMoney } from '../../lib/format';

/** KPI tile: label, big value, optional hint and icon. Put several in a <StatGrid>. */
export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', style }) {
    const t = tones[tone] || tones.brand;
    return (
        <View style={[styles.stat, style]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <Label style={{ flex: 1 }} numberOfLines={2}>{label}</Label>
                {Icon ? (
                    <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
                        <Icon size={14} color={t.fg} strokeWidth={2.4} />
                    </View>
                ) : null}
            </View>
            <AppText size="xl" weight="900" mono style={{ color: t.fg }} numberOfLines={1} adjustsFontSizeToFit>{value}</AppText>
            {hint ? <AppText size="xs" tone="muted" numberOfLines={2}>{hint}</AppText> : null}
        </View>
    );
}

/** Two-column wrap grid for StatCards (each child gets ~half the width). */
export function StatGrid({ children, style }) {
    return (
        <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, style]}>
            {React.Children.map(children, (child) => (child ? <View style={{ flexBasis: '47%', flexGrow: 1 }}>{child}</View> : null))}
        </View>
    );
}

/**
 * Minimal vertical bar chart (no chart library).
 *   data: [{ label, value, value2? }]   value2 draws a second (danger-toned) bar next to the first
 *   formatValue: label formatter for the bar captions (defaults to compact money)
 */
export function BarChart({ data = [], height = 140, tone = 'brand', tone2 = 'danger', formatValue = compactMoney, showValues = true, style }) {
    const t1 = tones[tone] || tones.brand;
    const t2 = tones[tone2] || tones.danger;
    const max = Math.max(1, ...data.map(d => Math.max(Number(d.value) || 0, Number(d.value2) || 0)));
    const dense = data.length > 12;
    return (
        <View style={[{ flexDirection: 'row', alignItems: 'flex-end', gap: dense ? 2 : 6, height: height + 34 }, style]}>
            {data.map((d, i) => {
                const h1 = Math.max(2, Math.round(((Number(d.value) || 0) / max) * height));
                const hasSecond = d.value2 !== undefined && d.value2 !== null;
                const h2 = hasSecond ? Math.max(2, Math.round(((Number(d.value2) || 0) / max) * height)) : 0;
                return (
                    <View key={`${d.label}-${i}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                        {showValues && !dense ? <AppText size={9} tone="muted" numberOfLines={1}>{formatValue(d.value)}</AppText> : null}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height }}>
                            <View style={{ width: dense ? 5 : (hasSecond ? 9 : 16), height: h1, borderRadius: 4, backgroundColor: (Number(d.value) || 0) > 0 ? t1.fg : colors.glassStrong }} />
                            {hasSecond ? <View style={{ width: dense ? 5 : 9, height: h2, borderRadius: 4, backgroundColor: (Number(d.value2) || 0) > 0 ? t2.fg : colors.glassStrong }} /> : null}
                        </View>
                        <AppText size={9} tone="dim" numberOfLines={1} style={{ marginTop: 4 }}>{dense && i % 5 !== 0 ? ' ' : String(d.label)}</AppText>
                    </View>
                );
            })}
        </View>
    );
}

/** Horizontal labelled bar: "Label ▇▇▇▇▇ value". Good for rankings and category breakdowns. */
export function HBar({ label, value, max, display, tone = 'brand', style }) {
    const t = tones[tone] || tones.brand;
    const pct = max > 0 ? Math.max(0, Math.min(100, ((Number(value) || 0) / max) * 100)) : 0;
    return (
        <View style={[{ gap: 4 }, style]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                <AppText size="sm" tone="soft" style={{ flex: 1 }} numberOfLines={1}>{label}</AppText>
                <AppText size="sm" weight="800" mono>{display ?? String(value)}</AppText>
            </View>
            <View style={{ height: 7, borderRadius: 4, backgroundColor: colors.glassStrong, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: t.fg }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    stat: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: 4, minHeight: 84 },
    statIcon: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }
});
