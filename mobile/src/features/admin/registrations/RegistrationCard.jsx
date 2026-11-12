import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Pencil, Users, Phone, Mail, Shirt, CreditCard } from 'lucide-react-native';
import { Card, Row, AppText, Badge, Button } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { isConfirmed, playersOf } from './helpers';

/** Icon + one line of detail. `text` is plain copy; `children` are extra nested <AppText> runs. */
function InfoLine({ icon: Icon, text, children }) {
    return (
        <Row gap={6} align="flex-start">
            <Icon size={13} color={colors.textDim} style={{ marginTop: 3 }} />
            <AppText size="sm" tone="muted" style={{ flex: 1 }}>{text}{children}</AppText>
        </Row>
    );
}

/**
 * One tournament registration: squad, captain contact, jersey and entry-fee payment.
 *   busy: a status change for this card is in flight
 */
export function RegistrationCard({ registration: reg, busy, onEdit, onSetStatus }) {
    const confirmed = isConfirmed(reg);
    const rejected = reg.status === 'rejected';
    const squad = playersOf(reg);
    const tone = confirmed ? 'success' : (rejected ? 'danger' : 'warning');

    return (
        <Card tone={tone} style={[{ gap: spacing.md }, rejected ? { opacity: 0.7 } : null]}>
            <Row justify="space-between" align="flex-start">
                <View style={{ flex: 1 }}>
                    <AppText size="md" weight="800" numberOfLines={1}>{reg.teamName}</AppText>
                    <AppText size="sm" tone="brand" weight="700" numberOfLines={1}>{reg.tournamentTitle}</AppText>
                </View>
                <Badge tone={tone} label={confirmed ? 'confirmed' : String(reg.status || 'pending')} />
            </Row>

            <View style={{ gap: 4 }}>
                <InfoLine icon={Phone}>
                    <AppText size="sm" weight="700">{reg.captainName}</AppText>
                    <AppText size="sm" tone="muted" mono>{` · ${reg.captainPhone || ''}`}</AppText>
                </InfoLine>
                {reg.captainEmail ? <InfoLine icon={Mail} text={String(reg.captainEmail)} /> : null}
                <InfoLine icon={Users} text={`${squad.length || reg.playerCount || 0} players`} />
                {reg.jerseyColor ? <InfoLine icon={Shirt} text={String(reg.jerseyColor)} /> : null}
                <InfoLine icon={CreditCard} text={`${formatMoney(reg.amount)} · ${String(reg.paymentMethod || '').replace('_', ' ')}`}>
                    {reg.transactionId ? <AppText size="sm" tone="dim" mono>{` · Trx ${reg.transactionId}`}</AppText> : null}
                </InfoLine>

                {squad.length > 0 ? (
                    <Row wrap gap={4} style={{ paddingTop: 4 }}>
                        {squad.slice(0, 8).map((p, i) => (
                            <View key={`${p}-${i}`} style={styles.player}>
                                <AppText size="xs" tone="soft">{p}</AppText>
                            </View>
                        ))}
                        {squad.length > 8 ? <AppText size="xs" tone="dim" style={{ paddingVertical: 2, paddingHorizontal: 4 }}>{`+${squad.length - 8} more`}</AppText> : null}
                    </Row>
                ) : null}
                {reg.notes ? <AppText size="xs" tone="dim" italic>{`“${reg.notes}”`}</AppText> : null}
            </View>

            <Row gap={6} style={styles.actions}>
                <Button title="View / Edit" icon={Pencil} variant="secondary" size="sm" onPress={onEdit} />
                {!confirmed && !rejected ? (
                    <>
                        <Button title="Approve" size="sm" loading={busy} onPress={() => onSetStatus('confirmed')} style={{ flex: 1 }} />
                        <Button title="Reject" variant="danger" size="sm" disabled={busy} onPress={() => onSetStatus('rejected')} />
                    </>
                ) : (
                    <>
                        <View style={{ flex: 1 }} />
                        <Button title="Back to pending" variant="secondary" size="sm" loading={busy} onPress={() => onSetStatus('pending')} />
                    </>
                )}
            </Row>
        </Card>
    );
}

const styles = StyleSheet.create({
    player: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: radius.sm, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
    actions: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }
});
