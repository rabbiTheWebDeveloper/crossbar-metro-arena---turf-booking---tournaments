import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Link2, UserMinus, UserCheck, Trash2 } from 'lucide-react-native';
import { AppText, Badge, Button, Card, IconButton, Row } from '@/components/ui';
import { colors, spacing, tones } from '@/theme';
import { formatMoney } from '@/data/finance';

/**
 * One partner in the admin investors list: identity, linked login, this month's share / paid /
 * owed, lifetime payouts and the row actions.
 *   share: the partner's entry of finance.investorShares for the selected month (undefined when inactive)
 *   loginLabel: "Name (phone)" of the linked user account, '' when unknown
 *   busy: an update for this partner is in flight (actions disabled)
 */
export function InvestorCard({ investor, share, lifetimePaid = 0, loginLabel = '', busy, onEditShare, onLink, onToggleStatus, onDelete, onPayout }) {
    const isActive = (investor.status || 'active') === 'active';
    const initial = String(investor.name || 'P').charAt(0).toUpperCase();
    const identity = `${investor.sharePercentage}% · invested ${formatMoney(investor.capitalInvested)}${investor.phone ? ` · ${investor.phone}` : ''}`;
    const login = investor.userId ? `Login: ${loginLabel || investor.userId}` : 'No login account linked';

    let settlement = null;
    if (share && share.balance > 0) settlement = <AppText size="xs" mono tone="warning">{` · owed ${formatMoney(share.balance)}`}</AppText>;
    else if (share && share.isPaid) settlement = <AppText size="xs" mono tone="brand">{' · settled'}</AppText>;

    return (
        <Card style={isActive ? null : { opacity: 0.75 }}>
            <Row align="flex-start" gap={spacing.md}>
                <View style={[styles.avatar, isActive ? null : { backgroundColor: colors.glassStrong }]}>
                    <AppText size="md" mono weight="900" style={{ color: isActive ? colors.onBrand : colors.textSoft }}>{initial}</AppText>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <Row gap={6} wrap>
                        <AppText size="md" weight="800" style={{ flexShrink: 1 }} numberOfLines={1}>{investor.name}</AppText>
                        {isActive ? null : <Badge label="inactive" tone="neutral" />}
                    </Row>
                    <AppText size="xs" mono tone="muted">{identity}</AppText>
                    <AppText size="xs" mono tone="dim" numberOfLines={1}>{login}</AppText>
                </View>
            </Row>

            <View style={styles.figures}>
                <AppText size="md" mono weight="800">
                    {formatMoney(share ? share.shareAmount : 0)}
                    <AppText size="xs" tone="dim">{' share'}</AppText>
                </AppText>
                <AppText size="xs" mono tone="muted">
                    {`paid ${formatMoney(share ? share.paidAmount : 0)} this month`}
                    {settlement}
                </AppText>
                <AppText size="xs" mono tone="dim">{`lifetime ${formatMoney(lifetimePaid)}`}</AppText>
            </View>

            <Row gap={8} wrap>
                <Button title="Edit %" size="sm" variant="secondary" upper={false} disabled={busy} onPress={onEditShare} />
                <IconButton icon={Link2} size={34} iconSize={15} disabled={busy} onPress={onLink} accessibilityLabel="Link login account" />
                <IconButton
                    icon={isActive ? UserMinus : UserCheck}
                    size={34}
                    iconSize={15}
                    tone={isActive ? colors.textSoft : colors.brand}
                    disabled={busy}
                    onPress={onToggleStatus}
                    accessibilityLabel={isActive ? 'Deactivate partner' : 'Reactivate partner'}
                />
                <IconButton icon={Trash2} size={34} iconSize={15} tone={tones.danger.fg} disabled={busy} onPress={onDelete} accessibilityLabel="Delete partner" />
                <View style={{ flex: 1 }} />
                <Button title="Payout" size="sm" variant="outline" upper={false} disabled={busy || !isActive} onPress={onPayout} />
            </Row>
        </Card>
    );
}

const styles = StyleSheet.create({
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    figures: { gap: 1, marginVertical: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border }
});
