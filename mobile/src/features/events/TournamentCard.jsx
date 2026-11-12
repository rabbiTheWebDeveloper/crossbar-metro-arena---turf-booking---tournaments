import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Trophy, Calendar, Users, DollarSign, ChevronRight, Lock, Check } from 'lucide-react-native';
import { Card, Row, AppText, Heading, Mono, Badge, Button, ProgressBar, Label } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';
import { formatMoney } from '@/lib/format';
import { formatIsoDate, isIsoDate } from '@/lib/dateUtils';
import { availabilityBadge } from './tournamentUtils';

/** Icon + one line of text. Pass the text as an <AppText> child. */
function InfoLine({ icon: Icon, children }) {
    return (
        <Row gap={8} align="flex-start">
            <Icon size={15} color={colors.brand} style={{ marginTop: 1 }} />
            {children}
        </Row>
    );
}

/**
 * One tournament with everything a captain needs before registering: prize pool, dates, format,
 * entry fee, deadline, roster fill and highlights.
 *   availability: 'open' | 'full' | 'closed' (see tournamentAvailability)
 *   onRegister(): opens the registration form; only called while registration is open
 */
export function TournamentCard({ tournament, availability, onRegister }) {
    const t = tournament || {};
    const max = Number(t.maxTeams) || 0;
    const registered = Number(t.registeredCount) || 0;
    const fillPercentage = max > 0 ? Math.min(100, Math.round((registered / max) * 100)) : 0;
    const spotsLeft = Math.max(0, max - registered);
    const isOpen = availability === 'open';
    const badge = availabilityBadge(t, availability);
    const highlights = Array.isArray(t.highlights) ? t.highlights.filter(Boolean) : [];
    const deadline = isIsoDate(t.registrationDeadline) ? formatIsoDate(t.registrationDeadline) : String(t.registrationDeadline || '');
    const rosterText = `${registered}${max > 0 ? ` / ${max}` : ''} Teams`;

    return (
        <Card tone={isOpen ? 'warning' : undefined} style={isOpen ? null : { opacity: 0.8 }}>
            <Row justify="space-between">
                <Mono size="xs" tone="warning" weight="800" style={{ flex: 1, textTransform: 'uppercase' }} numberOfLines={1}>{t.category || ''}</Mono>
                <Badge tone={badge.tone} label={badge.label} />
            </Row>

            <Heading level={2} upper style={{ marginTop: 8 }}>{t.title || 'Tournament'}</Heading>
            {t.edition ? <AppText size="xs" tone="muted">{t.edition}</AppText> : null}

            <View style={styles.prize}>
                <Row justify="space-between">
                    <Label tone="soft">Total Prize Pool</Label>
                    <Mono size="lg" tone="warning" weight="900">{formatMoney(t.prizePool)}</Mono>
                </Row>
                {t.firstPrize || t.runnerUpPrize ? (
                    <View style={styles.prizeSplit}>
                        {t.firstPrize ? (
                            <AppText size="xs" tone="soft">
                                <AppText size="xs" weight="800">{'1st Place: '}</AppText>
                                {String(t.firstPrize)}
                            </AppText>
                        ) : null}
                        {t.runnerUpPrize ? (
                            <AppText size="xs" tone="soft">
                                <AppText size="xs" weight="800">{'Runners Up: '}</AppText>
                                {String(t.runnerUpPrize)}
                            </AppText>
                        ) : null}
                    </View>
                ) : null}
            </View>

            <View style={{ gap: 7, marginBottom: spacing.md }}>
                {t.dates ? (
                    <InfoLine icon={Calendar}>
                        <AppText size="sm" tone="soft" style={styles.infoText}>{String(t.dates)}</AppText>
                    </InfoLine>
                ) : null}
                {t.format ? (
                    <InfoLine icon={Users}>
                        <AppText size="sm" tone="soft" style={styles.infoText}>{String(t.format)}</AppText>
                    </InfoLine>
                ) : null}
                <InfoLine icon={DollarSign}>
                    <AppText size="sm" tone="soft" style={styles.infoText}>
                        {'Entry Fee: '}
                        <AppText size="sm" weight="800" mono>{formatMoney(t.entryFee)}</AppText>
                        {' per team'}
                    </AppText>
                </InfoLine>
                {deadline ? (
                    <InfoLine icon={Lock}>
                        <AppText size="sm" tone="soft" style={styles.infoText}>
                            {'Register by '}
                            <AppText size="sm" weight="800">{deadline}</AppText>
                        </AppText>
                    </InfoLine>
                ) : null}
            </View>

            <View style={{ gap: 6, marginBottom: spacing.md }}>
                <Row justify="space-between">
                    <AppText size="xs" tone="soft">
                        {'Roster: '}
                        <AppText size="xs" weight="800">{rosterText}</AppText>
                    </AppText>
                    {max > 0 ? (
                        <AppText size="xs" weight="800" tone={spotsLeft > 0 ? 'warning' : 'danger'}>{spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'No spots left'}</AppText>
                    ) : null}
                </Row>
                <ProgressBar value={fillPercentage} tone="warning" height={7} />
            </View>

            {highlights.length > 0 ? (
                <View style={styles.highlights}>
                    <Label>Tournament Highlights:</Label>
                    {highlights.map((h, i) => (
                        <Row key={`${i}-${h}`} gap={6} align="flex-start">
                            <Check size={13} color={colors.brand} strokeWidth={3} style={{ marginTop: 2 }} />
                            <AppText size="xs" tone="soft" style={{ flex: 1 }}>{String(h)}</AppText>
                        </Row>
                    ))}
                </View>
            ) : null}

            <Button
                title={isOpen ? 'Register Team Squad' : (availability === 'full' ? 'Tournament Full' : 'Registration Closed')}
                icon={Trophy}
                iconRight={isOpen ? ChevronRight : undefined}
                variant={isOpen ? 'primary' : 'secondary'}
                disabled={!isOpen}
                block
                onPress={onRegister}
            />
        </Card>
    );
}

const styles = StyleSheet.create({
    prize: { marginVertical: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: tones.warning.border, backgroundColor: tones.warning.bg, gap: 6 },
    prizeSplit: { gap: 2, paddingTop: 6, borderTopWidth: 1, borderTopColor: tones.warning.border },
    infoText: { flex: 1 },
    highlights: { gap: 6, paddingTop: spacing.md, marginBottom: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }
});
