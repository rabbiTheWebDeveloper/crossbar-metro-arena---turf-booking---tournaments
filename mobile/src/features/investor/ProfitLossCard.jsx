import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatMoney } from '@/data/finance';
import { CardHeader } from './CardHeader';

function Line({ label, value, bold, valueTone = 'default', size = 'sm', top }) {
    return (
        <View style={[styles.line, top ? styles.lineTop : null]}>
            <AppText size={size} tone={bold ? 'default' : 'soft'} weight={bold ? '800' : '500'} style={{ flex: 1 }}>{label}</AppText>
            <AppText size={size} mono tone={valueTone} weight={bold ? '900' : '600'}>{value}</AppText>
        </View>
    );
}

/**
 * Month profit & loss statement for a partner: income lines, expenses, net profit and the
 * partner's share of it.
 *   finance: result of calculateMonthlyFinance()      percent / shareAmount: the partner's cut
 */
export function ProfitLossCard({ finance, percent, shareAmount }) {
    const otherSources = (finance.incomeBySource || []).filter(s => s.key !== 'bookings');
    return (
        <Card>
            <CardHeader title="Profit & loss" style={{ marginBottom: spacing.sm }} />
            <Line label="Booking money collected" value={formatMoney(finance.bookingMoneyCollected)} />
            {otherSources.map(src => (
                <Line key={src.key} label={src.source} value={formatMoney(src.amount)} top />
            ))}
            <Line label="Total revenue" value={formatMoney(finance.totalRevenue)} bold top />
            <Line label="Less expenses" value={`-${formatMoney(finance.totalExpenses)}`} valueTone="danger" top />
            <Line label="Net profit" value={formatMoney(finance.netProfit)} valueTone={finance.isLossMonth ? 'danger' : 'default'} bold size="md" top />
            <View style={styles.share}>
                <AppText size="md" tone="brand" weight="900" style={{ flex: 1 }}>{`Your share (${percent}%)`}</AppText>
                <AppText size="lg" mono tone="brand" weight="900">{formatMoney(shareAmount)}</AppText>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: 9 },
    lineTop: { borderTopWidth: 1, borderTopColor: colors.border },
    share: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingTop: spacing.md, marginTop: 2, borderTopWidth: 1, borderTopColor: colors.borderBrand }
});
