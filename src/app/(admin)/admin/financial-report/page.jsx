'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { formatMoney, formatDate, formatMonth, shiftMonth, EXPENSE_CATEGORIES, INCOME_SOURCES, expenseCategoryLabel, slotShortLabel } from '@/data/finance';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default function AdminFinancialReportPage() {
    const { calculateMonthlyFinance, expenses, isLoadingData, handleAddExpense, handleDeleteExpense, handleAddOtherIncome } = useArena();
    const [selectedMonth, setSelectedMonth] = useState(() => todayDhaka().slice(0, 7));
    const financeReport = useMemo(() => calculateMonthlyFinance(selectedMonth), [calculateMonthlyFinance, selectedMonth]);

    // Add Expense modal
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expForm, setExpForm] = useState({ title: '', category: EXPENSE_CATEGORIES[0].key, amount: '', date: todayDhaka(), receiptNote: '' });
    const [expError, setExpError] = useState('');
    const [isSavingExpense, setIsSavingExpense] = useState(false);

    // Add Income modal
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [incForm, setIncForm] = useState({ title: '', source: INCOME_SOURCES[0].key, amount: '', date: todayDhaka(), notes: '' });
    const [incError, setIncError] = useState('');
    const [isSavingIncome, setIsSavingIncome] = useState(false);

    const [deletingId, setDeletingId] = useState(null);
    const [showAllExpenses, setShowAllExpenses] = useState(false);

    const openExpenseModal = () => {
        setExpError('');
        setExpForm({ title: '', category: EXPENSE_CATEGORIES[0].key, amount: '', date: selectedMonth === todayDhaka().slice(0, 7) ? todayDhaka() : `${selectedMonth}-01`, receiptNote: '' });
        setShowExpenseModal(true);
    };
    const openIncomeModal = () => {
        setIncError('');
        setIncForm({ title: '', source: INCOME_SOURCES[0].key, amount: '', date: selectedMonth === todayDhaka().slice(0, 7) ? todayDhaka() : `${selectedMonth}-01`, notes: '' });
        setShowIncomeModal(true);
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        setExpError('');
        const amount = Number(expForm.amount);
        if (!expForm.title.trim() || !amount || amount <= 0 || !expForm.date) { setExpError('Title, a positive amount and a date are required.'); return; }
        setIsSavingExpense(true);
        const result = await handleAddExpense({ title: expForm.title.trim(), category: expForm.category, amount, date: expForm.date, receiptNote: expForm.receiptNote.trim() });
        setIsSavingExpense(false);
        if (!result.ok) { setExpError(result.error || 'Could not save the expense.'); return; }
        setShowExpenseModal(false);
    };

    const handleIncomeSubmit = async (e) => {
        e.preventDefault();
        setIncError('');
        const amount = Number(incForm.amount);
        if (!incForm.title.trim() || !amount || amount <= 0 || !incForm.date) { setIncError('Description, a positive amount and a date are required.'); return; }
        setIsSavingIncome(true);
        const result = await handleAddOtherIncome({ source: incForm.source, title: incForm.title.trim(), amount, date: incForm.date, notes: incForm.notes.trim() });
        setIsSavingIncome(false);
        if (!result.ok) { setIncError(result.error || 'Could not record the income.'); return; }
        setShowIncomeModal(false);
    };

    const handleDelete = async (expense) => {
        if (!confirm(`Delete "${expense.title}" (${formatMoney(expense.amount)})?`)) return;
        setDeletingId(expense.id);
        await handleDeleteExpense(expense.id);
        setDeletingId(null);
    };

    const monthExpenses = useMemo(() => {
        const list = showAllExpenses ? expenses : expenses.filter(e => String(e.date || '').startsWith(selectedMonth));
        return [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    }, [expenses, selectedMonth, showAllExpenses]);

    const popularSlots = useMemo(() => (financeReport.popularSlotsRanking || [])
        .slice()
        .sort((a, b) => a.slotNumber - b.slotNumber)
        .map(s => ({ slotNumber: s.slotNumber, time: slotShortLabel(s.displayTime, s.slotNumber), full: s.displayTime || `Slot ${s.slotNumber}`, count: s.count })), [financeReport.popularSlotsRanking]);

    const maxDailyMoney = useMemo(() => Math.max(1, ...financeReport.dailyBreakdown.map(d => d.moneyCollected)), [financeReport.dailyBreakdown]);
    const maxSlotCount = useMemo(() => Math.max(1, ...popularSlots.map(s => s.count)), [popularSlots]);
    const dayCount = financeReport.dailyBreakdown.length;
    const axisDays = useMemo(() => {
        const days = [1, 6, 11, 16, 21, 26].filter(d => d < dayCount);
        if (dayCount > 0) days.push(dayCount);
        return days.map(d => ({ day: d, left: dayCount > 1 ? ((d - 1) / (dayCount - 1)) * 100 : 0 }));
    }, [dayCount]);

    const retainedPct = Math.max(0, 100 - (financeReport.investorShares || []).reduce((sum, i) => sum + i.percentage, 0));
    const inputCls = 'w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white';

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* MONTH SELECTOR */}
      <div className="flex items-center justify-center gap-4 py-1">
        <button type="button" onClick={() => setSelectedMonth(m => shiftMonth(m, -1))} className="p-1.5 rounded-lg bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white cursor-pointer" aria-label="Previous month">
          <ChevronLeft className="w-4 h-4"/>
        </button>
        <span className="font-mono font-bold text-sm text-white tracking-widest uppercase">{formatMonth(selectedMonth)}</span>
        <button type="button" onClick={() => setSelectedMonth(m => shiftMonth(m, 1))} className="p-1.5 rounded-lg bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white cursor-pointer" aria-label="Next month">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>

      {isLoadingData && expenses.length === 0 && financeReport.totalRevenue === 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" aria-busy="true">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-24 rounded-2xl bg-[#0c131a] border border-white/5 animate-pulse"/>)}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[12px] text-slate-400">Total revenue</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">{formatMoney(financeReport.totalRevenue)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            Bookings {formatMoney(financeReport.bookingMoneyCollected)} + other {formatMoney(financeReport.otherIncomeTotal)}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[12px] text-slate-400">Total expenses</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">{formatMoney(financeReport.totalExpenses)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {financeReport.expensesByCategory.length} categor{financeReport.expensesByCategory.length === 1 ? 'y' : 'ies'} · refunds paid {formatMoney(financeReport.refundsAmount)}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[12px] text-slate-400">Net profit</div>
          <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${financeReport.isLossMonth ? 'text-rose-400' : 'text-emerald-400'}`}>
            {financeReport.netProfit < 0 ? '-' : ''}{formatMoney(Math.abs(financeReport.netProfit))}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{financeReport.profitMargin.toFixed(1)}% margin</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[12px] text-slate-400">Slots booked</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">{financeReport.slotsBooked}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {financeReport.occupancyRate.toFixed(1)}% occupancy · {financeReport.cancellationsCount} cancelled (advance {formatMoney(financeReport.cancellationsAmount)})
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Money collected per day</h3>
            <p className="text-[11px] text-slate-500">Hover a bar to see the value · peak {formatMoney(maxDailyMoney)}</p>
          </div>

          <div className="h-32 flex items-end gap-1 pt-4">
            {financeReport.dailyBreakdown.map(d => {
              const heightPct = d.moneyCollected > 0 ? Math.min(100, Math.max(6, (d.moneyCollected / maxDailyMoney) * 100)) : 2;
              return (<div key={d.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div style={{ height: `${heightPct}%` }} className={`w-full rounded-t-sm transition-all cursor-pointer ${d.moneyCollected > 0 ? 'bg-lime-400 hover:brightness-125' : 'bg-slate-800/70'}`}/>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 border border-white/10 text-white text-[10px] font-mono py-1 px-1.5 rounded pointer-events-none z-10 whitespace-nowrap shadow-lg">
                    {formatDate(d.date)}: {formatMoney(d.moneyCollected)}
                  </div>
                </div>);
            })}
          </div>

          <div className="relative h-4 text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
            {axisDays.map(a => <span key={a.day} style={{ left: `${a.left}%` }} className="absolute -translate-x-1/2">{a.day}</span>)}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Most popular slots</h3>
            <p className="text-[11px] text-slate-500">Bookings per slot · peak {maxSlotCount}</p>
          </div>

          <div className="h-32 flex items-end gap-1.5 pt-4">
            {popularSlots.map(s => {
              const heightPct = s.count > 0 ? Math.min(100, Math.max(8, (s.count / maxSlotCount) * 100)) : 2;
              return (<div key={s.slotNumber} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div style={{ height: `${heightPct}%` }} className={`w-full rounded-t-sm transition-all cursor-pointer ${s.count > 0 ? 'bg-lime-400 hover:brightness-125' : 'bg-slate-800/70'}`}/>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 border border-white/10 text-white text-[10px] font-mono py-1 px-1.5 rounded pointer-events-none z-10 whitespace-nowrap shadow-lg">
                    {s.full}: {s.count} booking{s.count === 1 ? '' : 's'}
                  </div>
                </div>);
            })}
          </div>

          <div className="flex justify-between gap-1 text-[8px] font-mono text-slate-500 pt-1 border-t border-white/5 overflow-x-auto">
            {popularSlots.map(s => (<span key={s.slotNumber} className="flex-1 text-center whitespace-nowrap">{s.time}</span>))}
          </div>
        </div>

      </div>

      {/* EXPENSES BY CATEGORY & INCOME SOURCES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">EXPENSES BY CATEGORY</h3>
            <button type="button" onClick={openExpenseModal} className="px-3 py-1 rounded-xl bg-lime-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-lime-300 transition-colors">
              <Plus className="w-3 h-3 stroke-[3]"/>
              <span>Add expense</span>
            </button>
          </div>

          <div className="space-y-3">
            {financeReport.expensesByCategory.length > 0 ? (
              [...financeReport.expensesByCategory].sort((a, b) => b.amount - a.amount).map(cat => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{expenseCategoryLabel(cat.category)}</span>
                    <span className="font-mono text-white font-bold">{formatMoney(cat.amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div style={{ width: `${Math.min(100, Math.max(4, cat.percentage))}%` }} className="h-full bg-lime-400 rounded-full"/>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs py-2">No expenses logged for {formatMonth(selectedMonth)}.</div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">INCOME SOURCES</h3>
            <button type="button" onClick={openIncomeModal} className="px-3 py-1 rounded-xl bg-white/10 text-white font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-white/20 transition-colors">
              <Plus className="w-3 h-3 stroke-[3]"/>
              <span>Add income</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {financeReport.totalRevenue > 0 ? (
              financeReport.incomeBySource.map(source => (
                <div key={source.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{source.source}</span>
                    <span className="font-mono text-white font-bold">{formatMoney(source.amount)} <span className="text-slate-500 font-normal">({source.percentage.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div style={{ width: `${Math.min(100, Math.max(source.amount > 0 ? 4 : 0, source.percentage))}%` }} className="h-full bg-lime-400 rounded-full"/>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs py-2">No revenue logged yet for {formatMonth(selectedMonth)}.</div>
            )}
          </div>
        </div>

      </div>

      {/* PROFIT DISTRIBUTION & EXPENSE ENTRIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">PROFIT DISTRIBUTION</h3>
            <Link href="/admin/investors" className="text-xs text-lime-400 hover:underline">Manage investors</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-500 uppercase border-b border-white/5">
                <tr>
                  <th className="pb-2">Investor</th>
                  <th className="pb-2">Share</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Paid</th>
                  <th className="pb-2">Balance</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[12px]">
                {(financeReport.investorShares || []).length === 0 && (
                  <tr><td colSpan={6} className="py-3 font-sans text-slate-500">No active partners.</td></tr>
                )}
                {(financeReport.investorShares || []).map(item => (
                  <tr key={item.investor.id}>
                    <td className="py-2.5 font-sans font-medium text-slate-300">{item.investor.name}</td>
                    <td className="py-2.5 text-slate-400">{item.percentage}%</td>
                    <td className="py-2.5 text-slate-300 font-bold">{formatMoney(item.shareAmount)}</td>
                    <td className="py-2.5 text-emerald-400">{formatMoney(item.paidAmount)}</td>
                    <td className={`py-2.5 ${item.balance > 0 ? 'text-amber-300' : 'text-slate-400'}`}>{formatMoney(item.balance)}</td>
                    <td className="py-2.5">
                      {item.shareAmount === 0
                        ? <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-400">no share</span>
                        : item.isPaid
                          ? <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">paid</span>
                          : <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400/20 text-amber-300">owed</span>}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold text-white">
                  <td className="py-2.5 font-sans">Owners / retained</td>
                  <td className="py-2.5">{retainedPct}%</td>
                  <td className={`py-2.5 ${financeReport.ownersShare < 0 ? 'text-rose-400' : 'text-lime-400'}`}>{financeReport.ownersShare < 0 ? '-' : ''}{formatMoney(Math.abs(financeReport.ownersShare))}</td>
                  <td className="py-2.5" colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-[12px] text-amber-400">
            {financeReport.isLossMonth
              ? 'This month shows a loss or breakeven so far, so there is no net dividend to distribute.'
              : 'Net dividends are split according to each active partner\'s equity percentage; the remainder is retained by the owners.'}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Expense entries</h3>
            <button type="button" onClick={() => setShowAllExpenses(v => !v)} className="text-[11px] text-lime-400 hover:underline cursor-pointer">
              {showAllExpenses ? `Only ${formatMonth(selectedMonth, { month: 'short', year: 'numeric' })}` : 'Show all'}
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {monthExpenses.length === 0 ? (
              <div className="text-slate-500 text-xs py-2">{showAllExpenses ? 'No expenses recorded yet.' : `No expenses recorded for ${formatMonth(selectedMonth)}.`}</div>
            ) : monthExpenses.map(e => (<div key={e.id} className="p-3 rounded-2xl bg-[#080d12] border border-white/5 flex items-center justify-between text-xs gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{e.title}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                    {formatDate(e.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {expenseCategoryLabel(e.category)}{e.receiptNote ? ` · ${e.receiptNote}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-white">{formatMoney(e.amount)}</span>
                  <button type="button" disabled={deletingId === e.id} onClick={() => handleDelete(e)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer disabled:opacity-40" aria-label={`Delete ${e.title}`}>
                    ✕
                  </button>
                </div>
              </div>))}
          </div>
        </div>

      </div>

      {/* DAILY BREAKDOWN TABLE */}
      <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Daily breakdown · {formatMonth(selectedMonth)}</h3>

        <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-500 uppercase border-b border-white/5 sticky top-0 bg-[#0c131a]">
              <tr>
                <th className="py-2">DATE</th>
                <th className="py-2 text-center">BOOKINGS</th>
                <th className="py-2 text-right">COLLECTED</th>
                <th className="py-2 text-right">EXPENSES</th>
                <th className="py-2 text-right">NET</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[12px]">
              {financeReport.dailyBreakdown.map(day => (<tr key={day.date} className={`hover:bg-white/[0.02] ${day.slotsBooked === 0 && day.moneyCollected === 0 && day.expenses === 0 ? 'text-slate-600' : ''}`}>
                  <td className="py-2 font-sans text-slate-300">{formatDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="py-2 text-center text-slate-400">{day.slotsBooked}</td>
                  <td className="py-2 text-right text-emerald-400">{formatMoney(day.moneyCollected)}</td>
                  <td className="py-2 text-right text-slate-400">{formatMoney(day.expenses)}</td>
                  <td className={`py-2 text-right font-bold ${day.net < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {day.net < 0 ? '-' : ''}{formatMoney(Math.abs(day.net))}
                  </td>
                </tr>))}
            </tbody>
            <tfoot className="font-mono text-[12px] font-bold text-white border-t border-white/10">
              <tr>
                <td className="py-2 font-sans">Month total</td>
                <td className="py-2 text-center">{financeReport.slotsBooked}</td>
                <td className="py-2 text-right text-emerald-400">{formatMoney(financeReport.dailyBreakdown.reduce((s, d) => s + d.moneyCollected, 0))}</td>
                <td className="py-2 text-right">{formatMoney(financeReport.totalExpenses)}</td>
                <td className={`py-2 text-right ${financeReport.netProfit < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{financeReport.netProfit < 0 ? '-' : ''}{formatMoney(Math.abs(financeReport.netProfit))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-[11px] text-slate-500">Collected shows booking cash by the day it was paid (before refunds); month net also includes other income and completed refunds.</p>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showExpenseModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Add Expense Record</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Expense title *</label>
                <input type="text" required placeholder="e.g. Floodlight generator fuel" value={expForm.title} onChange={e => setExpForm(f => ({ ...f, title: e.target.value }))} className={inputCls}/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Amount (৳) *</label>
                  <input type="number" required min={1} value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Date *</label>
                  <input type="date" required value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Receipt / voucher no.</label>
                  <input type="text" value={expForm.receiptNote} onChange={e => setExpForm(f => ({ ...f, receiptNote: e.target.value }))} className={inputCls}/>
                </div>
              </div>

              {expError && <p className="text-rose-400 text-[12px]">{expError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" disabled={isSavingExpense} onClick={() => setShowExpenseModal(false)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSavingExpense} className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isSavingExpense ? 'Saving…' : 'Save expense'}</button>
              </div>
            </form>
          </div>
        </div>)}

      {/* ADD INCOME MODAL */}
      {showIncomeModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Record Income</h3>
            <form onSubmit={handleIncomeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Income description *</label>
                <input type="text" required placeholder="e.g. Counter grip socks sales" value={incForm.title} onChange={e => setIncForm(f => ({ ...f, title: e.target.value }))} className={inputCls}/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Source</label>
                  <select value={incForm.source} onChange={e => setIncForm(f => ({ ...f, source: e.target.value }))} className={inputCls}>
                    {INCOME_SOURCES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Amount (৳) *</label>
                  <input type="number" required min={1} value={incForm.amount} onChange={e => setIncForm(f => ({ ...f, amount: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Date *</label>
                  <input type="date" required value={incForm.date} onChange={e => setIncForm(f => ({ ...f, date: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Notes</label>
                  <input type="text" value={incForm.notes} onChange={e => setIncForm(f => ({ ...f, notes: e.target.value }))} className={inputCls}/>
                </div>
              </div>

              {incError && <p className="text-rose-400 text-[12px]">{incError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" disabled={isSavingIncome} onClick={() => setShowIncomeModal(false)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSavingIncome} className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isSavingIncome ? 'Saving…' : 'Save income'}</button>
              </div>
            </form>
          </div>
        </div>)}

    </div>);
}
