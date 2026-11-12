import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Phone, Mail, Pencil, Ban, CheckCircle2 } from 'lucide-react-native';
import { AppText, Badge, Button, Card, Mono, Row } from '@/components/ui';
import { colors, tones } from '@/theme';
import { dhakaDate, formatIsoDate } from '@/lib/dateUtils';
import { ROLE_TONES } from './constants';

/**
 * One registered account: identity, contact, role, activity and the edit / disable actions.
 *   stats: { bookings, tournaments }      teamLabel: team name (or the raw team id)
 */
export function PlayerCard({ user, stats, teamLabel, busy, onEdit, onToggleDisabled }) {
    const u = user;
    const showEmail = u.email && !String(u.email).endsWith('@bookcrossbar.com');
    const joined = u.createdAt ? formatIsoDate(dhakaDate(u.createdAt), { weekday: false }) : '—';
    return (
        <Card style={[{ gap: 8 }, u.disabled ? { opacity: 0.6 } : null]}>
            <Row align="flex-start" gap={10}>
                <View style={styles.avatar}>
                    <AppText size="md" weight="900" style={{ color: tones.success.fg }}>{String(u.name || '?').trim().charAt(0).toUpperCase() || '?'}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                    <AppText size="md" weight="800" numberOfLines={1}>{u.name || 'Unnamed'}</AppText>
                    {teamLabel ? <AppText size="xs" tone="dim" numberOfLines={1}>{`Team: ${teamLabel}`}</AppText> : null}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Badge label={u.role || 'visitor'} tone={ROLE_TONES[u.role] || 'neutral'} style={{ alignSelf: 'flex-end' }} />
                    {u.disabled ? <Badge label="Disabled" tone="danger" style={{ alignSelf: 'flex-end' }} /> : null}
                </View>
            </Row>

            <View style={{ gap: 3 }}>
                <Row gap={6}>
                    <Phone size={12} color={colors.textDim} />
                    <Mono size="sm" tone="soft" weight="600">{u.phone || '—'}</Mono>
                </Row>
                {showEmail ? (
                    <Row gap={6}>
                        <Mail size={12} color={colors.textDim} />
                        <AppText size="xs" tone="muted" numberOfLines={1} style={{ flex: 1 }}>{u.email}</AppText>
                    </Row>
                ) : null}
            </View>

            <Row wrap gap={8}>
                <Badge label={u.playingPosition || 'MID'} tone="neutral" />
                <Mono size="xs" tone="muted" weight="600">{`${stats.bookings} bookings · ${stats.tournaments} cups`}</Mono>
                <AppText size="xs" tone="dim">{`Joined ${joined}`}</AppText>
            </Row>

            <Row gap={8} style={{ marginTop: 2 }}>
                <Button title="View / Edit" icon={Pencil} variant="outline" size="sm" onPress={() => onEdit(u)} style={{ flex: 1 }} />
                <Button
                    title={u.disabled ? 'Re-enable' : 'Disable'}
                    icon={u.disabled ? CheckCircle2 : Ban}
                    variant={u.disabled ? 'secondary' : 'danger'}
                    size="sm"
                    loading={busy}
                    onPress={() => onToggleDisabled(u)}
                    style={{ flex: 1 }}
                />
            </Row>
        </Card>
    );
}

const styles = StyleSheet.create({
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: tones.success.bg, borderWidth: 1, borderColor: tones.success.border, alignItems: 'center', justifyContent: 'center' }
});
