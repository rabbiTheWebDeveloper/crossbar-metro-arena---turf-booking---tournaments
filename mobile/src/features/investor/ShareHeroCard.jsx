import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GradientCard, AppText, Label } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatMoney } from '@/data/finance';

function HeroStat({ label, value, tone = 'default' }) {
    return (
        <View style={styles.stat}>
            <Label numberOfLines={1}>{label}</Label>
            <AppText size="md" weight="900" mono tone={tone} numberOfLines={1} adjustsFontSizeToFit>{value}</AppText>
        </View>
    );
}

/**
 * Hero block of the investor overview: the partner's share of the selected month, how it was
 * derived, and the paid / owed / lifetime / invested figures.
 */
export function ShareHeroCard({ monthLabel, shareAmount, percent, netProfit, isInactive, isLossMonth, paidThisMonth, balanceThisMonth, receivedToDate, capitalInvested }) {
    let note = <AppText size="xs" mono tone="soft">{`${percent}% of net profit ${formatMoney(netProfit)}`}</AppText>;
    if (isInactive) note = <AppText size="xs" mono weight="700" tone="warning">Partner account inactive · no share allocated</AppText>;
    else if (isLossMonth) note = <AppText size="xs" mono weight="700" tone="danger">Loss protection active · ৳0 payout</AppText>;

    return (
        <GradientCard>
            <Label tone="brand">{`Your share · ${monthLabel}`}</Label>
            <AppText size="hero" weight="900" mono tone="brand" numberOfLines={1} adjustsFontSizeToFit style={{ lineHeight: 46, marginTop: 2 }}>
                {formatMoney(shareAmount)}
            </AppText>
            {note}
            <View style={styles.grid}>
                <HeroStat label="Paid for this month" value={formatMoney(paidThisMonth)} />
                <HeroStat label="Still owed" value={formatMoney(balanceThisMonth)} tone={balanceThisMonth > 0 ? 'warning' : 'default'} />
                <HeroStat label="Received to date" value={formatMoney(receivedToDate)} />
                <HeroStat label="Invested" value={formatMoney(capitalInvested)} />
            </View>
        </GradientCard>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md, columnGap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderBrand },
    stat: { flexBasis: '47%', flexGrow: 1, gap: 2 }
});
