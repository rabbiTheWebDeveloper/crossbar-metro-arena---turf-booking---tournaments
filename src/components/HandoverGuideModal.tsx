'use client';

import React, { useState } from 'react';
import { useArena } from '../context/ArenaContext';
import { CrossbarLogo } from './CrossbarLogo';
import {
  X,
  BookOpen,
  DollarSign,
  Calendar,
  Users,
  ShieldCheck,
  TrendingUp,
  Download,
  CheckCircle2,
  Phone,
  HelpCircle
} from 'lucide-react';

export const HandoverGuideModal: React.FC = () => {
  const { showHandoverGuide, setShowHandoverGuide } = useArena();
  const [activeTopic, setActiveTopic] = useState<'walkin' | 'expenses' | 'report' | 'payouts' | 'pricing' | 'backup'>('walkin');

  if (!showHandoverGuide) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-900 to-[#0b1016]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-display uppercase tracking-wide">
                Arena Admin Handover Guide
              </h3>
              <p className="text-xs text-slate-400">
                Official operating manual for Crossbar Metro Arena owners &amp; managers (bookcrossbar.com)
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHandoverGuide(false)}
            className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-4 border-b border-white/10 overflow-x-auto pb-3 bg-white/[0.01]">
          {[
            { id: 'walkin', label: '1. Walk-In Bookings', icon: Calendar },
            { id: 'expenses', label: '2. Enter Expenses', icon: DollarSign },
            { id: 'report', label: '3. 1-Click Monthly Report', icon: TrendingUp },
            { id: 'payouts', label: '4. Investor Payouts', icon: Users },
            { id: 'pricing', label: '5. 24 Slot Pricing Matrix', icon: ShieldCheck },
            { id: 'backup', label: '6. Backup & Restore', icon: Download },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTopic(t.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTopic === t.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed flex-1">
          {activeTopic === 'walkin' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase font-display text-emerald-400">
                How to Add a Walk-In Booking
              </h4>
              <p>
                When a team arrives at the arena counter without an online reservation:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <strong>Admin Portal → Schedule</strong> tab or click on any available slot in the schedule.</li>
                <li>Pick the day and click <strong>&quot;Walk-in Booking&quot;</strong> on the free slot.</li>
                <li>Enter the squad name, captain&apos;s name, and their mobile number.</li>
                <li>Enter the price and payment received (Cash, bKash counter QR, Nagad, or Card POS). You can record full clearance or ৳500 advance.</li>
                <li>Click <strong>&quot;Confirm Walk-In Booking&quot;</strong>. The slot is locked instantly, guaranteed by database uniqueness rule.</li>
                <li>If the team pays the rest when match finishes, click <strong>&quot;Collect Balance&quot;</strong> to record the final cash settlement.</li>
              </ol>
            </div>
          )}

          {activeTopic === 'expenses' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase font-display text-emerald-400">
                How to Enter Operational Expenses
              </h4>
              <p>
                To keep the monthly net profit figure 100% accurate for investors and tax compliance:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <strong>Admin Portal → Expenses</strong> tab.</li>
                <li>Click <strong>&quot;Record Expense&quot;</strong>.</li>
                <li>Select the expense category: <em>Electricity, Staff Salary, Rent, Turf Maintenance, Water, Internet, Marketing, Equipment, Shop Stock, or Other</em>.</li>
                <li>Enter the exact amount in Taka (৳), invoice date, and receipt number / memo note.</li>
                <li>Click <strong>&quot;Save Expense Entry&quot;</strong>.</li>
                <li>The expense immediately updates this month&apos;s net profit in the investor and owner dashboards.</li>
              </ol>
            </div>
          )}

          {activeTopic === 'report' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase font-display text-emerald-400">
                How to Run the 1-Click Monthly Financial Report
              </h4>
              <p>
                Every 1st of the month, generate the certified revenue statement:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <strong>Admin Portal → Financial Report</strong>.</li>
                <li>Select the month from the dropdown (e.g. October 2026).</li>
                <li>The system computes:
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400">
                    <li><strong>Booking money collected:</strong> All online and cash payments minus refunds paid.</li>
                    <li><strong>Other income:</strong> Shop sales, tournament fees, sponsorship.</li>
                    <li><strong>Total expenses:</strong> Sum of all expense receipts for the chosen month.</li>
                    <li><strong>Net Profit = Total Revenue − Expenses</strong>.</li>
                    <li><strong>Investor Shares:</strong> Each investor&apos;s exact dividend (Net Profit × Share %). If loss, ৳0.</li>
                  </ul>
                </li>
                <li>Click <strong>&quot;Export CSV / Excel&quot;</strong> to download the spreadsheet or click <strong>&quot;Print Report&quot;</strong> for a formal printable audit statement.</li>
              </ol>
            </div>
          )}

          {activeTopic === 'payouts' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase font-display text-emerald-400">
                How to Record Monthly Investor Payouts
              </h4>
              <p>
                Once profits are disbursed to partners:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <strong>Admin Portal → Investors</strong> tab.</li>
                <li>Verify each investor&apos;s calculated share from the financial report.</li>
                <li>After sending funds via Bank Transfer, bKash, or cheque, click <strong>&quot;Record Payout&quot;</strong> under their profile.</li>
                <li>Enter the amount paid, payment method, bank transaction reference number, and date.</li>
                <li>Click <strong>&quot;Log Payout&quot;</strong>. The payout instantly appears in that investor&apos;s private <strong>My Payouts</strong> tab on their investor portal.</li>
              </ol>
            </div>
          )}

          {activeTopic === 'pricing' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase font-display text-emerald-400">
                How to Edit the 24 Slot Pricing Matrix
              </h4>
              <p>
                Crossbar Metro Arena operates 12 fixed slots daily with individual weekday and weekend pricing:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <strong>Admin Portal → Slot Pricing &amp; Rules</strong>.</li>
                <li>Each of the 12 slots has its own <strong>Weekday Price</strong> (Sun–Thu) and <strong>Weekend Price</strong> (Fri–Sat).</li>
                <li>Edit any slot&apos;s price directly. You can set prime evening floodlight slots higher and morning slots lower.</li>
                <li>You can also configure the <strong>Advance Amount</strong> (default ৳500), <strong>Hold Window</strong> (10 mins), and <strong>Cancellation Hours</strong> (24h).</li>
                <li>Click <strong>&quot;Save Pricing &amp; Rules&quot;</strong>. Existing bookings are preserved; new bookings immediately reflect the updated prices.</li>
              </ol>
            </div>
          )}

          {activeTopic === 'backup' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase font-display text-emerald-400">
                Database Backup &amp; Disaster Recovery
              </h4>
              <p>
                To comply with the 14-day persistent backup requirement:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>&quot;Export Database Backup&quot;</strong> in the Admin panel top bar or Settings tab.</li>
                <li>A JSON backup file containing all bookings, pricing, expenses, investors, shop orders, and match results is downloaded to your machine.</li>
                <li>Keep backups in your secure Google Drive or local storage.</li>
                <li>To restore the system on a new machine or staging server, use the <strong>&quot;Restore from Backup&quot;</strong> file uploader in Settings.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div>Technical Support: <strong>bookcrossbar@gmail.com</strong></div>
          <button
            type="button"
            onClick={() => setShowHandoverGuide(false)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
