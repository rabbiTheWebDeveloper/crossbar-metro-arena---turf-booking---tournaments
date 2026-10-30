'use client';
import React, { useState, useMemo } from 'react';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { formatMoney, formatDate, buildMonthList, expenseCategoryLabel } from '@/data/finance';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export default function InvestorExpensesPage() {
    const { calculateMonthlyFinance, expenses, isLoadingData } = useArena();

    const months = useMemo(() => buildMonthList(todayDhaka().slice(0, 7), 7), []);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => months.length - 1);
    const currentMonthObj = months[selectedMonthIndex] || months[months.length - 1];
    const selectedMonth = currentMonthObj.key;

    const handlePrevMonth = () => { if (selectedMonthIndex > 0) setSelectedMonthIndex(prev => prev - 1); };
    const handleNextMonth = () => { if (selectedMonthIndex < months.length - 1) setSelectedMonthIndex(prev => prev + 1); };

    const finance = useMemo(() => calculateMonthlyFinance(selectedMonth), [calculateMonthlyFinance, selectedMonth]);

    const expensesByCategory = useMemo(() => {
        const raw = finance.expensesByCategory || [];
        if (raw.length === 0) return [];
        const maxCat = Math.max(1, ...raw.map(c => c.amount));
        return raw
            .map(cat => ({
                key: cat.category,
                name: expenseCategoryLabel(cat.category),
                rawAmount: cat.amount,
                barPercent: Math.min(100, Math.max(8, Math.round((cat.amount / maxCat) * 100)))
            }))
            .sort((a, b) => b.rawAmount - a.rawAmount);
    }, [finance.expensesByCategory]);

    const itemizedExpensesList = useMemo(() => (expenses || [])
        .filter(e => e.date && String(e.date).startsWith(selectedMonth))
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .map(e => ({
            id: e.id,
            category: expenseCategoryLabel(e.category),
            date: formatDate(e.date),
            title: e.title,
            receiptNote: e.receiptNote || '',
            amount: Number(e.amount) || 0
        })), [expenses, selectedMonth]);

    const entryCount = itemizedExpensesList.length;
    const showSkeleton = isLoadingData && expenses.length === 0;

    return (
        <div className="w-full max-w-2xl space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between py-1 max-w-md">
                <button onClick={handlePrevMonth} disabled={selectedMonthIndex === 0} className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer" aria-label="Previous month">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-black tracking-widest font-mono text-white select-none">
                    {currentMonthObj.label}
                </span>
                <button onClick={handleNextMonth} disabled={selectedMonthIndex === months.length - 1} className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer" aria-label="Next month">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* By category */}
            <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-500/10">
                    <span className="text-xs font-black tracking-wider text-white uppercase font-sans">BY CATEGORY</span>
                    <span className="text-xs font-mono font-black text-rose-400">{formatMoney(finance.totalExpenses)}</span>
                </div>

                {showSkeleton ? (
                    <div className="space-y-3 pt-1" aria-busy="true">
                        {[1, 2, 3].map(n => <div key={n} className="h-5 rounded bg-white/5 animate-pulse"/>)}
                    </div>
                ) : expensesByCategory.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 font-mono">
                        No recorded expenses for {currentMonthObj.label}
                    </div>
                ) : (
                    <div className="space-y-3.5 pt-1">
                        {expensesByCategory.map(cat => (
                            <div key={cat.key} className="flex items-center gap-2.5 sm:gap-4 text-xs font-sans">
                                <span className="w-24 sm:w-32 shrink-0 text-slate-300 font-medium truncate" title={cat.name}>{cat.name}</span>
                                <div className="flex-1 h-1.5 flex items-center bg-white/[0.04] rounded-full overflow-hidden">
                                    <div style={{ width: `${cat.barPercent}%` }} className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300 shadow-xs shadow-emerald-400/20" />
                                </div>
                                <span className="w-20 sm:w-24 shrink-0 text-right font-mono font-medium text-white">{formatMoney(cat.rawAmount)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Itemized list */}
            <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-7 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-1">
                    <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-black tracking-wider text-white uppercase">ITEMIZED VOUCHERS &amp; RECEIPTS</span>
                    </div>
                    <span className="text-[12px] font-mono text-slate-400">
                        {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                    </span>
                </div>

                {showSkeleton ? (
                    <div className="space-y-3 pt-3" aria-busy="true">
                        {[1, 2, 3, 4].map(n => <div key={n} className="h-10 rounded-xl bg-white/5 animate-pulse"/>)}
                    </div>
                ) : itemizedExpensesList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 font-mono">
                        No itemized vouchers recorded for {currentMonthObj.label}
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {itemizedExpensesList.map(item => (
                            <div key={item.id} className="py-3.5 sm:py-4 first:pt-2 last:pb-0 flex items-center justify-between text-xs gap-3">
                                <div className="min-w-0">
                                    <div className="font-bold text-white text-xs truncate">{item.title}</div>
                                    <div className="text-[12px] text-slate-400 mt-0.5 truncate">
                                        {item.date} · {item.category}
                                    </div>
                                    {item.receiptNote && (
                                        <div className="text-[11px] text-slate-500 mt-0.5 truncate font-mono">Receipt: {item.receiptNote}</div>
                                    )}
                                </div>
                                <div className="font-mono text-white font-bold text-xs shrink-0">{formatMoney(item.amount)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
