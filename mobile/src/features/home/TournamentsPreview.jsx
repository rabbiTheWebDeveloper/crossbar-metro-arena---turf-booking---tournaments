import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Trophy, Calendar, Users, DollarSign, Lock, Phone } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, SectionHeader, AppText, Heading, Label, Mono, Badge, Button, Row, ProgressBar, EmptyState } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';
import { formatMoney } from '@/lib/format';
import { formatIsoDate, isIsoDate } from '@/lib/dateUtils';
import { useVenueContacts } from '@/features/venue/useVenueContacts';

const PREVIEW_COUNT = 3;
const RANK = { open: 0, full: 1, closed: 2 };

const isRegistrationOpen = (t, today) => ['open', 'fast_filling'].includes(t.status) && (!t.registrationDeadline || t.registrationDeadline >= today);

/** Tournament availability for a card: 'open' | 'full' | 'closed' */
const tournamentAvailability = (t, today) => {
    const max = Number(t.maxTeams) || 0;
    const registered = Number(t.registeredCount) || 0;
    if (!isRegistrationOpen(t, today)) return 'closed';
    if (max > 0 && registered >= max) return 'full';
    return 'open';
};

const badgeFor = (t, availability) => {
    if (availability === 'full') return { label: 'Full', tone: 'danger' };
    if (availability === 'closed') return { label: 'Closed', tone: 'neutral' };
    if (t.status === 'fast_filling') return { label: 'Filling Fast', tone: 'warning' };
    return { label: 'Registration Open', tone: 'success' };
};

function Line({ icon: Icon, children }) {
    return (
        <Row gap={spacing.sm} align="flex-start">
            <Icon size={14} color={colors.brand} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>{children}</View>
        </Row>
    );
}

/**
 * Home preview of Events: the next tournaments (open registrations first) with prize pool,
 * entry fee and roster progress. Registration itself happens on the Events screen.
 */
export function TournamentsPreview({ today, onSeeAll }) {
    const { tournaments } = useArena();
    const { telHref, phoneLabel, open } = useVenueContacts();

    // Open tournaments first, then full / closed ones (kept visible with a badge)
    const ordered = useMemo(() => {
        const list = (tournaments || []).map(t => ({ t, availability: tournamentAvailability(t, today) }));
        return list.sort((a, b) => RANK[a.availability] - RANK[b.availability]);
    }, [tournaments, today]);
    const hasOpen = ordered.some(x => x.availability === 'open');
    const shown = ordered.slice(0, PREVIEW_COUNT);

    return (
        <View>
            <SectionHeader
                eyebrow="Tournaments & Cups"
                title="Championship Tournaments & Leagues"
                subtitle="Bring your squad to compete for trophies, medals and cash prizes at Crossbar Metro Arena."
                action="See all"
                onAction={onSeeAll}
            />

            {ordered.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Trophy}
                        title="No tournaments announced"
                        message="There are no tournament registrations open right now. Check back soon, or contact the arena to host a private cup."
                        action={telHref ? <Button title={`Call the arena (${phoneLabel})`} variant="warning" size="sm" icon={Phone} onPress={() => open(telHref)} /> : null}
                        style={{ paddingVertical: spacing.md }}
                    />
                </Card>
            ) : (
                <View style={{ gap: spacing.md }}>
                    {!hasOpen ? <AppText size="xs" tone="muted" center>Registration is currently closed for all listed tournaments.</AppText> : null}
                    {shown.map(({ t, availability }) => {
                        const max = Number(t.maxTeams) || 0;
                        const registered = Number(t.registeredCount) || 0;
                        const fill = max > 0 ? Math.min(100, Math.round((registered / max) * 100)) : 0;
                        const spotsLeft = Math.max(0, max - registered);
                        const isOpen = availability === 'open';
                        const badge = badgeFor(t, availability);
                        return (
                            <Card key={t.id} onPress={onSeeAll} style={isOpen ? null : { opacity: 0.8 }}>
                                <Row justify="space-between">
                                    <Mono size="xs" tone="warning" style={{ flex: 1, textTransform: 'uppercase' }} numberOfLines={1}>{String(t.category || '')}</Mono>
                                    <Badge tone={badge.tone} label={badge.label} />
                                </Row>
                                <Heading level={2} upper style={{ marginTop: spacing.sm }}>{String(t.title || '')}</Heading>
                                {t.edition ? <AppText size="xs" tone="muted">{String(t.edition)}</AppText> : null}

                                <View style={styles.prize}>
                                    <Label tone="soft" style={{ flex: 1 }}>Total Prize Pool</Label>
                                    <Mono size="lg" tone="warning" weight="900">{formatMoney(t.prizePool)}</Mono>
                                </View>

                                <View style={{ gap: 6 }}>
                                    {t.dates ? <Line icon={Calendar}><AppText size="xs" tone="soft">{String(t.dates)}</AppText></Line> : null}
                                    {t.format ? <Line icon={Users}><AppText size="xs" tone="soft">{String(t.format)}</AppText></Line> : null}
                                    <Line icon={DollarSign}>
                                        <AppText size="xs" tone="soft">
                                            {'Entry Fee: '}
                                            <Mono size="xs" tone="white">{formatMoney(t.entryFee)}</Mono>
                                            {' per team'}
                                        </AppText>
                                    </Line>
                                    {t.registrationDeadline ? (
                                        <Line icon={Lock}>
                                            <AppText size="xs" tone="soft">
                                                {'Register by '}
                                                <AppText size="xs" weight="800">{isIsoDate(t.registrationDeadline) ? formatIsoDate(t.registrationDeadline) : String(t.registrationDeadline)}</AppText>
                                            </AppText>
                                        </Line>
                                    ) : null}
                                </View>

                                <View style={{ gap: 6, marginTop: spacing.md }}>
                                    <Row justify="space-between">
                                        <AppText size="xs" tone="soft">
                                            {'Roster: '}
                                            <AppText size="xs" weight="800">{`${registered}${max > 0 ? ` / ${max}` : ''} Teams`}</AppText>
                                        </AppText>
                                        {max > 0 ? <AppText size="xs" weight="800" tone={spotsLeft > 0 ? 'warning' : 'danger'}>{spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'No spots left'}</AppText> : null}
                                    </Row>
                                    <ProgressBar value={fill} tone="warning" />
                                </View>

                                <Button
                                    title={isOpen ? 'Register Team Squad' : availability === 'full' ? 'Tournament Full' : 'Registration Closed'}
                                    variant={isOpen ? 'warning' : 'secondary'}
                                    icon={Trophy}
                                    onPress={onSeeAll}
                                    block
                                    style={{ marginTop: spacing.md }}
                                />
                            </Card>
                        );
                    })}
                    {ordered.length > shown.length ? <Button title={`See all ${ordered.length} tournaments`} variant="outline" onPress={onSeeAll} block /> : null}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    prize: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: tones.warning.border, backgroundColor: colors.warningSoft }
});
