'use client';

import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { InvestorRecord } from '@/types';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Percent,
  DollarSign,
  TrendingUp,
  Receipt
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminInvestorsPage() {
  const {
    investors,
    handleSaveInvestors,
    handleRecordPayout,
    calculateMonthlyFinance
  } = useArena();

  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const financeReport = useMemo(() => {
    return calculateMonthlyFinance(selectedMonth);
  }, [calculateMonthlyFinance, selectedMonth]);

  // Total investor share percentage
  const totalInvestorPct = useMemo(() => {
    return investors.reduce((sum, inv) => sum + inv.sharePercentage, 0);
  }, [investors]);

  // Add Investor Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInvName, setNewInvName] = useState('');
  const [newInvPhone, setNewInvPhone] = useState('');
  const [newInvEmail, setNewInvEmail] = useState('');
  const [newInvShare, setNewInvShare] = useState<number>(5);
  const [newInvCapital, setNewInvCapital] = useState<number>(500000);

  // Payout Modal
  const [payoutInvestor, setPayoutInvestor] = useState<InvestorRecord | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<'bkash' | 'nagad' | 'bank_transfer' | 'cash'>('bank_transfer');

  const handleAddInvestorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim() || investors.length >= 10) return;

    const newInv: InvestorRecord = {
      id: `inv-${Date.now()}`,
      name: newInvName.trim(),
      email: newInvEmail.trim() || `${newInvName.toLowerCase().replace(/\s+/g, '')}@investor.com`,
      phone: newInvPhone.trim() || '01711000000',
      sharePercentage: Number(newInvShare),
      capitalInvested: Number(newInvCapital),
      joinedDate: new Date().toISOString().split('T')[0],
      payoutsPaid: 0,
      status: 'active'
    };

    handleSaveInvestors([...investors, newInv]);
    setShowAddModal(false);
    setNewInvName('');
    setNewInvPhone('');
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutInvestor || payoutAmount <= 0) return;

    handleRecordPayout({
      id: `payout-${Date.now()}`,
      investorId: payoutInvestor.id,
      investorName: payoutInvestor.name,
      month: selectedMonth,
      amount: payoutAmount,
      datePaid: new Date().toISOString().split('T')[0],
      paymentMethod: payoutMethod,
      transactionNote: 'Recorded from Admin Investor Portal',
      recordedBy: 'Admin Desk'
    });

    setPayoutInvestor(null);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* MONTH SELECTOR (MATCHING SCREENSHOT 5) */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          type="button"
          onClick={() => setSelectedMonth('2026-09')}
          className="p-1.5 rounded-lg bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-mono font-bold text-sm text-white tracking-widest uppercase">
          {selectedMonth === '2026-10' ? 'OCTOBER 2026' : selectedMonth.toUpperCase()}
        </span>
        <button
          type="button"
          onClick={() => setSelectedMonth('2026-10')}
          className="p-1.5 rounded-lg bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2 KPI CARDS (MATCHING SCREENSHOT 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Investor Share */}
        <div className="p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400">Investor share</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {totalInvestorPct}%
          </div>
          <div className="text-[11px] text-slate-500">
            Owners keep {100 - totalInvestorPct}%
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400">Net profit</div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${
            financeReport.isLossMonth ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {financeReport.isLossMonth ? '-' : ''}৳{Math.abs(financeReport.netProfit).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            {selectedMonth === '2026-10' ? 'October 2026' : selectedMonth}
          </div>
        </div>
      </div>

      {/* INVESTOR CARDS LIST (MATCHING SCREENSHOT 5) */}
      <div className="space-y-3">
        {investors.map(inv => {
          // Expected monthly share based on profit
          const expectedShare = financeReport.netProfit > 0
            ? Math.round((financeReport.netProfit * inv.sharePercentage) / 100)
            : 0;

          return (
            <div
              key={inv.id}
              className="p-4 rounded-2xl bg-[#0c131a] border border-white/5 hover:border-lime-400/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              {/* Left: Avatar & Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-lime-400 text-slate-950 font-black flex items-center justify-center text-sm font-mono shrink-0">
                  I
                </div>

                <div className="min-w-0">
                  <div className="font-bold text-white text-sm truncate">
                    {inv.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {inv.sharePercentage}% · invested ৳{(inv.capitalInvested / 1000).toLocaleString()}k
                  </div>
                </div>
              </div>

              {/* Right: Amounts & Quick Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                <div className="text-right font-mono">
                  <div className="text-white font-bold text-sm">৳{expectedShare.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">paid ৳{inv.payoutsPaid.toLocaleString()}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newP = prompt(`Edit equity share percentage for ${inv.name}:`, String(inv.sharePercentage));
                      if (newP !== null && !isNaN(Number(newP))) {
                        const updated = investors.map(i => i.id === inv.id ? { ...i, sharePercentage: Number(newP) } : i);
                        handleSaveInvestors(updated);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold"
                  >
                    Edit %
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayoutInvestor(inv);
                      setPayoutAmount(expectedShare || 10000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-slate-950 text-[11px] font-bold border border-lime-400/20"
                  >
                    Payout
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* + ADD INVESTOR BUTTON (MATCHING SCREENSHOT 5) */}
      <button
        type="button"
        disabled={investors.length >= 10}
        onClick={() => setShowAddModal(true)}
        className="w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 transition-all cursor-pointer disabled:opacity-50"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>+ Add investor</span>
      </button>

      {/* ADD INVESTOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white font-display">Add Equity Partner</h3>
            <p className="text-xs text-slate-400">Maximum 10 investors allowed (Section 9).</p>

            <form onSubmit={handleAddInvestorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Mahmud"
                  value={newInvName}
                  onChange={e => setNewInvName(e.target.value)}
                  className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="01711223344"
                  value={newInvPhone}
                  onChange={e => setNewInvPhone(e.target.value)}
                  className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Share %</label>
                  <input
                    type="number"
                    step="0.5"
                    max={100 - totalInvestorPct}
                    value={newInvShare}
                    onChange={e => setNewInvShare(Number(e.target.value))}
                    className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Capital (৳)</label>
                  <input
                    type="number"
                    value={newInvCapital}
                    onChange={e => setNewInvCapital(Number(e.target.value))}
                    className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYOUT MODAL */}
      {payoutInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Record Investor Payout</h3>
            <p className="text-xs text-slate-400">
              Partner: <strong className="text-white">{payoutInvestor.name}</strong> ({payoutInvestor.sharePercentage}%)
            </p>

            <form onSubmit={handlePayoutSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Payout Amount (৳)</label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(Number(e.target.value))}
                  className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value as any)}
                  className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"
                >
                  <option value="bank_transfer">Bank Transfer (AC)</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="cash">Cash Voucher</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutInvestor(null)}
                  className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
