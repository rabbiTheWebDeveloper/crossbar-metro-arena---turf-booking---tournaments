import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Target, Award } from 'lucide-react-native';
import { Card, Row, AppText, Mono, Badge, Label } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';
import { absoluteUrl } from '@/lib/api';

/** Small coloured card glyph (yellow / red card) with its count. */
function CardCount({ color, label, count }) {
    return (
        <Row gap={6}>
            <View style={[styles.cardGlyph, { backgroundColor: color }]} />
            <AppText size="xs" tone="muted">{label}</AppText>
            <AppText size="xs" weight="800">{String(Number(count) || 0)}</AppText>
        </Row>
    );
}

/** A published match result: scoreboard, goal scorers, cards, player of the match, report and photo. */
export function MatchResultCard({ match }) {
    const m = match || {};
    const scorers = Array.isArray(m.scorers) ? m.scorers : [];
    return (
        <Card>
            <Row justify="space-between" align="flex-start">
                <View style={{ flex: 1, gap: 2 }}>
                    <AppText size="xs" tone="brand" weight="800">{formatIsoDate(m.date)}</AppText>
                    <AppText size="xs" tone="muted">{[m.slotDisplay, m.courtName].filter(Boolean).join(' · ')}</AppText>
                </View>
                {m.matchType ? <Badge label={m.matchType} /> : null}
            </Row>

            <View style={styles.board}>
                <AppText size="md" weight="900" style={styles.teamHome} numberOfLines={2}>{m.homeTeam || 'Home'}</AppText>
                <View style={styles.score}>
                    <Mono size="xl" tone="brand" weight="900">{`${Number(m.homeScore) || 0} - ${Number(m.awayScore) || 0}`}</Mono>
                </View>
                <AppText size="md" weight="900" style={styles.teamAway} numberOfLines={2}>{m.awayTeam || 'Away'}</AppText>
            </View>

            <View style={styles.panel}>
                <Row gap={5}>
                    <Target size={13} color={colors.brand} />
                    <Label>Goal Scorers</Label>
                </Row>
                {scorers.length > 0 ? scorers.map((s, idx) => (
                    <Row key={`${s.playerName}-${idx}`} justify="space-between">
                        <AppText size="xs" tone="soft" style={{ flex: 1 }}>
                            {s.playerName}
                            <AppText size="xs" tone="dim">{` (${s.teamName || ''})`}</AppText>
                        </AppText>
                        <Mono size="xs" tone="brand">{`${Number(s.minute) || 0}'`}</Mono>
                    </Row>
                )) : <AppText size="xs" tone="dim">No goal events logged.</AppText>}
            </View>

            <View style={styles.panel}>
                {m.playerOfTheMatch ? (
                    <Row gap={6}>
                        <Award size={15} color={colors.gold} />
                        <AppText size="xs" tone="warning" weight="700" style={{ flex: 1 }}>{`Player of the Match: ${m.playerOfTheMatch}`}</AppText>
                    </Row>
                ) : null}
                <Row gap={spacing.lg} wrap>
                    <CardCount color={colors.warning} label="Yellow Cards:" count={m.yellowCards} />
                    <CardCount color={colors.danger} label="Red Cards:" count={m.redCards} />
                </Row>
                {m.matchReport ? (
                    <View style={styles.report}>
                        <AppText size="xs" tone="soft" italic>{`"${m.matchReport}"`}</AppText>
                    </View>
                ) : null}
            </View>

            {m.teamPhoto ? (
                <Image source={{ uri: absoluteUrl(m.teamPhoto) }} style={styles.photo} contentFit="cover" transition={150} accessibilityLabel="Match Day Squad" />
            ) : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    board: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, marginVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
    teamHome: { flex: 1, textAlign: 'right' },
    teamAway: { flex: 1, textAlign: 'left' },
    score: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    panel: { gap: 6, padding: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    cardGlyph: { width: 9, height: 13, borderRadius: 2 },
    report: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 },
    photo: { width: '100%', height: 180, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginTop: 4 }
});
