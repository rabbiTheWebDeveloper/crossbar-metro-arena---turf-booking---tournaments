import React, { useRef } from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius } from '@/theme';

const ITEM_WIDTH = 66;
const ITEM_GAP = 6;

/**
 * Horizontal day picker.
 *   dates: [{ iso, dayName, dayNum, isToday, bookedCount }]
 * On first layout the strip scrolls so the selected day is in view.
 */
export function DateStrip({ dates, selected, onSelect }) {
    const ref = useRef(null);
    const positioned = useRef(false);

    const scrollToSelected = () => {
        if (positioned.current || !ref.current) return;
        positioned.current = true;
        const index = Math.max(0, dates.findIndex(d => d.iso === selected));
        ref.current.scrollTo({ x: Math.max(0, (index - 2) * (ITEM_WIDTH + ITEM_GAP)), animated: false });
    };

    return (
        <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: ITEM_GAP }} onContentSizeChange={scrollToSelected}>
            {dates.map(item => {
                const active = item.iso === selected;
                return (
                    <Pressable key={item.iso} onPress={() => onSelect(item.iso)} style={[styles.day, active ? styles.dayActive : null]} accessibilityRole="button" accessibilityState={{ selected: active }}>
                        <AppText size="xxs" weight="800" mono style={{ color: active ? colors.onBrand : colors.textMuted, letterSpacing: 0.5 }}>{item.isToday ? 'TODAY' : item.dayName}</AppText>
                        <AppText size="lg" weight="900" style={{ color: active ? colors.onBrand : colors.text }}>{String(item.dayNum)}</AppText>
                        <AppText size={10} weight={active ? '800' : '500'} mono style={{ color: active ? colors.onBrand : colors.textDim }}>{`${item.bookedCount} booked`}</AppText>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    day: { width: ITEM_WIDTH, paddingVertical: 8, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    dayActive: { backgroundColor: colors.brand, borderColor: colors.brand }
});
