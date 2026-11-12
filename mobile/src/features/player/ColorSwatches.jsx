import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { Field } from '@/components/ui';
import { colors } from '@/theme';
import { TEAM_COLORS, readableOn } from './constants';

/**
 * Jersey colour picker: a grid of swatches (replaces the website's native colour input).
 * A colour that is not in the preset list (picked on the website) is kept as an extra swatch.
 */
export function ColorSwatches({ label, value, onChange }) {
    const current = String(value || '').toLowerCase();
    const list = useMemo(
        () => (current && !TEAM_COLORS.includes(current) && /^#[0-9a-f]{6}$/.test(current) ? [current, ...TEAM_COLORS] : TEAM_COLORS),
        [current]
    );
    return (
        <Field label={label}>
            <View style={styles.grid} accessibilityRole="radiogroup">
                {list.map(hex => {
                    const selected = hex === current;
                    return (
                        <Pressable
                            key={hex}
                            onPress={() => onChange(hex)}
                            hitSlop={4}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            accessibilityLabel={`Colour ${hex}`}
                            style={[styles.swatch, { backgroundColor: hex }, selected ? styles.selected : null]}
                        >
                            {selected ? <Check size={16} color={readableOn(hex)} strokeWidth={3} /> : null}
                        </Pressable>
                    );
                })}
            </View>
        </Field>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    swatch: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    selected: { borderWidth: 2, borderColor: colors.text }
});
