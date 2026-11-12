import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, Clock, Shield, Swords, X } from 'lucide-react-native';
import { Card, Row, AppText, Heading, Mono, Badge, Button, Divider } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';

/**
 * An open squad challenge on the public board.
 *   own: the signed-in user posted it (shows "Close my challenge" instead of "Accept")
 *   busy: an accept / close request for this card is running
 */
export function ChallengeCard({ challenge, own, busy, onAccept, onClose }) {
    const c = challenge || {};
    return (
        <Card>
            <Row justify="space-between">
                <Badge tone="warning" label={c.lookingFor || 'Opponent Team'} />
                <AppText size="xs" tone="muted">{`${c.level || 'Casual'} level`}</AppText>
            </Row>

            <Heading level={3} upper style={{ marginTop: 8 }}>{c.teamName || 'Squad'}</Heading>
            <Row gap={5} style={{ marginTop: 2 }}>
                <Shield size={13} color={colors.brand} />
                <AppText size="xs" tone="brand" weight="700" style={{ flex: 1 }}>{c.format || ''}</AppText>
                {own ? <Badge tone="brand" label="Your challenge" /> : null}
            </Row>

            <View style={styles.info}>
                <Row gap={8}>
                    <Calendar size={13} color={colors.textMuted} />
                    <AppText size="xs" tone="soft">{formatIsoDate(c.date)}</AppText>
                </Row>
                <Row gap={8}>
                    <Clock size={13} color={colors.textMuted} />
                    <Mono size="xs" weight="600">{c.timeSlot || ''}</Mono>
                </Row>
                <View style={styles.infoSplit} />
                <Row gap={8}>
                    <AppText size="xs" tone="muted">Turf fee:</AppText>
                    <AppText size="xs" tone="brand" weight="800">{c.costShare || ''}</AppText>
                </Row>
                <Row gap={8}>
                    <AppText size="xs" tone="muted">Captain:</AppText>
                    <AppText size="xs" style={{ flex: 1 }} numberOfLines={1}>{c.captainName || ''}</AppText>
                    {c.captainPhone ? <Mono size="xs" tone="muted" weight="500">{c.captainPhone}</Mono> : null}
                </Row>
            </View>

            {c.notes ? <AppText size="xs" tone="muted" italic>{`"${c.notes}"`}</AppText> : null}

            <Divider style={{ marginVertical: 10 }} />
            {own ? (
                <Button title={busy ? 'Closing...' : 'Close my challenge'} icon={X} variant="secondary" size="sm" block loading={busy} onPress={onClose} upper={false} />
            ) : (
                <>
                    <Button title={busy ? 'Accepting...' : 'Accept challenge'} icon={Swords} size="sm" block loading={busy} onPress={onAccept} upper={false} />
                    <AppText size="xxs" tone="dim" center style={{ marginTop: 6 }}>
                        Accepting shares your name and number with the poster and reveals theirs to you.
                    </AppText>
                </>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    info: { gap: 6, marginVertical: spacing.sm + 2, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    infoSplit: { height: 1, backgroundColor: colors.border }
});
