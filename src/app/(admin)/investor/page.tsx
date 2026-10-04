'use client';

import React, { useState } from 'react';
import { useArena } from '../../../context/ArenaContext';
import { PageHero } from '../../../components/PageHero';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowUpRight,
  UserCheck,
  Receipt,
  AlertTriangle,
  FileText,
  Download,
  Percent,
  CheckCircle2
} from 'lucide-react';

export default function InvestorDashboard() {
  const {
    bookings,
    expenses,
    investors,
    grossRevenue,
    totalExpenses,
    netProfit,
    isLossMonth
  } = useArena();

  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(investors[0]?.id || '');

  const activeInvestor = investors.find(i => i.id === selectedInvestorId) || investors[0];

  // Investor payout formula:
  // Net profit = Gross Income - Expenses
  // In a loss month (netProfit <= 0), payout is strictly 0.
  const investorPayout = isLossMonth || !activeInvestor
    ? 0
    : Math.round(netProfit * (activeInvestor.sharePercentage / 100));

  const totalCapitalInvested = investors.reduce((sum, i) => sum + i.capitalInvested, 0);

  return (
    <>
      <PageHero
        crumb="Investor Portal"
        eyebrow="Real-Time Equity & Profit Share"
        eyebrowIcon={TrendingUp}
        title="Live Investor"
        highlight="Financial Portal"
        description="Live profit share tracking for Crossbar Metro Arena partners. Real-time gross bookings income, operational expenses, net profit, and automated dividend calculations."
        stats={[
          { label: 'Gross Revenue', value: `৳${grossRevenue.toLocaleString()}`, icon: DollarSign },
          { label: 'Total Expenses', value: `৳${totalExpenses.toLocaleString()}`, icon: Receipt },
          { label: 'Net Profit', value: `৳${netProfit.toLocaleString()}`, icon: TrendingUp },
          { label: 'Partners Pool', value: `${investors.length}/10 Investors`, icon: UserCheck }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Profit Share Rule Official Banner */}
        <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLossMonth
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-start gap-3">
            {isLossMonth ? (
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm uppercase tracking-wider text-white">
                Official Profit Share Rule
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                <strong className="text-white">Income minus Expenses = Net Profit</strong>. Each investor receives their configured % of net profit. <span className="underline font-semibold">In a loss month, nobody gets a share</span> to protect arena cashflow and operational viability.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider font-mono ${
              isLossMonth
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {isLossMonth ? 'Loss Protection Active' : 'Dividend Payout Active'}
            </span>
          </div>
        </div>

        {/* Investor Profile Switcher */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Select Investor Account (Up to 10 Partners)</span>
            </h3>
            <span className="text-xs text-slate-400">
              Total Capital: ৳{(totalCapitalInvested / 1000000).toFixed(1)}M BDT
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {investors.map(inv => {
              const isSelected = selectedInvestorId === inv.id;
              return (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => setSelectedInvestorId(inv.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span>{inv.name}</span>
                  <span className="ml-1.5 opacity-80 font-mono">({inv.sharePercentage}%)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Investor Personal Financial Card */}
        {activeInvestor && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Investor Name</span>
              <div className="text-lg font-bold text-white mt-1 font-display">
                {activeInvestor.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{activeInvestor.email}</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Equity Share</span>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                {activeInvestor.sharePercentage}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Set from Admin Panel
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital Invested</span>
              <div className="text-2xl font-black font-mono text-white mt-1">
                ৳{activeInvestor.capitalInvested.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Joined: {activeInvestor.joinedDate}</div>
            </div>

            <div className={`p-6 rounded-2xl border ${
              isLossMonth
                ? 'bg-rose-950/20 border-rose-500/30'
                : 'bg-emerald-950/30 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
            }`}>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Live Payout Share</span>
              <div className={`text-3xl font-black font-mono mt-1 ${isLossMonth ? 'text-rose-400' : 'text-emerald-400'}`}>
                ৳{investorPayout.toLocaleString()}
              </div>
              <div className="text-[11px] mt-1">
                {isLossMonth ? (
                  <span className="text-rose-400 font-semibold">৳0 in loss month</span>
                ) : (
                  <span className="text-emerald-300 font-semibold">Ready for bank transfer</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Financial Transparency Audit Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Revenue Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Revenue Streams (Gross: ৳{grossRevenue.toLocaleString()})</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Pitch Alpha (7v7 Main Arena)</div>
                  <div className="text-[10px] text-slate-400">Championship turf bookings</div>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  ৳{bookings.filter(b => b.courtId === 'pitch-alpha').reduce((sum, b) => sum + (b.paymentStatus === 'paid_full' ? b.totalPrice : 500), 0).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Pitch Bravo (5v5 Speed Cage)</div>
                  <div className="text-[10px] text-slate-400">High-tempo 90-min scrimmages</div>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  ৳{bookings.filter(b => b.courtId === 'pitch-bravo').reduce((sum, b) => sum + (b.paymentStatus === 'paid_full' ? b.totalPrice : 500), 0).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Equipment Add-ons & Shop</div>
                  <div className="text-[10px] text-slate-400">Balls, bibs, referees & merchandise</div>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  ৳{bookings.reduce((sum, b) => sum + (b.addOnsPrice || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Expenses Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-400" />
              <span>Operating Costs (Total: ৳{totalExpenses.toLocaleString()})</span>
            </h4>

            <div className="space-y-3 text-xs">
              {expenses.map(exp => (
                <div key={exp.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{exp.title}</div>
                    <div className="text-[10px] text-slate-400">{exp.category.replace('_', ' ')} · {exp.date}</div>
                  </div>
                  <span className="font-mono font-bold text-rose-400">
                    -৳{exp.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
