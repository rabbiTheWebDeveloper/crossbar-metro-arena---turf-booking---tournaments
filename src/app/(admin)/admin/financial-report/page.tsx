'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useArena } from '@/context/ArenaContext';
import { ExpenseRecord, OtherIncomeRecord } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Calendar,
  Users,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminFinancialReportPage() {
  const {
    calculateMonthlyFinance,
    expenses,
    handleAddExpense,
    handleDeleteExpense,
    handleAddOtherIncome
  } = useArena();

  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const financeReport = useMemo(() => {
    return calculateMonthlyFinance(selectedMonth);
  }, [calculateMonthlyFinance, selectedMonth]);

  // Add Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState<ExpenseRecord['category']>('turf_maintenance');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState('2026-10-10');

  // Add Income Modal
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incSource, setIncSource] = useState<OtherIncomeRecord['source']>('shop_sales');
  const [incTitle, setIncTitle] = useState('');
  const [incAmount, setIncAmount] = useState<number>(0);
  const [incDate, setIncDate] = useState('2026-10-10');

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;

    handleAddExpense({
      id: `exp-${Date.now()}`,
      category: expCategory,
      title: expTitle,
      amount: Number(expAmount),
      date: expDate,
      recordedBy: 'Admin Desk'
    });

    setShowExpenseModal(false);
    setExpTitle('');
    setExpAmount(0);
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle || !incAmount) return;

    handleAddOtherIncome({
      id: `inc-${Date.now()}`,
      source: incSource,
      title: incTitle,
      amount: Number(incAmount),
      date: incDate,
      recordedBy: 'Admin Desk'
    });

    setShowIncomeModal(false);
    setIncTitle('');
    setIncAmount(0);
  };

  // 6 Popular Slots Bar calculation
  const popularSlots = [
    { time: '6AM', count: 4 },
    { time: '7:30AM', count: 8 },
    { time: '9AM', count: 5 },
    { time: '10:30AM', count: 3 },
    { time: '12PM', count: 6 },
    { time: '1:30PM', count: 7 },
    { time: '3PM', count: 12 },
    { time: '4:30PM', count: 18 },
    { time: '6PM', count: 24 },
    { time: '7:30PM', count: 28 },
    { time: '9PM', count: 26 },
    { time: '10:30PM', count: 22 }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* 4 TOP KPI METRIC CARDS (MATCHING SCREENSHOT 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Total Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[11px] text-slate-400">Total revenue</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            ৳{financeReport.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            Bookings ৳{financeReport.bookingMoneyCollected.toLocaleString()} + other ৳{financeReport.otherIncomeTotal.toLocaleString()}
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[11px] text-slate-400">Total expenses</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            ৳{financeReport.totalExpenses.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Rent, staff, utilities &amp; maintenance
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[11px] text-slate-400">Net profit</div>
          <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
            financeReport.isLossMonth ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {financeReport.isLossMonth ? '-' : ''}৳{Math.abs(financeReport.netProfit).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {financeReport.profitMargin.toFixed(0)}% margin
          </div>
        </div>

        {/* Slots Booked */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[11px] text-slate-400">Slots booked</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            {financeReport.slotsBooked}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {financeReport.occupancyRate.toFixed(0)}% occupancy · {financeReport.cancellationsCount} cancelled
          </div>
        </div>

      </div>

      {/* TWO CHARTS ROW (MATCHING SCREENSHOT 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 1: Money collected per day */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Money collected per day
            </h3>
            <p className="text-[10px] text-slate-500">Tap a bar to see the value</p>
          </div>

          <div className="h-32 flex items-end gap-1 pt-4">
            {financeReport.dailyBreakdown.slice(0, 31).map((d, i) => {
              const maxAmount = 25000;
              const heightPct = Math.min(100, Math.max(8, (d.moneyCollected / maxAmount) * 100));

              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-lime-400 hover:brightness-125 rounded-t-sm transition-all cursor-pointer"
                  />
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 border border-white/10 text-white text-[9px] font-mono py-1 px-1.5 rounded pointer-events-none z-10 whitespace-nowrap shadow-lg">
                    {d.date.slice(8)} Oct: ৳{d.moneyCollected.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-white/5">
            <span>1</span>
            <span>5</span>
            <span>11</span>
            <span>16</span>
            <span>21</span>
            <span>26</span>
            <span>31</span>
          </div>
        </div>

        {/* Chart 2: Most popular slots */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Most popular slots
            </h3>
            <p className="text-[10px] text-slate-500">Tap a bar to see the value</p>
          </div>

          <div className="h-32 flex items-end gap-1.5 pt-4">
            {popularSlots.map(s => {
              const heightPct = Math.min(100, Math.max(10, (s.count / 28) * 100));

              return (
                <div
                  key={s.time}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-lime-400 hover:brightness-125 rounded-t-sm transition-all cursor-pointer"
                  />
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 border border-white/10 text-white text-[9px] font-mono py-1 px-1.5 rounded pointer-events-none z-10 whitespace-nowrap shadow-lg">
                    {s.time}: {s.count} matches
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[8px] font-mono text-slate-500 pt-1 border-t border-white/5 overflow-x-auto">
            {popularSlots.map(s => (
              <span key={s.time}>{s.time}</span>
            ))}
          </div>
        </div>

      </div>

      {/* EXPENSES BY CATEGORY & INCOME SOURCES (MATCHING SCREENSHOT 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Expenses by Category */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              EXPENSES BY CATEGORY
            </h3>
            <button
              type="button"
              onClick={() => setShowExpenseModal(true)}
              className="px-3 py-1 rounded-xl bg-lime-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-lime-300 transition-colors"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Add expense</span>
            </button>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Rent', amount: 120000, pct: 47 },
              { label: 'Staff Salary', amount: 96000, pct: 37 },
              { label: 'Electricity', amount: 38618, pct: 15 }
            ].map(cat => (
              <div key={cat.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{cat.label}</span>
                  <span className="font-mono text-white font-bold">৳{cat.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div style={{ width: `${cat.pct}%` }} className="h-full bg-lime-400 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Income Sources */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              INCOME SOURCES
            </h3>
            <button
              type="button"
              onClick={() => setShowIncomeModal(true)}
              className="px-3 py-1 rounded-xl bg-white/10 text-white font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-white/20 transition-colors"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Add income</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Bookings · Cash', amount: 139400, pct: 71 },
              { label: 'Bookings · bkash', amount: 23000, pct: 12 },
              { label: 'Shop Sales', amount: 15651, pct: 8 },
              { label: 'Bookings · Nagad', amount: 9500, pct: 5 },
              { label: 'Bookings · Card', amount: 7500, pct: 4 }
            ].map(source => (
              <div key={source.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{source.label}</span>
                  <span className="font-mono text-white font-bold">৳{source.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div style={{ width: `${source.pct}%` }} className="h-full bg-lime-400 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* PROFIT DISTRIBUTION & EXPENSE ENTRIES (MATCHING SCREENSHOT 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Profit Distribution */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              PROFIT DISTRIBUTION
            </h3>
            <Link href="/admin/investors" className="text-xs text-lime-400 hover:underline">
              Manage investors
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-500 uppercase border-b border-white/5">
                <tr>
                  <th className="pb-2">Investor</th>
                  <th className="pb-2">Share</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Paid</th>
                  <th className="pb-2">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 font-sans font-medium text-slate-300">Investor One</td>
                  <td className="py-2.5 text-slate-400">12%</td>
                  <td className="py-2.5 text-slate-400">৳0</td>
                  <td className="py-2.5 text-slate-400">৳0</td>
                  <td className="py-2.5 text-slate-400">৳0</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-sans font-medium text-slate-300">Investor Two</td>
                  <td className="py-2.5 text-slate-400">8%</td>
                  <td className="py-2.5 text-slate-400">৳0</td>
                  <td className="py-2.5 text-slate-400">৳0</td>
                  <td className="py-2.5 text-slate-400">৳0</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-sans font-medium text-slate-300">Investor Three</td>
                  <td className="py-2.5 text-slate-400">5%</td>
                  <td className="py-2.5 text-slate-400">৳0</td>
                  <td className="py-2.5 text-slate-400">৳0</td>
                  <td className="py-2.5 text-slate-400">৳0</td>
                </tr>
                <tr className="font-bold text-white">
                  <td className="py-2.5 font-sans">Owners / retained</td>
                  <td className="py-2.5">75%</td>
                  <td className="py-2.5">৳0</td>
                  <td className="py-2.5"></td>
                  <td className="py-2.5"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-amber-400">
            This month shows a loss so far, so there is no profit to share yet.
          </div>
        </div>

        {/* Expense entries */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Expense entries
          </h3>

          <div className="space-y-2">
            {expenses.slice(0, 4).map(e => (
              <div
                key={e.id}
                className="p-3 rounded-2xl bg-[#080d12] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{e.title}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {e.date} · {e.category.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-white">
                    ৳{e.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(e.id)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* DAILY BREAKDOWN TABLE (MATCHING SCREENSHOT 4) */}
      <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Daily breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-slate-500 uppercase border-b border-white/5">
              <tr>
                <th className="py-2">DATE</th>
                <th className="py-2 text-center">BOOKINGS</th>
                <th className="py-2 text-right">COLLECTED</th>
                <th className="py-2 text-right">EXPENSES</th>
                <th className="py-2 text-right">NET</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {financeReport.dailyBreakdown.slice(0, 15).map(day => (
                <tr key={day.date} className="hover:bg-white/[0.02]">
                  <td className="py-2 font-sans text-slate-300">{day.date}</td>
                  <td className="py-2 text-center text-slate-400">{day.slotsBooked}</td>
                  <td className="py-2 text-right text-emerald-400">৳{day.moneyCollected.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-400">৳{day.expenses.toLocaleString()}</td>
                  <td className={`py-2 text-right font-bold ${day.net < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {day.net < 0 ? '-' : ''}৳{Math.abs(day.net).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Add Expense Record</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Floodlights Generator Fuel"
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as any)}
                    className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="turf_maintenance">Maintenance</option>
                    <option value="floodlight_electricity">Electricity</option>
                    <option value="staff_wages">Staff Wages</option>
                    <option value="rent">Rent Lease</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={e => setExpAmount(Number(e.target.value))}
                    className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD INCOME MODAL */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Record Income</h3>
            <form onSubmit={handleIncomeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Income Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Grip Socks Sales"
                  value={incTitle}
                  onChange={e => setIncTitle(e.target.value)}
                  className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Source</label>
                  <select
                    value={incSource}
                    onChange={e => setIncSource(e.target.value as any)}
                    className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="shop_sales">Shop Sales</option>
                    <option value="event_fees">Event Fees</option>
                    <option value="sponsorship">Sponsorship</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    required
                    value={incAmount}
                    onChange={e => setIncAmount(Number(e.target.value))}
                    className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl"
                >
                  Save Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
