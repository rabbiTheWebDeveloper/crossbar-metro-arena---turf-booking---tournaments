import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Card, Row, AppText, Mono, Badge, Button } from '@/components/ui';
import { formatIsoDate } from '@/lib/dateUtils';
import { colors, radius, spacing } from '@/theme';
import { EVENT_LABEL, minuteLabel } from './helpers';

const STATUS_TONE = { published: 'success', rejected: 'danger', pending_approval: 'warning' };

/** Timeline entries of one side. Away entries are mirrored and right-aligned. */
function EventColumn({ events, away }) {
    return (
        <View style={{ flex: 1, gap: 2 }}>
            {events.map((ev, i) => {
                const minute = minuteLabel(ev.minute);
                const label = EVENT_LABEL[ev.type] || String(ev.type || '');
                return (
                    <AppText key={`${ev.playerName}-${i}`} size="xs" tone="soft" mono style={away ? { textAlign: 'right' } : null}>
                        {away ? <AppText size="xs" tone="dim" mono>{`· ${label} `}</AppText> : (minute ? <AppText size="xs" tone="dim" mono>{`${minute} `}</AppText> : null)}
                        {String(ev.playerName || '')}
                        {away ? (minute ? <AppText size="xs" tone="dim" mono>{` ${minute}`}</AppText> : null) : <AppText size="xs" tone="dim" mono>{` · ${label}`}</AppText>}
                    </AppText>
                );
            })}
        </View>
    );
}

/**
 * One submitted scoreline with its review actions.
 *   busy: an action on this card is in flight
 */
export function ResultCard({ result: res, busy, onSetStatus, onDelete }) {
    const isPublished = res.status === 'published';
    const isPending = res.status === 'pending_approval';
    const isRejected = res.status === 'rejected';
    const events = Array.isArray(res.events) ? res.events : [];
    const scorers = Array.isArray(res.scorers) ? res.scorers : [];
    const tone = STATUS_TONE[res.status] || 'warning';
    const meta = [res.date ? formatIsoDate(res.date, { weekday: false }) : '', res.slotDisplay, res.matchType].filter(Boolean).join(' · ');

    return (
        <Card tone={tone} style={[{ gap: spacing.md }, isRejected ? { opacity: 0.8 } : null]}>
            <Row justify="space-between" align="flex-start">
                <AppText size="xs" tone="muted" mono upper style={{ flex: 1 }}>{meta}</AppText>
                <Badge tone={tone} label={String(res.status || '').replace(/_/g, ' ')} />
            </Row>

            {/* Scoreline */}
            <Row gap={spacing.md} justify="center">
                <AppText size="md" weight="800" style={{ flex: 1, textAlign: 'right' }} numberOfLines={2}>{res.homeTeam}</AppText>
                <View style={styles.score}>
                    <Mono size="xl" weight="900" tone={isRejected ? 'dim' : 'brand'} style={isRejected ? { textDecorationLine: 'line-through' } : null}>
                        {`${res.homeScore ?? 0} : ${res.awayScore ?? 0}`}
                    </Mono>
                </View>
                <AppText size="md" weight="800" style={{ flex: 1 }} numberOfLines={2}>{res.awayTeam}</AppText>
            </Row>

            {/* Events / scorers */}
            {events.length > 0 ? (
                <Row align="flex-start" gap={spacing.md}>
                    <EventColumn events={events.filter(ev => ev.side === 'home')} />
                    <EventColumn events={events.filter(ev => ev.side === 'away')} away />
                </Row>
            ) : scorers.length > 0 ? (
                <AppText size="xs" tone="soft" mono>
                    {`Scorers: ${scorers.map(s => `${s.playerName} (${s.teamName}${minuteLabel(s.minute) ? `, ${minuteLabel(s.minute)}` : ''})`).join(', ')}`}
                </AppText>
            ) : null}

            {res.matchReport ? <AppText size="xs" tone="muted" italic numberOfLines={3}>{res.matchReport}</AppText> : null}

            {/* Details */}
            <View style={styles.details}>
                {res.playerOfTheMatch ? (
                    <AppText size="sm" tone="muted">
                        ★ Player of Match: <AppText size="sm" weight="800">{res.playerOfTheMatch}</AppText>
                    </AppText>
                ) : null}
                <AppText size="sm" tone="dim">{`Submitted by: ${res.postedBy || 'Unknown'}${res.postedByPhone ? ` (${res.postedByPhone})` : ''}`}</AppText>
            </View>

            {/* Actions */}
            <Row wrap gap={6} justify="flex-end">
                {isPending ? <Button title={busy ? 'Saving…' : 'Approve & Publish'} size="sm" loading={busy} onPress={() => onSetStatus('published')} /> : null}
                {isPending ? <Button title="Reject" variant="secondary" size="sm" disabled={busy} onPress={() => onSetStatus('rejected')} /> : null}
                {isPublished ? <Button title="Unpublish" variant="secondary" size="sm" disabled={busy} onPress={() => onSetStatus('rejected')} accessibilityHint="Unpublish and reverse team stats" /> : null}
                {isRejected ? <Button title="Publish anyway" variant="outline" size="sm" disabled={busy} onPress={() => onSetStatus('published')} /> : null}
                <Button title="Delete" icon={Trash2} variant="danger" size="sm" disabled={busy} onPress={onDelete} />
            </Row>
        </Card>
    );
}

const styles = StyleSheet.create({
    score: { paddingVertical: 6, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.border },
    details: { gap: 2, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }
});
