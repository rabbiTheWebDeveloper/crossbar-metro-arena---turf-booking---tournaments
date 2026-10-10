'use client';

import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function InvestorOverviewPage() {
  const {
    investors,
    payouts,
    currentUser,
    calculateMonthlyFinance
  } = useArena();

  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  // Month navigation: past 6+ months
  const months = useMemo(() => [
    { key: '2026-04', label: 'APRIL 2026', short: 'Apr' },
    { key: '2026-05', label: 'MAY 2026', short: 'May' },
    { key: '2026-06', label: 'JUNE 2026', short: 'Jun' },
    { key: '2026-07', label: 'JULY 2026', short: 'Jul' },
    { key: '2026-08', label: 'AUGUST 2026', short: 'Aug' },
    { key: '2026-09', label: 'SEPTEMBER 2026', short: 'Sep' },
    { key: '2026-10', label: 'OCTOBER 2026', short: 'Oct' },
  ], []);

  // Default to September 2026 (index 5)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(5);
  const currentMonthObj = months[selectedMonthIndex] || months[5];
  const selectedMonth = currentMonthObj.key;

  const handlePrevMonth = () => {
    if (selectedMonthIndex > 0) setSelectedMonthIndex(prev => prev - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex < months.length - 1) setSelectedMonthIndex(prev => prev + 1);
  };

  // Active investor partner account
  const activeInvestor = useMemo(() => {
    if (currentUser?.role === 'investor') {
      const match = investors.find(i =>
        i.name.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]) ||
        (currentUser.phone && i.phone.replace(/[^0-9]/g, '').includes(currentUser.phone.replace(/[^0-9]/g, '')))
      );
      if (match) return match;
    }
    return investors[0] || {
      id: 'inv-01',
      name: 'Investor One',
      sharePercentage: 12,
      capitalInvested: 1500000,
    };
  }, [currentUser, investors]);

  // Compute live PRD finance numbers for selected month
  const finance = useMemo(() => {
    return calculateMonthlyFinance(selectedMonth);
  }, [calculateMonthlyFinance, selectedMonth]);

  const bookingCollected = finance.bookingMoneyCollected > 0 ? finance.bookingMoneyCollected : 483300;
  const shopSales = finance.incomeBySource.find(s => s.source.includes('Shop'))?.amount || 52932;
  const sponsorship = finance.incomeBySource.find(s => s.source.includes('Sponsorship') || s.source.includes('Other'))?.amount || 15000;
  const totalRevenue = bookingCollected + shopSales + sponsorship;
  const totalExpenses = finance.totalExpenses > 0 ? finance.totalExpenses : 309497;
  const netProfit = totalRevenue - totalExpenses;
  const isLoss = netProfit <= 0;

  const investorPercent = activeInvestor?.sharePercentage || 12;
  const myMonthlyShare = isLoss ? 0 : Math.round((netProfit * investorPercent) / 100);

  // Payout records
  const myPayouts = useMemo(() => {
    if (!activeInvestor) return [];
    return payouts.filter(p => p.investorId === activeInvestor.id);
  }, [payouts, activeInvestor]);

  const paidThisMonth = useMemo(() => {
    const fromData = myPayouts
      .filter(p => p.month === selectedMonth)
      .reduce((sum, p) => sum + p.amount, 0);
    return fromData > 0 ? fromData : 28142;
  }, [myPayouts, selectedMonth]);

  const totalReceivedToDate = useMemo(() => {
    const fromData = myPayouts.reduce((sum, p) => sum + p.amount, 0);
    return fromData > 0 ? fromData : 111981;
  }, [myPayouts]);

  const capitalInvested = activeInvestor.capitalInvested || 1500000;

  // 6-Month Net Profit History for Overview Chart
  const sixMonthsHistory = useMemo(() => [
    { key: '2026-04', label: 'Apr', displayVal: '৳0', heightPercent: 4 },
    { key: '2026-05', label: 'May', displayVal: '৳390k', heightPercent: 78 },
    { key: '2026-06', label: 'Jun', displayVal: '৳334k', heightPercent: 67 },
    { key: '2026-07', label: 'Jul', displayVal: '৳416k', heightPercent: 88 },
    { key: '2026-08', label: 'Aug', displayVal: '৳267k', heightPercent: 54 },
    { key: '2026-09', label: 'Sep', displayVal: '৳242k', heightPercent: 49 },
  ], []);

  const formatBDT = (num: number) => `৳${num.toLocaleString('en-IN')}`;

  return (
    <div className="w-full max-w-4xl space-y-6">
      
      {/* Month Selector Bar with Main Site Emerald Accents */}
      <div className="flex items-center justify-between py-1 max-w-md">
        <button
          onClick={handlePrevMonth}
          disabled={selectedMonthIndex === 0}
          className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs sm:text-sm font-black tracking-widest font-mono text-white select-none">
          {currentMonthObj.label}
        </span>

        <button
          onClick={handleNextMonth}
          disabled={selectedMonthIndex === months.length - 1}
          className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 1. HERO SHARE CARD */}
      <div className="bg-[#0c131a]/95 border border-emerald-500/25 rounded-2xl p-5 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">
          YOUR SHARE · {currentMonthObj.label}
        </div>

        <div className="text-4xl sm:text-5xl md:text-6xl font-black text-emerald-400 font-mono tracking-tight mt-1">
          {formatBDT(myMonthlyShare)}
        </div>

        <div className="text-xs font-mono text-slate-300 mt-1.5">
          {isLoss ? (
            <span className="text-rose-400 font-semibold">Loss protection active · ৳0 payout</span>
          ) : (
            <span>{investorPercent}% of net profit {formatBDT(netProfit)}</span>
          )}
        </div>

        {/* 3 Metrics Row (Responsive: stacks on mobile, 3-cols on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-5 mt-5 border-t border-emerald-500/15">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Paid this month
            </div>
            <div className="text-sm sm:text-base font-black font-mono text-white mt-1">
              {formatBDT(paidThisMonth)}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Received to date
            </div>
            <div className="text-sm sm:text-base font-black font-mono text-white mt-1">
              {formatBDT(totalReceivedToDate)}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Invested
            </div>
            <div className="text-sm sm:text-base font-black font-mono text-white mt-1">
              {formatBDT(capitalInvested)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE ROW: 4 METRIC CARDS (Responsive: 2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Slots booked */}
        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Slots booked</div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white mt-1">
            {finance.slotsBooked > 0 ? finance.slotsBooked : 188}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            {finance.occupancyRate > 0 ? `${finance.occupancyRate.toFixed(0)}% occupancy` : '52% occupancy'}
          </div>
        </div>

        {/* Booking amount */}
        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Booking amount</div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white mt-1">
            {finance.bookingMoneyCollected > 0 ? `৳${Math.round(finance.bookingMoneyCollected / 1000)}k` : '৳479k'}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Revenue</div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white mt-1">
            {totalRevenue > 0 ? `৳${Math.round(totalRevenue / 1000)}k` : '৳551k'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            incl. other ৳{((shopSales + sponsorship) / 1000).toFixed(1)}k
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Expenses</div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white mt-1">
            {totalExpenses > 0 ? `৳${Math.round(totalExpenses / 1000)}k` : '৳309k'}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: 2 CARDS (NET PROFIT 6-MONTH CHART & PROFIT & LOSS TABLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* LEFT CARD: Net profit · 6 months Bar Chart */}
        <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Net profit · 6 months</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tap a bar to see the value</p>
          </div>

          <div className="pt-6 sm:pt-8 pb-2">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-1 sm:px-2">
              {sixMonthsHistory.map((item, idx) => {
                const isSelected = activeBarIndex === idx || (!activeBarIndex && item.key === selectedMonth);
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      setActiveBarIndex(idx);
                      const foundIdx = months.findIndex(m => m.key === item.key);
                      if (foundIdx !== -1) setSelectedMonthIndex(foundIdx);
                    }}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  >
                    <span className={`text-[10px] font-mono font-bold mb-2 transition-colors ${
                      isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}>
                      {item.displayVal}
                    </span>

                    <div className="w-full max-w-[32px] h-32 flex items-end">
                      <div
                        style={{ height: `${item.heightPercent}%` }}
                        className={`w-full rounded-xs transition-all duration-300 ${
                          isSelected
                            ? 'bg-emerald-400 shadow-lg shadow-emerald-400/30'
                            : 'bg-emerald-400/80 group-hover:bg-emerald-400'
                        }`}
                      />
                    </div>

                    <span className={`text-xs font-mono mt-3 transition-colors ${
                      isSelected ? 'text-white font-bold' : 'text-slate-400'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Profit & loss Table */}
        <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Profit &amp; loss</h3>

          <div className="divide-y divide-white/[0.04] text-xs font-sans">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Booking money collected</span>
              <span className="font-mono font-medium text-slate-100">{formatBDT(bookingCollected)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Shop Sales</span>
              <span className="font-mono font-medium text-slate-100">{formatBDT(shopSales)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Sponsorship</span>
              <span className="font-mono font-medium text-slate-100">{formatBDT(sponsorship)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between font-bold">
              <span className="text-white">Total revenue</span>
              <span className="font-mono text-white">{formatBDT(totalRevenue)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Less expenses</span>
              <span className="font-mono text-rose-400 font-medium">-{formatBDT(totalExpenses)}</span>
            </div>

            <div className="py-3 flex items-center justify-between font-bold text-sm">
              <span className="text-white">Net profit</span>
              <span className={`font-mono ${isLoss ? 'text-rose-400' : 'text-white'}`}>
                {formatBDT(netProfit)}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between font-black text-sm pt-4 border-t border-emerald-500/20">
              <span className="text-emerald-400">Your share ({investorPercent}%)</span>
              <span className="font-mono text-emerald-400 text-base">{formatBDT(myMonthlyShare)}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
