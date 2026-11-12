import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Calendar, Users, Trophy, Sparkles, Shield, Clock, Train, ChevronRight, Swords, Flag } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { GradientCard, AppText, Heading, Label, Mono, Badge, Button, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { useVenueContacts } from '@/features/venue/useVenueContacts';
import { TOTAL_DAILY_SLOTS } from '@/features/booking/slots';
import { PulseDot } from './PulseDot';

/**
 * Home hero: headline, the three main calls to action and the live arena stats
 * (today's open slots, published results, open challenges: all from the database).
 */
export function HomeHero({ today, onBook, onSquad, onTournaments, onResults, onMatches }) {
    const { bookings, matchResults, challenges, tournaments, pricing, isLoadingData } = useArena();
    const { venue } = useVenueContacts();

    const stats = useMemo(() => {
        const takenToday = bookings.filter(b => b.date === today && b.paymentStatus !== 'cancelled').length;
        return {
            slotsLeft: Math.max(0, TOTAL_DAILY_SLOTS - takenToday),
            published: matchResults.filter(m => m.status === 'published').length,
            openChallenges: challenges.filter(c => (c.status || 'open') === 'open').length
        };
    }, [bookings, matchResults, challenges, today]);

    const openTournament = useMemo(() => {
        const list = tournaments.filter(t => ['open', 'fast_filling'].includes(t.status) && (!t.registrationDeadline || t.registrationDeadline >= today));
        return list.find(t => Number(t.prizePool) > 0) || list[0] || null;
    }, [tournaments, today]);
    const tournamentLabel = openTournament && Number(openTournament.prizePool) > 0
        ? `Tournaments (${formatMoney(openTournament.prizePool)} Prize)`
        : 'Tournaments & Cups';

    const advance = Number(pricing.advanceAmount || 0);
    const windowDays = Number(pricing.bookingWindowDays || 60);
    const hours = venue.openingHours ? String(venue.openingHours).replace(/ every day$/i, '').toLowerCase() : '6 AM to 12 AM';

    const liveStats = [
        { icon: Clock, label: "Today's open slots", value: isLoadingData ? '…' : `${stats.slotsLeft} / ${TOTAL_DAILY_SLOTS}`, tone: stats.slotsLeft > 0 ? 'brand' : 'warning', onPress: onBook },
        { icon: Flag, label: 'Published results', value: isLoadingData ? '…' : String(stats.published), tone: 'white', onPress: onResults },
        { icon: Swords, label: 'Open challenges', value: isLoadingData ? '…' : String(stats.openChallenges), tone: 'white', onPress: onMatches }
    ];

    const features = [
        { icon: Sparkles, title: 'Pro Artificial Turf', text: '50mm monofilament grass with shock-pad cushioning' },
        { icon: Clock, title: 'Night Floodlights', text: 'High-mast LED floodlights for evening matches' },
        { icon: Train, title: 'Direct Metro Access', text: String(venue.metroDetails || 'Beside Uttara Center Metro Station') },
        { icon: Shield, title: 'Player Amenities', text: 'Changing room, dugouts & parking' }
    ];

    return (
        <View style={{ gap: spacing.md }}>
            <GradientCard>
                <View style={{ gap: spacing.md }}>
                    <Row wrap gap={spacing.sm}>
                        <View style={styles.pill}>
                            <PulseDot />
                            <AppText size="xs" weight="900" tone="brand" upper style={{ flexShrink: 1 }}>
                                {`12 daily slots · 90 mins each${advance > 0 ? ` · ${formatMoney(advance)} advance` : ''}`}
                            </AppText>
                        </View>
                        <Badge icon={Train} label={String(venue.metroStation || 'Uttara Center Metro Station')} />
                    </Row>

                    <Heading level={1} upper>
                        {'Dhaka’s Premier\n'}
                        <Heading level={1} tone="brand" upper>Floodlit Outdoor Turf</Heading>
                    </Heading>

                    <AppText size="sm" tone="soft">
                        {`12 fixed 90-minute slots every day, ${hours}. Pick any date up to ${windowDays} days ahead and pay online with bKash, Nagad or card`}
                        {advance > 0 ? ' with just a ' : ''}
                        {advance > 0 ? <AppText size="sm" weight="800" tone="brand">{`${formatMoney(advance)} advance`}</AppText> : null}
                        {' or the full amount. One slot, one team: no double booking.'}
                    </AppText>

                    <View style={{ gap: spacing.sm }}>
                        <Button title="Book Playing Slot" size="lg" icon={Calendar} iconRight={ChevronRight} onPress={onBook} block />
                        <Row align="stretch">
                            <Button title="Tag Match Squad" variant="secondary" icon={Users} onPress={onSquad} style={{ flex: 1 }} />
                            <Button title={tournamentLabel} variant="warning" icon={Trophy} onPress={onTournaments} style={{ flex: 1 }} />
                        </Row>
                    </View>

                    {/* Live arena stats (from the database, not placeholders) */}
                    <View style={styles.live}>
                        <Row justify="space-between">
                            <Row gap={6}>
                                <PulseDot size={7} />
                                <Label tone="brand">Live arena status</Label>
                            </Row>
                            <Mono size="xs" tone="muted" weight="600">{today}</Mono>
                        </Row>
                        <Row gap={spacing.sm} align="stretch">
                            {liveStats.map((s) => {
                                const Icon = s.icon;
                                return (
                                    <Pressable key={s.label} onPress={s.onPress} style={({ pressed }) => [styles.liveTile, pressed ? { borderColor: colors.borderBrand } : null]} accessibilityRole="button">
                                        <Icon size={16} color={colors.brand} />
                                        <Mono size="xl" tone={s.tone} weight="900" numberOfLines={1} adjustsFontSizeToFit>{s.value}</Mono>
                                        <AppText size="xxs" tone="muted" weight="700" upper center numberOfLines={2}>{s.label}</AppText>
                                    </Pressable>
                                );
                            })}
                        </Row>
                    </View>
                </View>
            </GradientCard>

            <View style={styles.features}>
                {features.map((f) => {
                    const Icon = f.icon;
                    return (
                        <View key={f.title} style={styles.feature}>
                            <View style={styles.featureIcon}>
                                <Icon size={18} color={colors.brand} />
                            </View>
                            <AppText size="sm" weight="800">{f.title}</AppText>
                            <AppText size="xs" tone="muted">{f.text}</AppText>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1, paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderBrand, backgroundColor: colors.brandSoft },
    live: { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    liveTile: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md, paddingHorizontal: 4, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgDeep },
    features: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    feature: { flexBasis: '47%', flexGrow: 1, gap: 4, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    featureIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }
});
