import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Row, AppText, Mono, Button } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';
import { sortStandings } from './matchdayUtils';

const PAGE = 10;
const BRONZE = '#b45309'; // third-place medal (not part of the app palette)

/** Rank badge colours: gold, silver, bronze, then neutral. */
export function rankStyle(idx) {
    if (idx === 0) return { bg: colors.gold, fg: colors.onBrand };
    if (idx === 1) return { bg: colors.textSoft, fg: colors.onBrand };
    if (idx === 2) return { bg: BRONZE, fg: colors.white };
    return { bg: colors.glassStrong, fg: colors.textSoft };
}

const FORM_TONES = { W: tones.success, D: tones.warning, L: tones.danger };

function StatCell({ label, value, tone }) {
    return (
        <View style={styles.cell}>
            <AppText size="xxs" tone="dim" weight="800">{label}</AppText>
            <Mono size="sm" tone={tone || 'soft'} weight="700">{String(value)}</Mono>
        </View>
    );
}

/**
 * Arena league standings. The website's 11-column table becomes one row-card per team:
 * position, team and points on the first line, P/W/D/L/GF/GA/GD and the last-5 form below.
 */
export function StandingsTable({ teams }) {
    const sorted = useMemo(() => sortStandings(teams), [teams]);
    const [visible, setVisible] = useState(PAGE);

    if (sorted.length === 0) {
        return (
            <Card>
                <AppText size="sm" tone="dim" center>
                    No registered squad standings recorded yet. Standings are generated from certified matches.
                </AppText>
            </Card>
        );
    }

    return (
        <View style={{ gap: spacing.sm }}>
            {sorted.slice(0, visible).map((team, idx) => {
                const s = team.stats || {};
                const n = (k) => Number(s[k]) || 0;
                const gd = n('gf') - n('ga');
                const form = Array.isArray(s.form) ? s.form.slice(0, 5) : [];
                const rank = rankStyle(idx);
                return (
                    <Card key={team.id || `${team.name}-${idx}`} style={{ padding: spacing.md }} padded={false}>
                        <Row>
                            <View style={[styles.rank, { backgroundColor: rank.bg }]}>
                                <AppText size="sm" weight="900" style={{ color: rank.fg }}>{String(idx + 1)}</AppText>
                            </View>
                            <View style={[styles.dot, { backgroundColor: team.homeColor || colors.brand }]} />
                            <AppText size="md" weight="800" style={{ flex: 1 }} numberOfLines={1}>{team.name || 'Team'}</AppText>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Mono size="lg" tone="brand" weight="900">{String(n('points'))}</Mono>
                                <AppText size="xxs" tone="muted" weight="800">PTS</AppText>
                            </View>
                        </Row>
                        <View style={styles.statsRow}>
                            <StatCell label="P" value={n('played')} />
                            <StatCell label="W" value={n('won')} tone="brand" />
                            <StatCell label="D" value={n('drawn')} tone="warning" />
                            <StatCell label="L" value={n('lost')} tone="danger" />
                            <StatCell label="GF" value={n('gf')} />
                            <StatCell label="GA" value={n('ga')} />
                            <StatCell label="GD" value={gd > 0 ? `+${gd}` : gd} tone="default" />
                        </View>
                        {form.length > 0 ? (
                            <Row gap={4} style={{ marginTop: spacing.sm }}>
                                <AppText size="xxs" tone="dim" weight="800" upper style={{ marginRight: 4 }}>Form (last 5)</AppText>
                                {form.map((f, i) => {
                                    const t = FORM_TONES[f] || tones.danger;
                                    return (
                                        <View key={`${f}-${i}`} style={[styles.form, { backgroundColor: t.bg, borderColor: t.border }]}>
                                            <AppText size="xxs" weight="900" style={{ color: t.fg }}>{String(f)}</AppText>
                                        </View>
                                    );
                                })}
                            </Row>
                        ) : null}
                    </Card>
                );
            })}
            {sorted.length > visible ? (
                <Button title={`Show more teams (${sorted.length - visible})`} variant="secondary" size="sm" onPress={() => setVisible(v => v + PAGE)} />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    rank: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 11, height: 11, borderRadius: 6 },
    statsRow: { flexDirection: 'row', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
    cell: { flex: 1, alignItems: 'center', gap: 1 },
    form: { width: 22, height: 22, borderRadius: radius.sm - 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }
});
