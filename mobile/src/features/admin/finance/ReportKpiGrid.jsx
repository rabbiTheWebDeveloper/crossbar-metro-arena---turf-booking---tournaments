import React from 'react';
import { TrendingUp, Receipt, Wallet, CalendarCheck } from 'lucide-react-native';
import { StatCard, StatGrid } from '@/components/ui';
import { formatPercent } from '@/lib/format';
import { formatMoney } from '@/data/finance';

/** The four headline figures of a month: revenue, expenses, net profit and slots booked. */
export function ReportKpiGrid({ report }) {
    const categoryCount = report.expensesByCategory.length;
    return (
        <StatGrid>
            <StatCard
                label="Total revenue"
                value={formatMoney(report.totalRevenue)}
                hint={`Bookings ${formatMoney(report.bookingMoneyCollected)} + other ${formatMoney(report.otherIncomeTotal)}`}
                icon={Wallet}
                tone="neutral"
            />
            <StatCard
                label="Total expenses"
                value={formatMoney(report.totalExpenses)}
                hint={`${categoryCount} categor${categoryCount === 1 ? 'y' : 'ies'} · refunds paid ${formatMoney(report.refundsAmount)}`}
                icon={Receipt}
                tone="neutral"
            />
            <StatCard
                label="Net profit"
                value={formatMoney(report.netProfit)}
                hint={`${formatPercent(report.profitMargin)} margin`}
                icon={TrendingUp}
                tone={report.isLossMonth ? 'danger' : 'brand'}
            />
            <StatCard
                label="Slots booked"
                value={String(report.slotsBooked)}
                hint={`${formatPercent(report.occupancyRate)} occupancy · ${report.cancellationsCount} cancelled (advance ${formatMoney(report.cancellationsAmount)})`}
                icon={CalendarCheck}
                tone="neutral"
            />
        </StatGrid>
    );
}
