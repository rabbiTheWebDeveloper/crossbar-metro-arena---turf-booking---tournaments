import React, { useMemo } from 'react';
import { View } from 'react-native';
import { CreditCard, CheckCircle2 } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { useInvestor } from '@/context/InvestorContext';
import { AppText, Badge, Button, Card, EmptyState, Label, Loading, Row } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatMoney, formatDate, formatMonth, paymentMethodLabel } from '@/data/finance';
import { InvestorScreen } from '@/features/investor/InvestorScreen';
import { usePagedList } from '@/features/investor/hooks';

/** One recorded dividend payout. */
function PayoutRow({ payout, first }) {
    const paidLine = `${payout.datePaid ? `Paid ${formatDate(payout.datePaid)}` : 'Processed'}${payout.transactionNote ? ` · ${payout.transactionNote}` : ''}`;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, borderTopWidth: first ? 0 : 1, borderTopColor: colors.border }}>
            <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} color={colors.brand} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
                <Row gap={6} wrap>
                    <AppText size="sm" weight="800">{payout.month ? formatMonth(payout.month) : 'Dividend payout'}</AppText>
                    {payout.paymentMethod ? <Badge label={paymentMethodLabel(payout.paymentMethod)} /> : null}
                </Row>
                <AppText size="xs" tone="muted" numberOfLines={2}>{paidLine}</AppText>
            </View>
            <AppText size="sm" mono weight="800" tone="brand">{formatMoney(payout.amount)}</AppText>
        </View>
    );
}

/** Investor portal · Payouts: the partner's dividend ledger and lifetime total. */
export default function InvestorPayoutsScreen() {
    const { payouts, isLoadingData } = useArena();
    const { activeInvestor } = useInvestor();
    const activeId = activeInvestor?.id || null;

    // `payouts` already holds only the caller's own records for investors (admins see all),
    // so a strict investorId match is all that is needed.
    const myPayouts = useMemo(() => {
        if (!activeId) return [];
        return (payouts || [])
            .filter(p => p.investorId === activeId)
            .sort((a, b) => String(b.datePaid || b.createdAt || '').localeCompare(String(a.datePaid || a.createdAt || '')));
    }, [payouts, activeId]);

    const totalReceived = useMemo(() => myPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [myPayouts]);
    const { shown, hasMore, remaining, showMore } = usePagedList(myPayouts, activeId);
    const capitalInvested = Number(activeInvestor?.capitalInvested) || 0;

    return (
        <InvestorScreen title="My payouts">
            {activeInvestor ? (
                <Row justify="space-between" align="flex-start" gap={spacing.md}>
                    <View style={{ flex: 1 }}>
                        <AppText size="sm" weight="800" upper>{`${activeInvestor.name} · Payout History`}</AppText>
                        <AppText size="xs" tone="muted">
                            {`${activeInvestor.sharePercentage ?? 0}% equity shareholder${(activeInvestor.status || 'active') !== 'active' ? ' · inactive' : ''}`}
                        </AppText>
                    </View>
                    {capitalInvested > 0 ? (
                        <View style={{ alignItems: 'flex-end' }}>
                            <Label>Capital Invested</Label>
                            <AppText size="sm" mono weight="800">{formatMoney(capitalInvested)}</AppText>
                        </View>
                    ) : null}
                </Row>
            ) : null}

            <Card>
                {isLoadingData && myPayouts.length === 0 ? <Loading label="Loading payouts…" /> : null}
                {!isLoadingData && myPayouts.length === 0 ? (
                    <EmptyState
                        icon={CreditCard}
                        title="No payout distributions recorded yet"
                        message="Dividends are disbursed after each month is reconciled by the arena desk."
                    />
                ) : null}
                {myPayouts.length > 0 ? (
                    <>
                        {shown.map((pay, index) => <PayoutRow key={pay.id} payout={pay} first={index === 0} />)}
                        {hasMore ? <Button title={`Show more (${remaining})`} variant="secondary" size="sm" onPress={showMore} style={{ marginBottom: spacing.sm }} /> : null}
                        <Row justify="space-between" style={{ paddingTop: spacing.md, marginTop: 2, borderTopWidth: 1, borderTopColor: colors.borderBrand }}>
                            <AppText size="sm" weight="800">Total received</AppText>
                            <AppText size="md" mono weight="900" tone="brand">{formatMoney(totalReceived)}</AppText>
                        </Row>
                    </>
                ) : null}
            </Card>
        </InvestorScreen>
    );
}
