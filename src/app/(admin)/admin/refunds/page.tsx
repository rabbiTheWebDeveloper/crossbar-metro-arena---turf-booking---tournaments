'use client';

import React, { useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { RefundRecord } from '@/types';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  DollarSign,
  ArrowRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminRefundsPage() {
  const { refunds, handleRecordRefund } = useArena();
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);
  const [trxId, setTrxId] = useState('');
  const [refundMethod, setRefundMethod] = useState<'bkash' | 'nagad' | 'bank_transfer' | 'cash'>('bkash');

  const pendingRefunds = refunds.filter(r => r.status === 'pending');
  const completedRefunds = refunds.filter(r => r.status === 'completed');

  const handleProcessRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund || !trxId.trim()) return;

    handleRecordRefund(
      selectedRefund.id,
      selectedRefund.amount,
      refundMethod,
      trxId.trim()
    );

    setSelectedRefund(null);
    setTrxId('');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white font-display">
          Refunds &amp; Cancellations Management
        </h2>
        <p className="text-xs text-slate-400">
          Review player advance refund claims, verify cancellation cutoff eligibility, and record bKash/Nagad transactions.
        </p>
      </div>

      {/* Pending Refunds Queue */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>Pending Refund Claims ({pendingRefunds.length})</span>
        </h3>

        {pendingRefunds.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">
            No pending refunds. All customer claims are processed!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRefunds.map(ref => (
              <div
                key={ref.id}
                className="p-4 rounded-2xl bg-[#0c131a] border border-amber-400/30 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white">{ref.bookingCode}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-400/20 text-amber-300">
                    Pending
                  </span>
                </div>

                <div>
                  <div className="font-bold text-white">{ref.customerName}</div>
                  <div className="font-mono text-slate-400 text-[11px]">{ref.customerPhone}</div>
                  <div className="text-[11px] text-slate-400 mt-1 capitalize">
                    Reason: {ref.reason.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-amber-400">
                    ৳{ref.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRefund(ref);
                      setTrxId(`BK-REF-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-lime-400 text-slate-950 font-bold hover:bg-lime-300 cursor-pointer"
                  >
                    Process Refund
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Refunds Ledger */}
      <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Completed Refunds Ledger</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-slate-500 uppercase border-b border-white/5">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Booking Code</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Method &amp; Trx ID</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {completedRefunds.map(ref => (
                <tr key={ref.id}>
                  <td className="py-2.5 px-3 text-slate-400">{ref.refundedDate || ref.requestDate}</td>
                  <td className="py-2.5 px-3 text-white font-bold">{ref.bookingCode}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">{ref.customerName} ({ref.customerPhone})</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">৳{ref.amount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-400">{ref.refundMethod} ({ref.transactionRef})</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROCESS REFUND MODAL */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Record Processed Refund</h3>
            <p className="text-xs text-slate-400">
              Refunding ৳{selectedRefund.amount.toLocaleString()} to {selectedRefund.customerName} ({selectedRefund.customerPhone})
            </p>

            <form onSubmit={handleProcessRefundSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Gateway / Method</label>
                <select
                  value={refundMethod}
                  onChange={e => setRefundMethod(e.target.value as any)}
                  className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"
                >
                  <option value="bkash">bKash Merchant Refund</option>
                  <option value="nagad">Nagad Refund</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Counter Cash Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Transaction ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BK-REF-9921"
                  value={trxId}
                  onChange={e => setTrxId(e.target.value)}
                  className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRefund(null)}
                  className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl"
                >
                  Confirm Processed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
