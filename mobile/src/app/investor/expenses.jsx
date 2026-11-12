import React, { useMemo } from 'react';
import { View } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AppText, Button, Card, HBar, Loading, MonthSwitcher, Stack } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatMoney, formatDate, expenseCategoryLabel } from '@/data/finance';
import { InvestorScreen } from '@/features/investor/InvestorScreen';
import { useMonthWindow, usePagedList } from '@/features/investor/hooks';
import { CardHeader } from '@/features/investor/CardHeader';

/** One voucher line: title, date · category, optional receipt note and the amount. */
function VoucherRow({ item, first }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 11, borderTopWidth: first ? 0 : 1, borderTopColor: colors.border }}>
            <View style={{ flex: 1 }}>
                <AppText size="sm" weight="800" numberOfLines={2}>{item.title}</AppText>
                <AppText size="xs" tone="muted" numberOfLines={1}>{`${item.date} · ${item.category}`}</AppText>
                {item.receiptNote ? <AppText size="xs" mono tone="dim" numberOfLines={1}>{`Receipt: ${item.receiptNote}`}</AppText> : null}
            </View>
            <AppText size="sm" mono weight="800">{formatMoney(item.amount)}</AppText>
        </View>
    );
}

/** Investor portal · Expenses: the month's spending by category and every recorded voucher. */
export default function InvestorExpensesScreen() {
    const { calculateMonthlyFinance, expenses, isLoadingData } = useArena();
    const { selectedMonth, setSelectedMonth, monthLabel, minMonth, maxMonth } = useMonthWindow(7);

    const finance = useMemo(() => calculateMonthlyFinance(selectedMonth), [calculateMonthlyFinance, selectedMonth]);

    const expensesByCategory = useMemo(() => (finance.expensesByCategory || [])
        .map(cat => ({ key: cat.category, name: expenseCategoryLabel(cat.category), amount: cat.amount }))
        .sort((a, b) => b.amount - a.amount), [finance.expensesByCategory]);
    const maxCategory = Math.max(1, ...expensesByCategory.map(c => c.amount));

    const itemizedExpenses = useMemo(() => (expenses || [])
        .filter(e => e.date && String(e.date).startsWith(selectedMonth))
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .map(e => ({
            id: e.id,
            category: expenseCategoryLabel(e.category),
            date: formatDate(e.date),
            title: e.title,
            receiptNote: e.receiptNote || '',
            amount: Number(e.amount) || 0
        })), [expenses, selectedMonth]);

    const { shown, hasMore, remaining, showMore } = usePagedList(itemizedExpenses, selectedMonth);
    const entryCount = itemizedExpenses.length;
    const showSkeleton = isLoadingData && expenses.length === 0;

    return (
        <InvestorScreen title="Expenses">
            <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} minMonth={minMonth} maxMonth={maxMonth} />

            <Card>
                <Stack gap={12}>
                    <CardHeader title="By category" divider right={<AppText size="sm" mono weight="900" tone="danger">{formatMoney(finance.totalExpenses)}</AppText>} />
                    {showSkeleton ? <Loading style={{ padding: spacing.lg }} /> : null}
                    {!showSkeleton && expensesByCategory.length === 0 ? (
                        <AppText size="xs" mono tone="dim" center style={{ paddingVertical: spacing.lg }}>{`No recorded expenses for ${monthLabel}`}</AppText>
                    ) : null}
                    {!showSkeleton && expensesByCategory.length > 0 ? (
                        <View style={{ gap: 12 }}>
                            {expensesByCategory.map(cat => (
                                <HBar key={cat.key} label={cat.name} value={cat.amount} max={maxCategory} display={formatMoney(cat.amount)} />
                            ))}
                        </View>
                    ) : null}
                </Stack>
            </Card>

            <Card>
                <CardHeader
                    title="Itemized vouchers & receipts"
                    icon={FileText}
                    divider
                    right={<AppText size="xs" mono tone="muted">{`${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`}</AppText>}
                />
                {showSkeleton ? <Loading style={{ padding: spacing.lg }} /> : null}
                {!showSkeleton && entryCount === 0 ? (
                    <AppText size="xs" mono tone="dim" center style={{ paddingVertical: spacing.xl }}>{`No itemized vouchers recorded for ${monthLabel}`}</AppText>
                ) : null}
                {!showSkeleton ? shown.map((item, index) => <VoucherRow key={item.id} item={item} first={index === 0} />) : null}
                {!showSkeleton && hasMore ? <Button title={`Show more (${remaining})`} variant="secondary" size="sm" onPress={showMore} style={{ marginTop: spacing.sm }} /> : null}
            </Card>
        </InvestorScreen>
    );
}
