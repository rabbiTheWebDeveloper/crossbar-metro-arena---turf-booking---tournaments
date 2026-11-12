import React, { useMemo, useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { Loading, MonthSwitcher } from '@/components/ui';
import { todayDhakaIso } from '@/lib/dateUtils';
import { formatMoney, formatDate } from '@/data/finance';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { DailyMoneyCard, SlotPopularityCard } from '@/features/investor/FinanceCharts';
import { ReportKpiGrid } from '@/features/admin/finance/ReportKpiGrid';
import { ExpensesByCategoryCard, IncomeSourcesCard } from '@/features/admin/finance/BreakdownCards';
import { ProfitDistributionCard } from '@/features/admin/finance/ProfitDistributionCard';
import { ExpenseEntriesCard } from '@/features/admin/finance/ExpenseEntriesCard';
import { DailyBreakdownCard } from '@/features/admin/finance/DailyBreakdownCard';
import { AddExpenseSheet } from '@/features/admin/finance/AddExpenseSheet';
import { AddIncomeSheet } from '@/features/admin/finance/AddIncomeSheet';
import { defaultEntryDate } from '@/features/admin/finance/helpers';

/** Admin · Financial report: monthly P&L on a cash basis, with expense and other-income entry. */
export default function AdminFinancialReportScreen() {
    const { calculateMonthlyFinance, expenses, isLoadingData } = useArena();
    const [selectedMonth, setSelectedMonth] = useState(() => todayDhakaIso().slice(0, 7));
    const report = useMemo(() => calculateMonthlyFinance(selectedMonth), [calculateMonthlyFinance, selectedMonth]);

    const [showExpenseSheet, setShowExpenseSheet] = useState(false);
    const [showIncomeSheet, setShowIncomeSheet] = useState(false);

    const popularSlots = useMemo(() => (report.popularSlotsRanking || [])
        .slice()
        .sort((a, b) => a.slotNumber - b.slotNumber)
        .map(s => ({ slotNumber: s.slotNumber, label: s.displayTime || `Slot ${s.slotNumber}`, count: s.count })), [report.popularSlotsRanking]);

    const maxDailyMoney = useMemo(() => Math.max(1, ...report.dailyBreakdown.map(d => d.moneyCollected)), [report.dailyBreakdown]);
    const maxSlotCount = useMemo(() => Math.max(1, ...popularSlots.map(s => s.count)), [popularSlots]);

    const entryDate = defaultEntryDate(selectedMonth);
    const isLoading = isLoadingData && expenses.length === 0 && report.totalRevenue === 0;

    return (
        <>
            <AdminScreen title="Financial report" subtitle="Revenue, expenses, profit">
                <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} />

                {isLoading ? <Loading label="Loading financial data…" /> : null}

                <ReportKpiGrid report={report} />

                <DailyMoneyCard
                    breakdown={report.dailyBreakdown}
                    monthKey={selectedMonth}
                    subtitle={`Tap a bar to see the value · peak ${formatMoney(maxDailyMoney)}`}
                    placeholder="Tap any bar for details"
                    minPercent={6}
                    zeroPercent={2}
                    formatDetail={(d) => `${formatDate(d.date)}: ${formatMoney(d.moneyCollected)}`}
                />
                <SlotPopularityCard slots={popularSlots} subtitle={`Bookings per slot · peak ${maxSlotCount}`} />

                <ExpensesByCategoryCard report={report} month={selectedMonth} onAdd={() => setShowExpenseSheet(true)} />
                <IncomeSourcesCard report={report} month={selectedMonth} onAdd={() => setShowIncomeSheet(true)} />

                <ProfitDistributionCard report={report} />
                <ExpenseEntriesCard month={selectedMonth} />
                <DailyBreakdownCard report={report} month={selectedMonth} />
            </AdminScreen>

            <AddExpenseSheet visible={showExpenseSheet} onClose={() => setShowExpenseSheet(false)} defaultDate={entryDate} />
            <AddIncomeSheet visible={showIncomeSheet} onClose={() => setShowIncomeSheet(false)} defaultDate={entryDate} />
        </>
    );
}
