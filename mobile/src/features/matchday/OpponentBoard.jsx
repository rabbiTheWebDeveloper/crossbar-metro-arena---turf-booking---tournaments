import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MessageCircle, Swords, Calendar, Clock, Wallet } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, GradientCard, Row, AppText, Heading, Badge, Button, EmptyState, Divider } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';
import { isFullPhone, whatsappLink, openLink } from './matchdayUtils';

function Line({ icon: Icon, label, value, tone = 'default' }) {
    return (
        <Row gap={6}>
            <Icon size={13} color={colors.textMuted} />
            <AppText size="xs" tone="muted">{label}</AppText>
            <AppText size="xs" tone={tone} weight="800" style={{ flex: 1 }}>{value}</AppText>
        </Row>
    );
}

/**
 * "Find an Opponent" tab of the Match Day screen: the open challenges with a way to reach the
 * squad. Public listings mask the captain's number, so the WhatsApp shortcut only appears when
 * the full number is available; otherwise the card links to the challenge board where accepting
 * a challenge reveals the contact details.
 *   onOpenBoard(): go to the challenge board (/matches)
 */
export function OpponentBoard({ challenges, onOpenBoard }) {
    const { showNotice } = useArena();
    const list = challenges || [];

    const whatsapp = (c) => {
        const text = `Hi Captain ${c.captainName || ''}, we want to play against ${c.teamName || 'your squad'} at Crossbar Metro Arena!`;
        openLink(whatsappLink(c.captainPhone, text), () => showNotice('error', 'Could not open WhatsApp on this device.'));
    };

    return (
        <View style={{ gap: spacing.md }}>
            <GradientCard>
                <Heading level={3} upper>Looking for a Football Match at Crossbar Arena?</Heading>
                <AppText size="sm" tone="soft" style={{ marginTop: 4, marginBottom: spacing.md }}>
                    Connect with squads looking for competitive friendly matches, 50/50 turf slot cost share, or guest players.
                </AppText>
                <Button title="Post Your Challenge" icon={Swords} onPress={onOpenBoard} style={{ alignSelf: 'flex-start' }} />
            </GradientCard>

            {list.length === 0 ? (
                <EmptyState
                    icon={Swords}
                    title="No Active Challenges Open Right Now"
                    message="Post a squad challenge to find an opponent team or invite guest players to your game."
                    action={<Button title="Post a Match Challenge" size="sm" onPress={onOpenBoard} />}
                />
            ) : list.map(c => (
                <Card key={c.id}>
                    <Row justify="space-between">
                        <Badge tone="brand" label={c.lookingFor || 'Opponent Team'} />
                        <AppText size="xs" tone="muted" weight="800">{c.level || ''}</AppText>
                    </Row>
                    <Heading level={3} style={{ marginTop: 8 }}>{c.teamName || 'Squad'}</Heading>
                    <View style={{ gap: 4, marginTop: 6 }}>
                        <Line icon={Calendar} label="Date:" value={formatIsoDate(c.date)} />
                        <Line icon={Clock} label="Slot:" value={c.timeSlot || ''} tone="brand" />
                        <Line icon={Wallet} label="Cost:" value={c.costShare || ''} />
                    </View>
                    {c.notes ? (
                        <View style={styles.notes}>
                            <AppText size="xs" tone="soft" italic>{`"${c.notes}"`}</AppText>
                        </View>
                    ) : null}
                    <Divider style={{ marginVertical: 10 }} />
                    <Row justify="space-between">
                        <View style={{ flex: 1 }}>
                            <AppText size="xxs" tone="muted">Captain:</AppText>
                            <AppText size="sm" weight="800" numberOfLines={1}>{c.captainName || ''}</AppText>
                        </View>
                        {isFullPhone(c.captainPhone) ? (
                            <Button title="WhatsApp Squad" icon={MessageCircle} variant="outline" size="sm" upper={false} onPress={() => whatsapp(c)} />
                        ) : (
                            <Button title="View & Accept" icon={Swords} variant="outline" size="sm" upper={false} onPress={onOpenBoard} />
                        )}
                    </Row>
                </Card>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    notes: { marginTop: spacing.sm, padding: spacing.sm + 2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass }
});
