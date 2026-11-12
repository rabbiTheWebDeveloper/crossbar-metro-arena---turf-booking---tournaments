import React from 'react';
import { View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { AppText, Button, Card, HBar, Stack } from '@/components/ui';
import { formatMoney, formatMonth, expenseCategoryLabel } from '@/data/finance';
import { CardHeader } from '@/features/investor/CardHeader';

/** Month expenses grouped by category (largest first), with the "Add expense" action. */
export function ExpensesByCategoryCard({ report, month, onAdd }) {
    const categories = [...(report.expensesByCategory || [])].sort((a, b) => b.amount - a.amount);
    return (
        <Card>
            <Stack gap={14}>
                <CardHeader title="Expenses by category" right={<Button title="Add expense" icon={Plus} size="sm" upper={false} onPress={onAdd} />} />
                {categories.length > 0 ? (
                    <View style={{ gap: 12 }}>
                        {categories.map(cat => (
                            <HBar key={cat.category} label={expenseCategoryLabel(cat.category)} value={cat.amount} max={report.totalExpenses} display={formatMoney(cat.amount)} />
                        ))}
                    </View>
                ) : (
                    <AppText size="sm" tone="dim">{`No expenses logged for ${formatMonth(month)}.`}</AppText>
                )}
            </Stack>
        </Card>
    );
}

/** Month revenue split by source (bookings, shop, events, other), with the "Add income" action. */
export function IncomeSourcesCard({ report, month, onAdd }) {
    const sources = report.incomeBySource || [];
    return (
        <Card>
            <Stack gap={14}>
                <CardHeader title="Income sources" right={<Button title="Add income" icon={Plus} size="sm" variant="secondary" upper={false} onPress={onAdd} />} />
                {report.totalRevenue > 0 ? (
                    <View style={{ gap: 12 }}>
                        {sources.map(source => (
                            <HBar
                                key={source.key}
                                label={source.source}
                                value={source.amount}
                                max={report.totalRevenue}
                                display={`${formatMoney(source.amount)} (${(Number(source.percentage) || 0).toFixed(0)}%)`}
                            />
                        ))}
                    </View>
                ) : (
                    <AppText size="sm" tone="dim">{`No revenue logged yet for ${formatMonth(month)}.`}</AppText>
                )}
            </Stack>
        </Card>
    );
}
