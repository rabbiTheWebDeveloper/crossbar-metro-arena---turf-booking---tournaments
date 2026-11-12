import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, tones } from '@/theme';

/**
 * Vertical bar chart whose bars can be tapped (the app's version of the website's hover tooltips).
 *   data: [{ key, heightPercent (0..100), active (false = empty/grey bar), danger, caption, label, a11y }]
 *   selectedIndex / onSelect(index)
 *   highlight: 'white' (selected bar turns white) | 'tone' (selected bar keeps its colour, others dim)
 *   showCaptions: value above each bar      showLabels: label under each bar
 *   ticks: 1-based bar numbers to print under the chart (for dense charts without labels)
 */
export function TapBarChart({ data = [], selectedIndex = null, onSelect, height = 132, gap = 3, highlight = 'white', showCaptions = false, showLabels = false, maxBarWidth, ticks, style }) {
    const count = data.length;
    return (
        <View style={style}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap }}>
                {data.map((item, index) => {
                    const selected = selectedIndex === index;
                    const base = item.active === false ? colors.glassStrong : (item.danger ? tones.danger.fg : colors.brand);
                    const barColor = selected && highlight === 'white' ? colors.white : base;
                    const pct = Math.max(0, Math.min(100, Number(item.heightPercent) || 0));
                    return (
                        <Pressable
                            key={String(item.key)}
                            onPress={() => { if (onSelect) onSelect(index); }}
                            hitSlop={{ top: 8, bottom: 8 }}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            accessibilityLabel={item.a11y}
                            style={{ flex: 1, alignItems: 'center' }}
                        >
                            {showCaptions ? (
                                <AppText size={9} mono weight="700" numberOfLines={1} style={{ color: selected ? colors.brand : colors.textMuted, marginBottom: 6 }}>
                                    {item.caption}
                                </AppText>
                            ) : null}
                            <View style={{ height, width: '100%', maxWidth: maxBarWidth, justifyContent: 'flex-end' }}>
                                <View style={{ height: `${pct}%`, minHeight: 2, borderRadius: 3, backgroundColor: barColor, opacity: highlight === 'tone' && !selected ? 0.6 : 1 }} />
                            </View>
                            {showLabels ? (
                                <AppText size="xs" mono weight={selected ? '800' : '500'} numberOfLines={1} style={{ color: selected ? colors.text : colors.textMuted, marginTop: 8 }}>
                                    {item.label}
                                </AppText>
                            ) : null}
                        </Pressable>
                    );
                })}
            </View>
            {ticks && ticks.length > 0 && count > 0 ? (
                <View style={{ height: 18, marginTop: 6 }}>
                    {ticks.map(tick => (
                        <View key={tick} style={{ position: 'absolute', top: 0, left: `${((tick - 0.5) / count) * 100}%`, width: 24, marginLeft: -12, alignItems: 'center' }}>
                            <AppText size="xxs" mono tone="dim">{String(tick)}</AppText>
                        </View>
                    ))}
                </View>
            ) : null}
        </View>
    );
}

/** Pill under/over a chart that describes the tapped bar (or a hint when nothing is selected). */
export function ChartDetail({ text, placeholder }) {
    return (
        <View style={{ minHeight: 28, alignItems: 'center', justifyContent: 'center' }}>
            {text ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand }}>
                    <AppText size="xs" mono weight="700" tone="brand" center>{text}</AppText>
                </View>
            ) : (
                <AppText size="xs" mono tone="dim" center>{placeholder}</AppText>
            )}
        </View>
    );
}
