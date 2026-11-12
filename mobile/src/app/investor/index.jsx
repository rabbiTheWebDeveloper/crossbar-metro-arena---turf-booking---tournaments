import React, { useMemo } from 'react';
import { CalendarCheck, Wallet, TrendingUp, Receipt } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { useInvestor } from '@/context/InvestorContext';
import { Card, MonthSwitcher, StatCard, StatGrid, Stack } from '@/components/ui';
import { formatMoney } from '@/data/finance';
import { compactMoney, formatPercent } from '@/lib/format';
import { InvestorScreen } from '@/features/investor/InvestorScreen';
import { useMonthWindow } from '@/features/investor/hooks';
import { ShareHeroCard } from '@/features/investor/ShareHeroCard';
import { ProfitLossCard } from '@/features/investor/ProfitLossCard';
import { CardHeader } from '@/features/investor/CardHeader';
import { TapBarChart } from '@/features/investor/TapBarChart';

const HISTORY_MONTHS = 6;

/** Investor portal · Overview: the partner's share for a month, key figures and the P&L. */
export default function InvestorOverviewScreen() {
    const { payouts, calculateMonthlyFinance } = useArena();
    const { activeInvestor } = useInvestor();
    const myInvestorId = activeInvestor?.id || null;

    // Rolling 6-month window ending at the current Dhaka month
    const { months, selectedMonth, setSelectedMonth, monthLabel, minMonth, maxMonth } = useMonthWindow(HISTORY_MONTHS);

    // One finance calculation per month, memoised for the whole window
    const financeByMonth = useMemo(() => {
        const map = {};
        months.forEach(m => { map[m.key] = calculateMonthlyFinance(m.key); });
        return map;
    }, [months, calculateMonthlyFinance]);

    const finance = financeByMonth[selectedMonth];
    const myShare = useMemo(() => (finance.investorShares || []).find(s => s.investor.id === myInvestorId) || null, [finance, myInvestorId]);

    const investorPercent = Number(activeInvestor?.sharePercentage) || 0;
    const myMonthlyShare = myShare?.shareAmount ?? 0;
    const isInactive = Boolean(activeInvestor) && (activeInvestor.status || 'active') !== 'active';

    const totalReceivedToDate = useMemo(() => payouts
        .filter(p => p.investorId === myInvestorId)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [payouts, myInvestorId]);

    const history = useMemo(() => {
        const maxProfit = Math.max(1, ...months.map(m => Math.abs(financeByMonth[m.key].netProfit)));
        return months.map(m => {
            const fin = financeByMonth[m.key];
            const abs = Math.abs(fin.netProfit);
            return {
                key: m.key,
                label: m.short,
                caption: `${fin.netProfit < 0 ? '-' : ''}৳${compactMoney(abs)}`,
                heightPercent: fin.netProfit === 0 ? 4 : Math.min(100, Math.max(10, (abs / maxProfit) * 100)),
                danger: fin.isLossMonth,
                a11y: `${m.short}: ${formatMoney(fin.netProfit)}`
            };
        });
    }, [months, financeByMonth]);

    const categoryCount = finance.expensesByCategory.length;

    return (
        <InvestorScreen title="Overview">
            <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} minMonth={minMonth} maxMonth={maxMonth} />

            <ShareHeroCard
                monthLabel={monthLabel}
                shareAmount={myMonthlyShare}
                percent={investorPercent}
                netProfit={finance.netProfit}
                isInactive={isInactive}
                isLossMonth={finance.isLossMonth}
                paidThisMonth={myShare?.paidAmount ?? 0}
                balanceThisMonth={myShare?.balance ?? 0}
                receivedToDate={totalReceivedToDate}
                capitalInvested={Number(activeInvestor?.capitalInvested) || 0}
            />

            <StatGrid>
                <StatCard label="Slots booked" value={String(finance.slotsBooked)} hint={`${formatPercent(finance.occupancyRate)} occupancy`} icon={CalendarCheck} tone="neutral" />
                <StatCard label="Booking money" value={formatMoney(finance.bookingMoneyCollected)} hint={`net of refunds ${formatMoney(finance.refundsAmount)}`} icon={Wallet} tone="neutral" />
                <StatCard label="Total revenue" value={formatMoney(finance.totalRevenue)} hint={`incl. other ${formatMoney(finance.otherIncomeTotal)}`} icon={TrendingUp} tone="neutral" />
                <StatCard label="Expenses" value={formatMoney(finance.totalExpenses)} hint={`${categoryCount} categor${categoryCount === 1 ? 'y' : 'ies'}`} icon={Receipt} tone="neutral" />
            </StatGrid>

            <Card>
                <Stack gap={16}>
                    <CardHeader title={`Net profit · ${HISTORY_MONTHS} months`} subtitle="Tap a bar to switch month" />
                    <TapBarChart
                        data={history}
                        height={128}
                        gap={8}
                        highlight="tone"
                        showCaptions
                        showLabels
                        maxBarWidth={32}
                        selectedIndex={months.findIndex(m => m.key === selectedMonth)}
                        onSelect={(index) => setSelectedMonth(months[index].key)}
                    />
                </Stack>
            </Card>

            <ProfitLossCard finance={finance} percent={investorPercent} shareAmount={myMonthlyShare} />
        </InvestorScreen>
    );
}
