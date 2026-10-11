'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { useInvestor } from './layout';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function InvestorOverviewPage() {
    const { investors, payouts, currentUser, calculateMonthlyFinance } = useArena();
    const layoutInvestor = useInvestor()?.activeInvestor;

    // Active investor partner account
    const activeInvestor = useMemo(() => {
        if (layoutInvestor) return layoutInvestor;
        if (currentUser?.role === 'investor') {
            const match = investors.find(i => 
                i.name.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]) ||
                (currentUser.phone && i.phone.replace(/[^0-9]/g, '').includes(currentUser.phone.replace(/[^0-9]/g, '')))
            );
            if (match) return match;
        }
        return investors[0] || {
            id: '',
            name: 'Investor Partner',
            sharePercentage: 0,
            capitalInvested: 0,
        };
    }, [layoutInvestor, currentUser, investors]);

    // Generate rolling months up to current date
    const months = useMemo(() => {
        const list = [];
        const base = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
            const short = d.toLocaleDateString('en-US', { month: 'short' });
            list.push({ key, label, short });
        }
        return list;
    }, []);

    // Default to the latest month
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => months.length - 1);
    const [activeBarIndex, setActiveBarIndex] = useState(null);

    const currentMonthObj = months[selectedMonthIndex] || months[months.length - 1] || { key: '2026-10', label: 'OCTOBER 2026' };
    const selectedMonth = currentMonthObj.key;

    const handlePrevMonth = () => {
        if (selectedMonthIndex > 0)
            setSelectedMonthIndex(prev => prev - 1);
    };

    const handleNextMonth = () => {
        if (selectedMonthIndex < months.length - 1)
            setSelectedMonthIndex(prev => prev + 1);
    };

    // Compute live PRD finance numbers for selected month from MongoDB
    const finance = useMemo(() => {
        return calculateMonthlyFinance(selectedMonth);
    }, [calculateMonthlyFinance, selectedMonth]);

    const bookingCollected = finance.bookingMoneyCollected;
    const otherTotal = finance.otherIncomeTotal;
    const totalRevenue = finance.totalRevenue;
    const totalExpenses = finance.totalExpenses;
    const netProfit = finance.netProfit;
    const isLoss = finance.isLossMonth;
    const investorPercent = activeInvestor?.sharePercentage || 0;
    const myMonthlyShare = isLoss ? 0 : Math.round((netProfit * investorPercent) / 100);

    // Payout records from live database
    const myPayouts = useMemo(() => {
        if (!activeInvestor) return [];
        return payouts.filter(p => 
            p.investorId === activeInvestor.id || 
            p.investorName?.toLowerCase() === activeInvestor.name?.toLowerCase()
        );
    }, [payouts, activeInvestor]);

    const paidThisMonth = useMemo(() => {
        return myPayouts
            .filter(p => p.month === selectedMonth)
            .reduce((sum, p) => sum + p.amount, 0);
    }, [myPayouts, selectedMonth]);

    const totalReceivedToDate = useMemo(() => {
        return myPayouts.reduce((sum, p) => sum + p.amount, 0);
    }, [myPayouts]);

    const capitalInvested = activeInvestor.capitalInvested || 0;

    // Dynamic 6-Month Net Profit History calculated from database records
    const sixMonthsHistory = useMemo(() => {
        const historyMonths = months.slice(Math.max(0, months.length - 6));
        const maxProfit = Math.max(1, ...historyMonths.map(m => Math.abs(calculateMonthlyFinance(m.key).netProfit)));
        
        return historyMonths.map(m => {
            const fin = calculateMonthlyFinance(m.key);
            const valK = Math.round(fin.netProfit / 1000);
            const heightPercent = Math.min(100, Math.max(10, (Math.abs(fin.netProfit) / maxProfit) * 100));
            return {
                key: m.key,
                label: m.short,
                displayVal: `${fin.netProfit < 0 ? '-' : ''}৳${Math.abs(valK)}k`,
                heightPercent,
                isLoss: fin.isLossMonth
            };
        });
    }, [months, calculateMonthlyFinance]);

    const formatBDT = (num) => `৳${Number(num || 0).toLocaleString('en-IN')}`;

    return (<div className="w-full max-w-4xl space-y-6">
      
      {/* Month Selector Bar with Main Site Emerald Accents */}
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
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"/>

        <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">
          YOUR SHARE · {currentMonthObj.label}
        </div>

        <div className="text-4xl sm:text-5xl md:text-6xl font-black text-emerald-400 font-mono tracking-tight mt-1">
          {formatBDT(myMonthlyShare)}
        </div>

        <div className="text-xs font-mono text-slate-300 mt-1.5">
          {isLoss ? (<span className="text-rose-400 font-semibold">Loss protection active · ৳0 payout</span>) : (<span>{investorPercent}% of net profit {formatBDT(netProfit)}</span>)}
        </div>

        {/* 3 Metrics Row */}
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

      {/* 2. MIDDLE ROW: 4 METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Slots booked */}
        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Slots booked</div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white mt-1">
            {finance.slotsBooked}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            {finance.occupancyRate.toFixed(0)}% occupancy
          </div>
        </div>

        {/* Booking amount */}
        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Booking amount</div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white mt-1">
            ৳{Math.round(finance.bookingMoneyCollected / 1000)}k
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            {formatBDT(finance.bookingMoneyCollected)}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Total Revenue</div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white mt-1">
            ৳{Math.round(totalRevenue / 1000)}k
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            incl. other {formatBDT(otherTotal)}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-[#0c131a]/90 border border-emerald-500/15 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/30 transition-colors">
          <div className="text-xs text-slate-400 font-medium">Expenses</div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white mt-1">
            ৳{Math.round(totalExpenses / 1000)}k
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            {formatBDT(totalExpenses)}
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
            return (<div key={item.key} onClick={() => {
                    setActiveBarIndex(idx);
                    const foundIdx = months.findIndex(m => m.key === item.key);
                    if (foundIdx !== -1)
                        setSelectedMonthIndex(foundIdx);
                }} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer">
                    <span className={`text-[10px] font-mono font-bold mb-2 transition-colors ${isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
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
                  </div>);
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

            {finance.incomeBySource && finance.incomeBySource.filter(s => !s.source.includes('Turf')).map(src => (
              <div key={src.source} className="py-2.5 flex items-center justify-between">
                <span className="text-slate-300">{src.source}</span>
                <span className="font-mono font-medium text-slate-100">{formatBDT(src.amount)}</span>
              </div>
            ))}

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

    </div>);
}
