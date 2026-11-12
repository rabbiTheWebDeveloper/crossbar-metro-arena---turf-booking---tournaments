import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Card, Stack } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatMoney, formatDate, formatMonth } from '@/data/finance';
import { CardHeader } from '@/features/investor/CardHeader';

function HeadCell({ label, first }) {
    return <AppText size="xxs" weight="800" tone="dim" upper numberOfLines={1} style={first ? styles.dateCell : styles.numCell}>{label}</AppText>;
}

function NumCell({ value, tone, bold }) {
    return <AppText size="xs" mono tone={tone} weight={bold ? '800' : '500'} numberOfLines={1} adjustsFontSizeToFit style={styles.numCell}>{value}</AppText>;
}

/**
 * Day-by-day table of the month: bookings played, booking cash collected, expenses and the net,
 * with a month total. Days without any activity are dimmed.
 *   report: result of calculateMonthlyFinance()
 */
export function DailyBreakdownCard({ report, month }) {
    const days = report.dailyBreakdown || [];
    const collectedTotal = days.reduce((sum, d) => sum + d.moneyCollected, 0);

    return (
        <Card>
            <Stack gap={10}>
                <CardHeader title={`Daily breakdown · ${formatMonth(month)}`} />

                <View>
                    <View style={[styles.row, styles.headRow]}>
                        <HeadCell first label="Date" />
                        <HeadCell label="Collected" />
                        <HeadCell label="Expenses" />
                        <HeadCell label="Net" />
                    </View>

                    {days.map(day => {
                        const idle = day.slotsBooked === 0 && day.moneyCollected === 0 && day.expenses === 0;
                        return (
                            <View key={day.date} style={[styles.row, idle ? { opacity: 0.45 } : null]}>
                                <View style={styles.dateCell}>
                                    <AppText size="xs" weight="700" tone="soft" numberOfLines={1}>{formatDate(day.date, { weekday: 'short' })}</AppText>
                                    <AppText size="xxs" tone="dim" numberOfLines={1}>{`${day.slotsBooked} booking${day.slotsBooked === 1 ? '' : 's'}`}</AppText>
                                </View>
                                <NumCell value={formatMoney(day.moneyCollected)} tone="brand" />
                                <NumCell value={formatMoney(day.expenses)} tone="muted" />
                                <NumCell value={formatMoney(day.net)} tone={day.net < 0 ? 'danger' : 'brand'} bold />
                            </View>
                        );
                    })}

                    <View style={[styles.row, styles.footRow]}>
                        <View style={styles.dateCell}>
                            <AppText size="xs" weight="900">Month total</AppText>
                            <AppText size="xxs" tone="muted" numberOfLines={1}>{`${report.slotsBooked} booking${report.slotsBooked === 1 ? '' : 's'}`}</AppText>
                        </View>
                        <NumCell value={formatMoney(collectedTotal)} tone="brand" bold />
                        <NumCell value={formatMoney(report.totalExpenses)} bold />
                        <NumCell value={formatMoney(report.netProfit)} tone={report.netProfit < 0 ? 'danger' : 'brand'} bold />
                    </View>
                </View>

                <AppText size="xs" tone="dim">
                    Collected shows booking cash by the day it was paid (before refunds); month net also includes other income and completed refunds.
                </AppText>
            </Stack>
        </Card>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
    headRow: { paddingTop: 0, paddingBottom: spacing.sm },
    footRow: { borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: colors.borderStrong, paddingTop: spacing.md },
    dateCell: { flex: 1.3 },
    numCell: { flex: 1, textAlign: 'right' }
});
