import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, ClipboardList } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, Row, AppText, Mono, Badge, Button, confirm } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';
import { RESULT_STATUS_TONE, statusLabel } from './matchdayUtils';

/**
 * "My Submitted Results": the signed-in captain's own submissions with their review status.
 * A result can be withdrawn while it is still waiting for approval. Collapsed by default.
 */
export function MyResultsCard() {
    const { myMatchResults, handleDeleteMatchResult } = useArena();
    const [open, setOpen] = useState(false);
    const [withdrawingId, setWithdrawingId] = useState('');
    const list = myMatchResults || [];
    const pending = list.filter(m => m.status === 'pending_approval').length;

    const withdraw = async (m) => {
        const ok = await confirm('Withdraw result?', `Withdraw the submitted result ${m.homeTeam} ${m.homeScore}–${m.awayScore} ${m.awayTeam}?`, { confirmText: 'Withdraw', destructive: true });
        if (!ok) return;
        setWithdrawingId(m.id);
        await handleDeleteMatchResult(m.id);
        setWithdrawingId('');
    };

    return (
        <Card padded={false}>
            <Pressable onPress={() => setOpen(o => !o)} style={styles.head} accessibilityRole="button" accessibilityState={{ expanded: open }}>
                <ClipboardList size={18} color={colors.brand} />
                <View style={{ flex: 1 }}>
                    <AppText size="sm" weight="800">{`My Submitted Results (${list.length})`}</AppText>
                    {pending > 0 ? <AppText size="xs" tone="warning">{`${pending} waiting for arena desk approval`}</AppText> : null}
                </View>
                {open ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
            </Pressable>
            {open ? (
                <View style={styles.body}>
                    {list.length === 0 ? <AppText size="xs" tone="muted">You have not submitted any results yet.</AppText> : null}
                    {list.map(m => (
                        <View key={m.id} style={styles.item}>
                            <Row wrap gap={8}>
                                <Badge tone={RESULT_STATUS_TONE[m.status] || 'neutral'} label={statusLabel(m.status) || 'published'} />
                                <AppText size="xs" tone="muted" style={{ flex: 1 }}>{`${formatIsoDate(m.date)} · ${m.slotDisplay || ''}`}</AppText>
                            </Row>
                            <AppText size="sm" weight="800" style={{ marginTop: 4 }}>
                                {`${m.homeTeam} `}
                                <Mono size="sm" tone="brand">{`${m.homeScore}–${m.awayScore}`}</Mono>
                                {` ${m.awayTeam}`}
                            </AppText>
                            {m.playerOfTheMatch ? <AppText size="xs" tone="muted">{`MOTM: ${m.playerOfTheMatch}`}</AppText> : null}
                            {m.status === 'pending_approval' ? (
                                <Button
                                    title={withdrawingId === m.id ? 'Withdrawing…' : 'Withdraw'}
                                    variant="danger"
                                    size="sm"
                                    loading={withdrawingId === m.id}
                                    onPress={() => withdraw(m)}
                                    style={{ alignSelf: 'flex-start', marginTop: 8 }}
                                />
                            ) : null}
                        </View>
                    ))}
                </View>
            ) : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
    body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
    item: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }
});
