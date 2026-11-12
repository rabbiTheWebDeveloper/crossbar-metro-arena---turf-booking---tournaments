import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { Card, AppText, Heading, Label, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const HIGHLIGHTS = [
    { title: '400-Lux Lighting', text: 'Zero-shadow stadium floodlights' },
    { title: '2-Min Metro Walk', text: 'Directly beside Uttara Center Station' }
];

const FACILITIES = [
    { title: 'Championship 7v7 Ground:', text: '120ft x 75ft FIFA-standard artificial turf with monofilament fibers and cool rubber infill.' },
    { title: 'Player Dugouts:', text: 'Covered team benches, electronic digital scoreboard, match clock, and warm-up stretching deck.' },
    { title: 'Changing Rooms & Restrooms:', text: 'Changing rooms and restroom facilities with regular daily sanitation.' },
    { title: 'In-House Sports Shop & Hydration:', text: 'Match balls, shin guards, grip socks and hydration available from the arena shop.' }
];

/** "The Crossbar Vision" story and the official facilities list of the About page. */
export function AboutStory() {
    return (
        <View style={{ gap: spacing.lg }}>
            <View style={{ gap: spacing.md }}>
                <Label tone="brand">The Crossbar Vision</Label>
                <Heading level={2} upper>Elevating Dhaka’s Turf Football Experience</Heading>
                <AppText size="sm" tone="soft">
                    Crossbar Metro Arena was established with a clear mission: to provide Dhaka’s footballers with an uncompromising, professional pitch experience. Situated adjacent to the MRT Line-6 viaduct at Sector 17 Uttara, players can step off the rapid transit train and onto FIFA-grade 50mm shock-pad grass in under two minutes.
                </AppText>
                <AppText size="sm" tone="soft">
                    We operate strictly on fixed 90-minute slots to ensure every team enjoys a proper, fulfilling match. With automated digital booking, ৳500 advance lock-in, and zero double booking guarantee, Crossbar Metro Arena is your squad’s true home ground.
                </AppText>
                <Row gap={spacing.sm} align="stretch">
                    {HIGHLIGHTS.map(h => (
                        <View key={h.title} style={styles.highlight}>
                            <AppText size="sm" weight="800" tone="brand">{h.title}</AppText>
                            <AppText size="xs" tone="muted">{h.text}</AppText>
                        </View>
                    ))}
                </Row>
            </View>

            <Card>
                <Heading level={3} upper>Official Facilities & Specifications</Heading>
                <View style={{ gap: spacing.md, marginTop: spacing.md }}>
                    {FACILITIES.map(f => (
                        <Row key={f.title} align="flex-start" gap={spacing.sm}>
                            <CheckCircle2 size={16} color={colors.brand} style={{ marginTop: 2 }} />
                            <AppText size="sm" tone="soft" style={{ flex: 1 }}>
                                <AppText size="sm" weight="800">{`${f.title} `}</AppText>
                                {f.text}
                            </AppText>
                        </Row>
                    ))}
                </View>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    highlight: { flex: 1, gap: 2, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass }
});
