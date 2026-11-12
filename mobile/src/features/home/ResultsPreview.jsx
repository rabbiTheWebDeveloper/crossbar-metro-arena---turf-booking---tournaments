import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Trophy, Award, ArrowRight } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, AppText, Label, Mono, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';

function CardHeader({ icon: Icon, title, action, onAction }) {
    return (
        <Row justify="space-between" style={{ marginBottom: spacing.md }}>
            <Row gap={6} style={{ flex: 1 }}>
                <Icon size={15} color={colors.brand} />
                <Label tone="brand" style={{ flexShrink: 1 }}>{title}</Label>
            </Row>
            <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <AppText size="xs" weight="800" tone="brand">{action}</AppText>
                <ArrowRight size={13} color={colors.brand} />
            </Pressable>
        </Row>
    );
}

/** Home preview of Match Day: the latest published result and the top five scorers. */
export function ResultsPreview({ onSeeAll }) {
    const { matchResults, teams } = useArena();

    // Latest published result (newest match date first; the server order breaks ties)
    const latestResult = useMemo(() => {
        const published = matchResults.filter(m => !m.status || m.status === 'published');
        return [...published].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null;
    }, [matchResults]);

    const top5Scorers = useMemo(() => {
        const allPlayers = teams.flatMap(t => (t.players || []).map(p => ({ ...p, teamName: t.name })));
        return allPlayers
            .filter(p => (Number(p.goals) || 0) > 0)
            .sort((a, b) => (Number(b.goals) || 0) - (Number(a.goals) || 0))
            .slice(0, 5);
    }, [teams]);

    const scorers = latestResult && Array.isArray(latestResult.scorers) ? latestResult.scorers : [];

    return (
        <View style={{ gap: spacing.md }}>
            <Card>
                <CardHeader icon={Trophy} title="Latest Match Day Result" action="Full Leaderboard" onAction={onSeeAll} />
                {latestResult ? (
                    <Pressable onPress={onSeeAll} style={styles.result}>
                        <Row justify="space-between" align="flex-start">
                            <AppText size="xs" tone="muted" style={{ flex: 1 }}>{`${latestResult.courtName || 'Crossbar Metro Arena'} · ${formatIsoDate(latestResult.date)}`}</AppText>
                            <Mono size="xs" tone="muted" weight="600">{String(latestResult.slotDisplay || '')}</Mono>
                        </Row>
                        <Row justify="space-between" style={styles.score}>
                            <AppText size="md" weight="900" style={{ flex: 1 }} numberOfLines={2}>{String(latestResult.homeTeam || '')}</AppText>
                            <Mono size="xxl" tone="brand" weight="900">{`${Number(latestResult.homeScore) || 0} - ${Number(latestResult.awayScore) || 0}`}</Mono>
                            <AppText size="md" weight="900" style={{ flex: 1, textAlign: 'right' }} numberOfLines={2}>{String(latestResult.awayTeam || '')}</AppText>
                        </Row>
                        {scorers.length > 0 ? (
                            <AppText size="xs" tone="soft">
                                <AppText size="xs" tone="muted" weight="700">Goal Scorers: </AppText>
                                {scorers.map(s => `⚽ ${s.playerName} (${s.minute}')`).join('  ')}
                            </AppText>
                        ) : null}
                        {latestResult.playerOfTheMatch ? (
                            <Row gap={6}>
                                <Award size={14} color={colors.gold} />
                                <AppText size="xs" weight="800" tone="warning" style={{ flex: 1 }}>{`Player of the Match: ${latestResult.playerOfTheMatch}`}</AppText>
                            </Row>
                        ) : null}
                    </Pressable>
                ) : (
                    <AppText size="sm" tone="muted">No match scores posted today yet.</AppText>
                )}
            </Card>

            <Card>
                <CardHeader icon={Award} title="Golden Boot · Top 5 Scorers" action="View All" onAction={onSeeAll} />
                {top5Scorers.length === 0 ? (
                    <View style={styles.empty}>
                        <AppText size="xs" tone="dim" center>No goal scorers registered yet. Match statistics update after certified fixtures.</AppText>
                    </View>
                ) : (
                    <View style={{ gap: spacing.sm }}>
                        {top5Scorers.map((scorer, idx) => (
                            <View key={`${scorer.id || scorer.name}-${idx}`} style={styles.scorer}>
                                <View style={[styles.rank, idx === 0 ? { backgroundColor: colors.gold } : null]}>
                                    <AppText size="xs" weight="900" style={{ color: idx === 0 ? colors.onBrand : colors.textSoft }}>{String(idx + 1)}</AppText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AppText size="sm" weight="800" numberOfLines={1}>{String(scorer.name || '')}</AppText>
                                    <AppText size="xs" tone="muted" numberOfLines={1}>{String(scorer.teamName || '')}</AppText>
                                </View>
                                <Mono size="md" tone="brand" weight="900">{`${Number(scorer.goals) || 0} Goals`}</Mono>
                            </View>
                        ))}
                    </View>
                )}
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    result: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    score: { gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
    empty: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    scorer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    rank: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.glassStrong, alignItems: 'center', justifyContent: 'center' }
});
