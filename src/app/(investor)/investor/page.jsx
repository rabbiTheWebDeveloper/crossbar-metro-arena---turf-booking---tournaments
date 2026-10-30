'use client';
import React, { useState, useMemo } from 'react';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { useInvestor } from '@/context/InvestorContext';
import { formatMoney, buildMonthList } from '@/data/finance';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HISTORY_MONTHS = 6;

export default function InvestorOverviewPage() {
    const { payouts, calculateMonthlyFinance, isLoadingData } = useArena();
    const { activeInvestor } = useInvestor();
    const myInvestorId = activeInvestor?.id || null;

    // Rolling 6-month window ending at the current Dhaka month
    const months = useMemo(() => buildMonthList(todayDhaka().slice(0, 7), HISTORY_MONTHS), []);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => months.length - 1);
    const currentMonthObj = months[selectedMonthIndex] || months[months.length - 1];
    const selectedMonth = currentMonthObj.key;

    const handlePrevMonth = () => { if (selectedMonthIndex > 0) setSelectedMonthIndex(prev => prev - 1); };
    const handleNextMonth = () => { if (selectedMonthIndex < months.length - 1) setSelectedMonthIndex(prev => prev + 1); };

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
    const paidThisMonth = myShare?.paidAmount ?? 0;
    const balanceThisMonth = myShare?.balance ?? 0;
    const isInactive = Boolean(activeInvestor) && (activeInvestor.status || 'active') !== 'active';

    const totalReceivedToDate = useMemo(() => payouts
        .filter(p => p.investorId === myInvestorId)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [payouts, myInvestorId]);

    const capitalInvested = Number(activeInvestor?.capitalInvested) || 0;

    const sixMonthsHistory = useMemo(() => {
        const maxProfit = Math.max(1, ...months.map(m => Math.abs(financeByMonth[m.key].netProfit)));
        return months.map(m => {
            const fin = financeByMonth[m.key];
            return {
                key: m.key,
                label: m.short,
                netProfit: fin.netProfit,
                displayVal: `${fin.netProfit < 0 ? '-' : ''}${formatMoney(Math.abs(fin.netProfit))}`,
                heightPercent: fin.netProfit === 0 ? 4 : Math.min(100, Math.max(10, (Math.abs(fin.netProfit) / maxProfit) * 100)),
                isLoss: fin.isLossMonth
            };
        });
    }, [months, financeByMonth]);

    if (isLoadingData && !activeInvestor) {
        return (<div className="w-full max-w-4xl space-y-6" aria-busy="true">
            <div className="h-8 w-56 rounded-xl bg-white/5 animate-pulse"/>
            <div className="h-48 rounded-2xl bg-white/5 animate-pulse"/>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map(n => <div key={n} className="h-24 rounded-2xl bg-white/5 animate-pulse"/>)}</div>
        </div>);
    }

    return (<div className="w-full max-w-4xl space-y-6">

      {/* Month Selector */}
      <div className="flex items-center justify-between py-1 max-w-md">
        <button onClick={handlePrevMonth} disabled={selectedMonthIndex === 0} className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer" aria-label="Previous month">
          <ChevronLeft className="w-4 h-4"/>
        </button>
        <span className="text-xs sm:text-sm font-black tracking-widest font-mono text-white select-none">
          {currentMonthObj.label}
        </span>
        <button onClick={handleNextMonth} disabled={selectedMonthIndex === months.length - 1} className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer" aria-label="Next month">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>

      {/* 1. HERO SHARE CARD */}
      <div className="bg-[#0c131a]/95 border border-emerald-500/25 rounded-2xl p-5 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"/>

        <div className="text-[12px] font-mono font-bold uppercase tracking-widest text-emerald-400">
          YOUR SHARE · {currentMonthObj.label}
        </div>

        <div className="text-4xl sm:text-5xl md:text-6xl font-black text-emerald-400 font-mono tracking-tight mt-1">
          {formatMoney(myMonthlyShare)}
        </div>

        <div className="text-xs font-mono text-slate-300 mt-1.5">
          {isInactive
            ? (<span className="text-amber-300 font-semibold">Partner account inactive · no share allocated</span>)
            : finance.isLossMonth
                ? (<span className="text-rose-400 font-semibold">Loss protection active · ৳0 payout</span>)
                : (<span>{investorPercent}% of net profit {formatMoney(finance.netProfit)}</span>)}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-5 mt-5 border-t border-emerald-500/15">
          <div>
            <div className="text-[12px] text-slate-400 uppercase tracking-wider font-semibold">Paid for this month</div>
            <div className="text-sm sm:text-base font-black font-mono text-white mt-1">{formatMoney(paidThisMonth)}</div>
          </div>
          <div>
            <div className="text-[12px] text-slate-400 uppercase tracking-wider font-semibold">Still owed</div>
            <div className={`text-sm sm:text-base font-black font-mono mt-1 ${balanceThisMonth > 0 ? 'text-amber-300' : 'text-white'}`}>{formatMoney(balanceThisMonth)}</div>
          </div>
          <div>
            <div className="text-[12px] text-slate-400 uppercase tracking-wider font-semibold">Received to date</div>
            <div className="text-sm sm:text-base font-black font-mono text-white mt-1">{formatMoney(totalReceivedToDate)}</div>
          </div>
          <div>
            <div className="text-[12px] text-slate-400 uppercase tracking-wider font-semibold">Invested</div>
            <div className="text-sm sm:text-base font-black font-mono text-white mt-1">{formatMoney(capitalInvested)}</div>
          </div>
        </div>
      </div>

      {/* 2. METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Slots booked</div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white mt-1">{finance.slotsBooked}</div>
          <div className="text-[12px] text-slate-400 mt-1 font-mono truncate">{finance.occupancyRate.toFixed(1)}% occupancy</div>
        </div>

        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Booking money</div>
          <div className="text-lg sm:text-2xl font-black font-mono text-white mt-1 truncate">{formatMoney(finance.bookingMoneyCollected)}</div>
          <div className="text-[12px] text-slate-400 mt-1 font-mono truncate">net of refunds {formatMoney(finance.refundsAmount)}</div>
        </div>

        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Total revenue</div>
          <div className="text-lg sm:text-2xl font-black font-mono text-white mt-1 truncate">{formatMoney(finance.totalRevenue)}</div>
          <div className="text-[12px] text-slate-400 mt-1 font-mono truncate">incl. other {formatMoney(finance.otherIncomeTotal)}</div>
        </div>

        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Expenses</div>
          <div className="text-lg sm:text-2xl font-black font-mono text-white mt-1 truncate">{formatMoney(finance.totalExpenses)}</div>
          <div className="text-[12px] text-slate-400 mt-1 font-mono truncate">{finance.expensesByCategory.length} categor{finance.expensesByCategory.length === 1 ? 'y' : 'ies'}</div>
        </div>
      </div>

      {/* 3. CHART + P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Net profit · {HISTORY_MONTHS} months</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tap a bar to switch month</p>
          </div>

          <div className="pt-6 sm:pt-8 pb-2">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-1 sm:px-2">
              {sixMonthsHistory.map((item, idx) => {
                const isSelected = item.key === selectedMonth;
                return (<button type="button" key={item.key} onClick={() => setSelectedMonthIndex(idx)} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer" aria-pressed={isSelected} aria-label={`${item.label}: ${item.displayVal}`}>
                    <span className={`text-[10px] sm:text-[11px] font-mono font-bold mb-2 transition-colors truncate max-w-full ${isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      {item.displayVal}
                    </span>
                    <div className="w-full max-w-[32px] h-32 flex items-end">
                      <div style={{ height: `${item.heightPercent}%` }} className={`w-full rounded-xs transition-all duration-300 ${isSelected
                        ? (item.isLoss ? 'bg-rose-400 shadow-lg shadow-rose-400/30' : 'bg-emerald-400 shadow-lg shadow-emerald-400/30')
                        : (item.isLoss ? 'bg-rose-500/80 group-hover:bg-rose-400' : 'bg-emerald-400/80 group-hover:bg-emerald-400')}`}/>
                    </div>
                    <span className={`text-xs font-mono mt-3 transition-colors ${isSelected ? 'text-white font-bold' : 'text-slate-400'}`}>
                      {item.label}
                    </span>
                  </button>);
              })}
            </div>
          </div>
        </div>

        <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Profit &amp; loss</h3>

          <div className="divide-y divide-white/[0.04] text-xs font-sans">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Booking money collected</span>
              <span className="font-mono font-medium text-slate-100">{formatMoney(finance.bookingMoneyCollected)}</span>
            </div>

            {(finance.incomeBySource || []).filter(s => s.key !== 'bookings').map(src => (
              <div key={src.key} className="py-2.5 flex items-center justify-between">
                <span className="text-slate-300">{src.source}</span>
                <span className="font-mono font-medium text-slate-100">{formatMoney(src.amount)}</span>
              </div>
            ))}

            <div className="py-2.5 flex items-center justify-between font-bold">
              <span className="text-white">Total revenue</span>
              <span className="font-mono text-white">{formatMoney(finance.totalRevenue)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Less expenses</span>
              <span className="font-mono text-rose-400 font-medium">-{formatMoney(finance.totalExpenses)}</span>
            </div>

            <div className="py-3 flex items-center justify-between font-bold text-sm">
              <span className="text-white">Net profit</span>
              <span className={`font-mono ${finance.isLossMonth ? 'text-rose-400' : 'text-white'}`}>
                {finance.netProfit < 0 ? '-' : ''}{formatMoney(Math.abs(finance.netProfit))}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between font-black text-sm pt-4 border-t border-emerald-500/20">
              <span className="text-emerald-400">Your share ({investorPercent}%)</span>
              <span className="font-mono text-emerald-400 text-base">{formatMoney(myMonthlyShare)}</span>
            </div>
          </div>
        </div>

      </div>

    </div>);
}
