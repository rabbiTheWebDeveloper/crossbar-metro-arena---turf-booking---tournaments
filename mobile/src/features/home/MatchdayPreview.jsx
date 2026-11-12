import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Calendar, Swords, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, SectionHeader, AppText, Mono, Badge, Button, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';

const CONFIRMED_STATES = ['confirmed_unpaid', 'paid_advance', 'paid_full'];
const PREVIEW_COUNT = 3;

/** Upcoming confirmed fixtures (today onwards, ascending). Only team name and time are shown publicly. */
const upcomingFixtures = (bookings, today) => (bookings || [])
    .filter(b => CONFIRMED_STATES.includes(b.paymentStatus) && String(b.date || '') >= today)
    .sort((a, b) => (a.date === b.date ? (Number(a.slotNumber) || 0) - (Number(b.slotNumber) || 0) : String(a.date).localeCompare(String(b.date))));

/**
 * Home preview of the Matchday Center: the next confirmed fixtures and the number of open
 * squad challenges. Posting / accepting challenges happens on the Matches screen.
 */
export function MatchdayPreview({ today, onSeeAll, onBook }) {
    const { bookings, challenges } = useArena();
    const fixtures = useMemo(() => upcomingFixtures(bookings, today), [bookings, today]);
    const openChallenges = useMemo(() => (challenges || []).filter(c => (c.status || 'open') === 'open').length, [challenges]);

    return (
        <View>
            <SectionHeader
                eyebrow="Matchday Center"
                title="Upcoming Matches & Squad Challenges"
                subtitle="See which slots are booked, or challenge other Dhaka squads to a friendly on the Crossbar turf."
                action="See all"
                onAction={onSeeAll}
            />
            <Card>
                <Row gap={6} style={{ marginBottom: spacing.md }}>
                    <Calendar size={15} color={colors.brand} />
                    <AppText size="sm" weight="800">{`Confirmed Fixtures (${fixtures.length})`}</AppText>
                </Row>

                {fixtures.length === 0 ? (
                    <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }}>
                        <AppText size="sm" weight="800" center>No confirmed fixtures in the booking window yet</AppText>
                        <AppText size="xs" tone="muted" center>Be the first squad to book a slot at Crossbar Metro Arena.</AppText>
                        <Button title="Book Playing Slot" size="sm" onPress={onBook} />
                    </View>
                ) : (
                    <View style={{ gap: spacing.sm }}>
                        {fixtures.slice(0, PREVIEW_COUNT).map((b) => (
                            <View key={b.id || `${b.date}-${b.slotNumber}`} style={styles.fixture}>
                                <Row justify="space-between">
                                    <Badge tone="brand" label={`Slot #${b.slotNumber}`} />
                                    <AppText size="xs" tone="muted">{b.date === today ? 'Today' : formatIsoDate(b.date)}</AppText>
                                </Row>
                                <Row justify="space-between" align="center">
                                    <AppText size="md" weight="800" style={{ flex: 1 }} numberOfLines={1}>{String(b.teamName || 'Reserved')}</AppText>
                                    <Mono size="xs" tone="brand">{String(b.displayTime || '')}</Mono>
                                </Row>
                                <Row gap={4} justify="flex-end">
                                    <CheckCircle2 size={13} color={colors.brand} />
                                    <AppText size="xs" weight="700" tone="brand">Confirmed</AppText>
                                </Row>
                            </View>
                        ))}
                        {fixtures.length > PREVIEW_COUNT ? (
                            <AppText size="xs" tone="muted" center>{`Showing the next ${PREVIEW_COUNT} of ${fixtures.length} confirmed fixtures.`}</AppText>
                        ) : null}
                    </View>
                )}

                <Pressable onPress={onSeeAll} style={({ pressed }) => [styles.challenges, pressed ? { opacity: 0.8 } : null]} accessibilityRole="button">
                    <Swords size={18} color={colors.brand} />
                    <View style={{ flex: 1 }}>
                        <AppText size="sm" weight="800">{`Squad Challenges (${openChallenges})`}</AppText>
                        <AppText size="xs" tone="muted">
                            {openChallenges > 0
                                ? 'Challenge other Dhaka squads to a friendly: accept an open challenge or post your own.'
                                : "No open challenges right now. Post your squad's challenge or ask for guest players and other Dhaka captains can accept it."}
                        </AppText>
                    </View>
                    <ChevronRight size={18} color={colors.textDim} />
                </Pressable>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    fixture: { gap: 6, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    challenges: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderBrand, backgroundColor: colors.brandSoft }
});
