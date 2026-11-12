import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Row, AppText, Mono, Segmented } from '@/components/ui';
import { spacing } from '@/theme';
import { rankStyle } from './StandingsTable';

const MAX_SCORERS = 9;
const PERIODS = [
    { value: 'all_time', label: 'All Time' },
    { value: 'this_month', label: 'This Month' }
];

/**
 * Golden Boot leaderboard (top 9 scorers) with the All Time / This Month toggle.
 *   scorers: output of buildTopScorers() for the selected period
 */
export function GoldenBoot({ scorers, period, onChangePeriod }) {
    const list = (scorers || []).slice(0, MAX_SCORERS);
    return (
        <View style={{ gap: spacing.sm }}>
            <Segmented value={period} onChange={onChangePeriod} options={PERIODS} size="sm" />
            {list.length === 0 ? (
                <Card>
                    <AppText size="sm" tone="dim" center>No goal scorers recorded for this period yet.</AppText>
                </Card>
            ) : list.map((scorer, idx) => {
                const rank = rankStyle(idx);
                return (
                    <Card key={`${scorer.teamName}-${scorer.id || scorer.name}-${idx}`} padded={false} style={{ padding: spacing.md }}>
                        <Row>
                            <View style={[styles.rank, { backgroundColor: rank.bg }]}>
                                <AppText size="sm" weight="900" style={{ color: rank.fg }}>{String(idx + 1)}</AppText>
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText size="sm" weight="800" numberOfLines={1}>{scorer.name || 'Player'}</AppText>
                                <AppText size="xs" tone="muted" numberOfLines={1}>
                                    {`${scorer.teamName || ''}${scorer.number !== undefined && scorer.number !== null ? ` · #${scorer.number}` : ''}`}
                                </AppText>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Mono size="lg" tone="brand" weight="900">{String(scorer.goalsCount)}</Mono>
                                <AppText size="xxs" tone="muted" upper>Goals</AppText>
                            </View>
                        </Row>
                    </Card>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    rank: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }
});
