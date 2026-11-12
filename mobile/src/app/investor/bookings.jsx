import React, { useMemo } from 'react';
import { CalendarCheck, Banknote, Wallet, CalendarX } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { AppText, Loading, MonthSwitcher, StatCard, StatGrid } from '@/components/ui';
import { formatMoney, formatDate } from '@/data/finance';
import { formatPercent } from '@/lib/format';
import { InvestorScreen } from '@/features/investor/InvestorScreen';
import { useMonthWindow } from '@/features/investor/hooks';
import { DailyMoneyCard, SlotPopularityCard } from '@/features/investor/FinanceCharts';

/** Investor portal · Bookings: slot usage, booking money and the busiest days / slots of a month. */
export default function InvestorBookingsScreen() {
    const { calculateMonthlyFinance, pricing, isLoadingData } = useArena();
    const { selectedMonth, setSelectedMonth, minMonth, maxMonth } = useMonthWindow(7);

    const finance = useMemo(() => calculateMonthlyFinance(selectedMonth), [calculateMonthlyFinance, selectedMonth]);
    const dailyBreakdown = finance.dailyBreakdown || [];

    // Slot distribution labelled from the live pricing schedule
    const popularSlots = useMemo(() => {
        const slotDefs = (pricing?.slotPrices?.length ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION);
        const slotMap = {};
        (finance.popularSlotsRanking || []).forEach(s => { slotMap[s.slotNumber] = s.count || 0; });
        return slotDefs.map(s => ({
            slotNumber: s.slotNumber,
            label: s.displayTime || `Slot ${s.slotNumber}`,
            count: slotMap[s.slotNumber] || 0
        }));
    }, [finance.popularSlotsRanking, pricing]);

    const isLoading = isLoadingData && finance.slotsBooked === 0 && finance.totalRevenue === 0;

    return (
        <InvestorScreen title="Bookings">
            <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} minMonth={minMonth} maxMonth={maxMonth} />

            {isLoading ? <Loading label="Loading bookings…" /> : (
                <>
                    <StatGrid>
                        <StatCard label="Slots booked" value={String(finance.slotsBooked)} hint={`${formatPercent(finance.occupancyRate)} occupancy`} icon={CalendarCheck} tone="neutral" />
                        <StatCard label="Booking amount" value={formatMoney(finance.bookingMoneyCollected + finance.dueAmountTotal)} hint={`incl. due ${formatMoney(finance.dueAmountTotal)}`} icon={Banknote} tone="neutral" />
                        <StatCard label="Collected" value={formatMoney(finance.bookingMoneyCollected)} hint={`refunded ${formatMoney(finance.refundsAmount)}`} icon={Wallet} tone="brand" />
                        <StatCard label="Cancelled" value={String(finance.cancellationsCount)} hint={`Advance on cancelled ${formatMoney(finance.cancellationsAmount)}`} icon={CalendarX} tone="danger" />
                    </StatGrid>

                    <DailyMoneyCard
                        breakdown={dailyBreakdown}
                        monthKey={selectedMonth}
                        subtitle="Tap a bar to see the day's slots and cash"
                        right={<AppText size="xs" mono tone="muted">{`Days: ${dailyBreakdown.length}`}</AppText>}
                        formatDetail={(d) => `${formatDate(d.date)}: ${d.slotsBooked || 0} slot${d.slotsBooked === 1 ? '' : 's'} · ${formatMoney(d.moneyCollected)} collected`}
                    />

                    <SlotPopularityCard slots={popularSlots} subtitle="Bookings per slot this month" />
                </>
            )}
        </InvestorScreen>
    );
}
