import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Pencil, Trash2, Lock, Unlock } from 'lucide-react-native';
import { Card, Row, AppText, Heading, Label, Mono, Badge, Button, IconButton } from '@/components/ui';
import { absoluteUrl } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { isIsoDate, formatIsoDate } from '@/lib/dateUtils';
import { colors, radius, spacing } from '@/theme';
import { TOURNAMENT_STATUS_TONE } from './helpers';

/**
 * One tournament in the admin list.
 *   registered: teams counted against the cap     busy: an action on this card is in flight
 */
export function TournamentCard({ tournament: t, registered, busy, onEdit, onSetStatus, onDelete }) {
    const [bannerFailed, setBannerFailed] = useState(false);
    const status = t.status || 'open';
    const full = registered >= (Number(t.maxTeams) || 0);
    const deadline = isIsoDate(t.registrationDeadline) ? formatIsoDate(t.registrationDeadline, { weekday: false }) : (t.registrationDeadline || '—');
    const prizes = [t.firstPrize ? `🥇 ${t.firstPrize}` : '', t.runnerUpPrize ? `🥈 ${t.runnerUpPrize}` : ''].filter(Boolean).join(' · ');

    return (
        <Card style={[{ gap: spacing.md }, status === 'open' ? null : { opacity: 0.85 }]}>
            {t.bannerUrl && !bannerFailed ? (
                <View style={styles.banner}>
                    <Image source={{ uri: absoluteUrl(t.bannerUrl) }} style={styles.bannerImage} contentFit="cover" transition={150} onError={() => setBannerFailed(true)} />
                </View>
            ) : null}

            <Row justify="space-between" align="flex-start">
                <Row wrap gap={6} style={{ flex: 1 }}>
                    {t.category ? <Badge tone="brand" label={String(t.category)} /> : null}
                    <Badge tone={TOURNAMENT_STATUS_TONE[status] || 'neutral'} label={String(status).replace(/_/g, ' ')} />
                </Row>
                <Mono size="sm" tone={full ? 'warning' : 'default'}>{`${registered} / ${t.maxTeams ?? 0} teams${full ? ' · full' : ''}`}</Mono>
            </Row>

            <View>
                <Heading level={3}>{t.title}</Heading>
                <AppText size="sm" tone="muted" style={{ marginTop: 2 }}>{`${t.edition ? `${t.edition} · ` : ''}${t.format || ''}`}</AppText>
            </View>

            <View style={styles.money}>
                <Row align="flex-start">
                    <View style={{ flex: 1 }}>
                        <Label tone="dim">Entry Fee</Label>
                        <Mono size="md">{formatMoney(t.entryFee)}</Mono>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Label tone="dim">Prize Pool</Label>
                        <Mono size="md" tone="brand">{formatMoney(t.prizePool)}</Mono>
                    </View>
                </Row>
                {prizes ? <AppText size="xs" tone="muted">{prizes}</AppText> : null}
            </View>

            <View style={styles.dates}>
                <AppText size="sm" tone="muted">
                    Dates: <AppText size="sm" tone="soft">{t.dates || '—'}</AppText>
                </AppText>
                <AppText size="sm" tone="muted">
                    Deadline: <AppText size="sm" tone="soft">{deadline}</AppText>
                </AppText>
            </View>

            <Row gap={6}>
                <Button title="Edit" icon={Pencil} variant="secondary" size="sm" disabled={busy} onPress={onEdit} style={{ flex: 1 }} />
                {status === 'open' ? (
                    <Button title="Close registration" icon={Lock} variant="warning" size="sm" disabled={busy} onPress={() => onSetStatus('closed')} style={{ flex: 1.4 }} />
                ) : (
                    <Button title="Reopen" icon={Unlock} variant="secondary" size="sm" disabled={busy} onPress={() => onSetStatus('open')} style={{ flex: 1.4 }} />
                )}
                <IconButton icon={Trash2} size={34} iconSize={15} tone={colors.danger} disabled={busy} onPress={onDelete} accessibilityLabel="Delete tournament" />
            </Row>
        </Card>
    );
}

const styles = StyleSheet.create({
    banner: { width: '100%', aspectRatio: 3, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border },
    bannerImage: { width: '100%', height: '100%' },
    money: { gap: 6, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border },
    dates: { gap: 2, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }
});
