import React from 'react';
import { View } from 'react-native';
import { AppText, Card, Label } from '@/components/ui';
import { colors } from '@/theme';

const BAR_AREA = 96;

/**
 * Net profit of the last six months (cash basis). Loss months are drawn in red.
 *   months: [{ key, label, net }]
 */
export function ProfitBars({ months }) {
    const maxAbs = Math.max(1, ...months.map(m => Math.abs(m.net)));
    return (
        <Card style={{ gap: 10 }}>
            <View>
                <Label tone="default">Net profit · 6 months</Label>
                <AppText size="xs" tone="dim">Cash basis: money collected minus expenses</AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 6 }}>
                {months.map(m => {
                    const valK = Math.round((m.net / 1000) * 10) / 10;
                    const height = m.net === 0 ? 4 : Math.max(6, Math.round((Math.abs(m.net) / maxAbs) * BAR_AREA));
                    return (
                        <View key={m.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                            <AppText size={10} tone="muted" mono numberOfLines={1} adjustsFontSizeToFit>{`${valK < 0 ? '-' : ''}৳${Math.abs(valK)}k`}</AppText>
                            <View style={{ height: BAR_AREA, justifyContent: 'flex-end', alignSelf: 'stretch', alignItems: 'center', marginTop: 4 }}>
                                <View style={{ width: '70%', maxWidth: 28, height, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: m.net <= 0 ? colors.danger : colors.brand }} />
                            </View>
                            <AppText size="xs" tone="muted" mono style={{ marginTop: 6 }}>{m.label}</AppText>
                        </View>
                    );
                })}
            </View>
        </Card>
    );
}
