import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AppText, Button, Card, IconButton, Stack, confirm } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatMoney, formatDate, formatMonth, expenseCategoryLabel } from '@/data/finance';
import { CardHeader } from '@/features/investor/CardHeader';
import { usePagedList } from '@/features/investor/hooks';

/**
 * Every expense voucher of the selected month (or of all time with "Show all"), newest first,
 * with a delete action per entry.
 */
export function ExpenseEntriesCard({ month }) {
    const { expenses, handleDeleteExpense } = useArena();
    const [showAll, setShowAll] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const entries = useMemo(() => {
        const list = showAll ? expenses : expenses.filter(e => String(e.date || '').startsWith(month));
        return [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    }, [expenses, month, showAll]);

    const { shown, hasMore, remaining, showMore } = usePagedList(entries, `${month}:${showAll ? 'all' : 'month'}`);

    const handleDelete = async (expense) => {
        const ok = await confirm('Delete expense?', `Delete "${expense.title}" (${formatMoney(expense.amount)})?`, { confirmText: 'Delete', destructive: true });
        if (!ok) return;
        setDeletingId(expense.id);
        await handleDeleteExpense(expense.id);
        setDeletingId(null);
    };

    return (
        <Card>
            <Stack gap={12}>
                <CardHeader
                    title="Expense entries"
                    right={(
                        <Pressable onPress={() => setShowAll(v => !v)} hitSlop={8} accessibilityRole="button">
                            <AppText size="xs" tone="brand" weight="800">{showAll ? `Only ${formatMonth(month, { month: 'short' })}` : 'Show all'}</AppText>
                        </Pressable>
                    )}
                />

                {entries.length === 0 ? (
                    <AppText size="sm" tone="dim">{showAll ? 'No expenses recorded yet.' : `No expenses recorded for ${formatMonth(month)}.`}</AppText>
                ) : null}

                {shown.map(e => (
                    <View key={e.id} style={styles.entry}>
                        <View style={{ flex: 1 }}>
                            <AppText size="sm" weight="800" numberOfLines={2}>{e.title}</AppText>
                            <AppText size="xs" mono tone="dim" numberOfLines={2}>
                                {`${formatDate(e.date, { year: true })} · ${expenseCategoryLabel(e.category)}${e.receiptNote ? ` · ${e.receiptNote}` : ''}`}
                            </AppText>
                        </View>
                        <AppText size="sm" mono weight="800">{formatMoney(e.amount)}</AppText>
                        <IconButton
                            icon={X}
                            size={30}
                            iconSize={14}
                            tone={colors.textMuted}
                            disabled={deletingId === e.id}
                            onPress={() => handleDelete(e)}
                            accessibilityLabel={`Delete ${e.title}`}
                        />
                    </View>
                ))}

                {hasMore ? <Button title={`Show more (${remaining})`} variant="secondary" size="sm" onPress={showMore} /> : null}
            </Stack>
        </Card>
    );
}

const styles = StyleSheet.create({
    entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input }
});
