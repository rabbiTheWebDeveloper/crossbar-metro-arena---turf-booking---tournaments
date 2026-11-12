import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Clock, Shield, Calendar, Footprints } from 'lucide-react-native';
import { Card, Heading, AppText, Label, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { weekendDaysLabel } from '@/lib/dateUtils';
import { advanceSetting, bookingWindowDays } from './slots';

/** "Official booking policies & turf ground rules" block of the booking page. */
export function BookingRules({ pricing }) {
    const windowDays = bookingWindowDays(pricing);
    const advance = formatMoney(advanceSetting(pricing));
    const weekendLabel = weekendDaysLabel(pricing?.weekendDays);

    const guidelines = [
        { icon: Clock, title: '12 Slots Daily (90 Mins Each)', text: 'Fixed 90-minute matches from 06:00 AM to 12:00 AM Midnight. No overlapping games. One slot, one team.' },
        { icon: Shield, title: `${advance} Advance or Full Payment`, text: `Secure your slot online with bKash, Nagad, or card via SSLCommerz. Choose a ${advance} advance (pay the rest at the counter) or 100% online.` },
        { icon: Calendar, title: `${windowDays}-Day Advance Booking Window`, text: `Pick any match date up to ${windowDays} days in advance. Weekend rates (${weekendLabel}) apply automatically.` },
        { icon: Footprints, title: 'Turf Footwear Guidelines', text: 'Turf shoes (TF) or rubber molded studs (AG) required. Metal studs strictly forbidden on 50mm shock-pad turf.' }
    ];

    return (
        <Card>
            <Row gap={6}>
                <Shield size={15} color={colors.brand} />
                <Label tone="brand" style={{ flex: 1 }}>Crossbar Arena Match Day Regulations</Label>
            </Row>
            <Heading level={3} style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>Official Booking Policies & Turf Ground Rules</Heading>
            <View style={{ gap: spacing.sm }}>
                {guidelines.map((g) => {
                    const Icon = g.icon;
                    return (
                        <View key={g.title} style={styles.rule}>
                            <View style={styles.icon}>
                                <Icon size={16} color={colors.brand} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <AppText size="sm" weight="800">{g.title}</AppText>
                                <AppText size="xs" tone="soft">{g.text}</AppText>
                            </View>
                        </View>
                    );
                })}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    rule: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    icon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center' }
});
