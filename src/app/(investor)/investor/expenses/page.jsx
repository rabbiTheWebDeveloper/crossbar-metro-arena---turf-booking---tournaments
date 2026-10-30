'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { ChevronLeft, ChevronRight, Receipt, FileText } from 'lucide-react';

export default function InvestorExpensesPage() {
    const { calculateMonthlyFinance, expenses } = useArena();

    // Rolling 7 months list up to current date
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

    // Default to the current/latest month
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => months.length - 1);
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

    // Live monthly financial calculation from MongoDB
    const finance = useMemo(() => {
        return calculateMonthlyFinance(selectedMonth);
    }, [calculateMonthlyFinance, selectedMonth]);

    const formatBDT = (num) => `৳${Number(num || 0).toLocaleString('en-IN')}`;

    const categoryDisplayName = (cat) => {
        const map = {
            rent: 'Rent',
            salary: 'Staff Salary',
            staff_salary: 'Staff Salary',
            electricity: 'Electricity',
            shop_stock: 'Shop Stock',
            maintenance: 'Maintenance',
            marketing: 'Marketing',
            water: 'Water',
            internet: 'Internet',
            other: 'Other Expenses'
        };
        const key = String(cat || '').toLowerCase();
        return map[key] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'General');
    };

    // Live expenses grouped by category with dynamic bar percentages
    const expensesByCategory = useMemo(() => {
        const rawCategories = finance.expensesByCategory || [];
        if (rawCategories.length === 0) return [];

        const maxCat = Math.max(1, ...rawCategories.map(c => c.amount));
        return rawCategories.map(cat => ({
            name: categoryDisplayName(cat.category),
            amount: formatBDT(cat.amount),
            rawAmount: cat.amount,
            barPercent: Math.min(100, Math.max(8, Math.round((cat.amount / maxCat) * 100)))
        })).sort((a, b) => b.rawAmount - a.rawAmount);
    }, [finance.expensesByCategory]);

    // Live itemized expense vouchers from MongoDB for selected month
    const itemizedExpensesList = useMemo(() => {
        return (expenses || [])
            .filter(e => e.date && e.date.startsWith(selectedMonth))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(e => {
                let formattedDate = e.date;
                try {
                    const d = new Date(e.date);
                    formattedDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                } catch {
                    // keep raw date
                }
                const detailStr = `${formattedDate} · ${e.title}${e.receiptNote ? ` (${e.receiptNote})` : ''}`;
                return {
                    id: e.id || e._id,
                    category: categoryDisplayName(e.category),
                    detail: detailStr,
                    amount: formatBDT(e.amount),
                };
            });
    }, [expenses, selectedMonth]);

    return (
        <div className="w-full max-w-2xl space-y-5 sm:space-y-6">
            {/* Month Selector Bar with Main Site Colors */}
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

            {/* Card 1: BY CATEGORY with horizontal emerald bars */}
            <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-500/10">
                    <span className="text-xs font-black tracking-wider text-white uppercase font-sans">
                        BY CATEGORY
                    </span>
                    <span className="text-xs font-mono font-black text-rose-400">
                        {formatBDT(finance.totalExpenses)}
                    </span>
                </div>

                {expensesByCategory.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 font-mono">
                        No recorded expenses for {currentMonthObj.label}
                    </div>
                ) : (
                    <div className="space-y-3.5 pt-1">
                        {expensesByCategory.map(cat => (
                            <div key={cat.name} className="flex items-center gap-2.5 sm:gap-4 text-xs font-sans">
                                {/* Category Label */}
                                <span className="w-24 sm:w-28 shrink-0 text-slate-300 font-medium truncate">
                                    {cat.name}
                                </span>

                                {/* Horizontal Emerald Bar */}
                                <div className="flex-1 h-1.5 flex items-center bg-white/[0.04] rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${cat.barPercent}%` }}
                                        className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300 shadow-xs shadow-emerald-400/20"
                                    />
                                </div>

                                {/* Category Amount */}
                                <span className="w-20 sm:w-24 shrink-0 text-right font-mono font-medium text-white">
                                    {cat.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Card 2: Itemized Invoices List from Live Database */}
            <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-7 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-1">
                    <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-black tracking-wider text-white uppercase">
                            ITEMIZED VOUCHERS &amp; RECEIPTS
                        </span>
                    </div>
                    <span className="text-[12px] font-mono text-slate-400">
                        {itemizedExpensesList.length} entry{itemizedExpensesList.length === 1 ? '' : 'ies'}
                    </span>
                </div>

                {itemizedExpensesList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 font-mono">
                        No itemized vouchers recorded for {currentMonthObj.label}
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {itemizedExpensesList.map(item => (
                            <div key={item.id} className="py-3.5 sm:py-4 first:pt-2 last:pb-0 flex items-center justify-between text-xs gap-3">
                                <div className="min-w-0">
                                    <div className="font-bold text-white text-xs truncate">{item.category}</div>
                                    <div className="text-[12px] text-slate-400 mt-0.5 truncate">{item.detail}</div>
                                </div>
                                <div className="font-mono text-white font-bold text-xs shrink-0">
                                    {item.amount}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

