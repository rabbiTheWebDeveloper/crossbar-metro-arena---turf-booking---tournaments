import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { AppText, Badge, Card, Label, Row, Stack } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatMoney } from '@/data/finance';
import { CardHeader } from '@/features/investor/CardHeader';
import { trimNumber } from './helpers';

function Figure({ label, value, tone = 'default' }) {
    return (
        <View style={{ flex: 1, gap: 1 }}>
            <Label>{label}</Label>
            <AppText size="sm" mono weight="700" tone={tone} numberOfLines={1} adjustsFontSizeToFit>{value}</AppText>
        </View>
    );
}

function ShareStatus({ item }) {
    if (item.shareAmount === 0) return <Badge label="no share" tone="neutral" />;
    return item.isPaid ? <Badge label="paid" tone="success" /> : <Badge label="owed" tone="warning" />;
}

/**
 * How the month's net profit is split: one block per active partner (share, paid, balance, status)
 * plus the part retained by the owners.
 *   report: result of calculateMonthlyFinance()
 */
export function ProfitDistributionCard({ report }) {
    const router = useRouter();
    const shares = report.investorShares || [];
    const retainedPct = Math.max(0, 100 - shares.reduce((sum, i) => sum + i.percentage, 0));

    return (
        <Card>
            <Stack gap={12}>
                <CardHeader
                    title="Profit distribution"
                    right={(
                        <Pressable onPress={() => router.navigate('/admin/investors')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }} accessibilityRole="link">
                            <AppText size="xs" tone="brand" weight="800">Manage investors</AppText>
                            <ChevronRight size={14} color={colors.brand} />
                        </Pressable>
                    )}
                />

                {shares.length === 0 ? <AppText size="sm" tone="dim">No active partners.</AppText> : null}

                {shares.map(item => (
                    <View key={item.investor.id} style={styles.block}>
                        <Row justify="space-between" gap={spacing.sm}>
                            <AppText size="sm" weight="800" style={{ flex: 1 }} numberOfLines={1}>{item.investor.name}</AppText>
                            <AppText size="xs" mono tone="muted">{`${trimNumber(item.percentage)}%`}</AppText>
                            <ShareStatus item={item} />
                        </Row>
                        <Row align="flex-start" gap={spacing.sm}>
                            <Figure label="Amount" value={formatMoney(item.shareAmount)} />
                            <Figure label="Paid" value={formatMoney(item.paidAmount)} tone="brand" />
                            <Figure label="Balance" value={formatMoney(item.balance)} tone={item.balance > 0 ? 'warning' : 'muted'} />
                        </Row>
                    </View>
                ))}

                <Row justify="space-between" gap={spacing.sm} style={styles.retained}>
                    <AppText size="sm" weight="800" style={{ flex: 1 }}>Owners / retained</AppText>
                    <AppText size="xs" mono weight="700">{`${trimNumber(retainedPct)}%`}</AppText>
                    <AppText size="sm" mono weight="900" tone={report.ownersShare < 0 ? 'danger' : 'brand'}>{formatMoney(report.ownersShare)}</AppText>
                </Row>

                <AppText size="xs" tone="warning">
                    {report.isLossMonth
                        ? 'This month shows a loss or breakeven so far, so there is no net dividend to distribute.'
                        : 'Net dividends are split according to each active partner\'s equity percentage; the remainder is retained by the owners.'}
                </AppText>
            </Stack>
        </Card>
    );
}

const styles = StyleSheet.create({
    block: { gap: 8, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input },
    retained: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }
});
