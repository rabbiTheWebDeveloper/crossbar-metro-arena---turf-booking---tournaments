'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { formatMoney, formatDate, REFUND_METHODS, REFUND_STATUS_LABELS, paymentMethodLabel } from '@/data/finance';
import { CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react';
export const dynamic = 'force-dynamic';

const STATUS_STYLES = {
    pending: 'bg-amber-400/20 text-amber-300',
    approved: 'bg-sky-400/20 text-sky-300',
    completed: 'bg-emerald-500/20 text-emerald-300',
    rejected: 'bg-rose-500/20 text-rose-300'
};

const reasonLabel = (reason) => String(reason || 'player_cancelled').replaceAll('_', ' ');

export default function AdminRefundsPage() {
    const { refunds, isLoadingData, handleRecordRefund } = useArena();

    // Modal: { refund, mode: 'complete' | 'reject' }
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ amount: '', method: 'bkash', trxId: '', note: '' });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const counts = useMemo(() => refunds.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {}), [refunds]);
    const openRefunds = useMemo(() => refunds
        .filter(r => r.status === 'pending' || r.status === 'approved')
        .sort((a, b) => String(a.requestDate || '').localeCompare(String(b.requestDate || ''))), [refunds]);
    const closedRefunds = useMemo(() => refunds
        .filter(r => r.status === 'completed' || r.status === 'rejected')
        .sort((a, b) => String(b.refundedDate || b.requestDate || '').localeCompare(String(a.refundedDate || a.requestDate || ''))), [refunds]);

    const openModal = (refund, mode) => {
        setFormError('');
        setForm({ amount: refund.amount, method: REFUND_METHODS.includes(refund.refundMethod) ? refund.refundMethod : 'bkash', trxId: '', note: '' });
        setModal({ refund, mode });
    };

    const handleApprove = async (refund) => {
        setBusyId(refund.id);
        await handleRecordRefund(refund.id, refund.amount, refund.refundMethod || 'bkash', '', 'approved');
        setBusyId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!modal) return;
        setFormError('');
        const { refund, mode } = modal;
        if (mode === 'reject') {
            setIsSubmitting(true);
            const result = await handleRecordRefund(refund.id, refund.amount, refund.refundMethod || 'bkash', form.note.trim(), 'rejected');
            setIsSubmitting(false);
            if (!result.ok) { setFormError(result.error || 'Could not reject the refund.'); return; }
            setModal(null);
            return;
        }
        const amount = Number(form.amount);
        if (!amount || amount <= 0) { setFormError('Enter the amount actually refunded.'); return; }
        if (amount > Number(refund.amount)) { setFormError(`Amount cannot exceed the claimed ${formatMoney(refund.amount)}.`); return; }
        if (!form.trxId.trim()) { setFormError('A transaction reference is required for a completed refund.'); return; }
        setIsSubmitting(true);
        const result = await handleRecordRefund(refund.id, amount, form.method, form.trxId.trim(), 'completed');
        setIsSubmitting(false);
        if (!result.ok) { setFormError(result.error || 'Could not record the refund.'); return; }
        setModal(null);
    };

    const inputCls = 'w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white';

    return (<div className="space-y-6 animate-fade-in font-sans">

      <div>
        <h2 className="text-xl font-black text-white font-display">Refunds &amp; Cancellations Management</h2>
        <p className="text-xs text-slate-400">
          Review advance refund claims created by cancellations, approve or reject them, and record the transaction once the money has been sent.
        </p>
      </div>

      {/* STATUS COUNTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['pending', 'approved', 'completed', 'rejected'].map(s => (
          <div key={s} className="p-4 rounded-2xl bg-[#0c131a] border border-white/5">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">{REFUND_STATUS_LABELS[s]}</div>
            <div className="text-2xl font-black font-mono text-white mt-0.5">{counts[s] || 0}</div>
          </div>
        ))}
      </div>

      {/* OPEN QUEUE */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4"/>
          <span>Open refund claims ({openRefunds.length})</span>
        </h3>

        {isLoadingData && refunds.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-busy="true">
            {[1, 2, 3].map(n => <div key={n} className="h-36 rounded-2xl bg-[#0c131a] border border-white/5 animate-pulse"/>)}
          </div>
        ) : openRefunds.length === 0 ? (<div className="p-6 rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">
            No open refunds. Every claim has been processed.
          </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {openRefunds.map(ref => {
              const busy = busyId === ref.id;
              return (<div key={ref.id} className={`p-4 rounded-2xl bg-[#0c131a] border space-y-3 text-xs ${ref.status === 'approved' ? 'border-sky-400/30' : 'border-amber-400/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white">{ref.bookingCode}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${STATUS_STYLES[ref.status]}`}>{REFUND_STATUS_LABELS[ref.status]}</span>
                </div>

                <div>
                  <div className="font-bold text-white">{ref.customerName}</div>
                  <div className="font-mono text-slate-400 text-[12px]">{ref.customerPhone}</div>
                  <div className="text-[12px] text-slate-400 mt-1 capitalize">Reason: {reasonLabel(ref.reason)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Requested {formatDate(ref.requestDate, { day: 'numeric', month: 'short', year: 'numeric' })}{ref.refundMethod ? ` · prefers ${paymentMethodLabel(ref.refundMethod)}` : ''}</div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="font-mono text-base font-bold text-amber-400">{formatMoney(ref.amount)}</span>
                  <div className="flex items-center gap-1.5">
                    {ref.status === 'pending' && (
                      <button type="button" disabled={busy} onClick={() => handleApprove(ref)} className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold cursor-pointer disabled:opacity-50" title="Approve claim">Approve</button>
                    )}
                    <button type="button" disabled={busy} onClick={() => openModal(ref, 'reject')} className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold cursor-pointer disabled:opacity-50">Reject</button>
                    <button type="button" disabled={busy} onClick={() => openModal(ref, 'complete')} className="px-3 py-1.5 rounded-xl bg-lime-400 text-slate-950 font-bold hover:bg-lime-300 cursor-pointer disabled:opacity-50">Process</button>
                  </div>
                </div>
              </div>);
            })}
          </div>)}
      </div>

      {/* LEDGER */}
      <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
          <span>Refund ledger ({closedRefunds.length})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-500 uppercase border-b border-white/5">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Booking</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Method &amp; reference</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[12px]">
              {closedRefunds.length === 0 && (
                <tr><td colSpan={6} className="py-4 px-3 font-sans text-slate-500">No completed or rejected refunds yet.</td></tr>
              )}
              {closedRefunds.map(ref => (<tr key={ref.id}>
                  <td className="py-2.5 px-3 text-slate-400">{formatDate(ref.refundedDate || ref.requestDate, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="py-2.5 px-3 text-white font-bold">{ref.bookingCode}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">{ref.customerName} ({ref.customerPhone})</td>
                  <td className={`py-2.5 px-3 font-bold ${ref.status === 'completed' ? 'text-emerald-400' : 'text-slate-500 line-through'}`}>{formatMoney(ref.amount)}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {ref.status === 'completed' ? `${paymentMethodLabel(ref.refundMethod)}${ref.transactionRef ? ` (${ref.transactionRef})` : ''}` : (ref.transactionRef || '—')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_STYLES[ref.status]}`}>{REFUND_STATUS_LABELS[ref.status]}</span>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROCESS / REJECT MODAL */}
      {modal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`bg-[#0c131a] border rounded-2xl p-6 max-w-sm w-full space-y-4 ${modal.mode === 'reject' ? 'border-rose-400/30' : 'border-lime-400/30'}`}>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {modal.mode === 'reject' ? <XCircle className="w-4 h-4 text-rose-400"/> : <ShieldCheck className="w-4 h-4 text-lime-400"/>}
              {modal.mode === 'reject' ? 'Reject refund claim' : 'Record processed refund'}
            </h3>
            <p className="text-xs text-slate-400">
              {modal.refund.bookingCode} · {modal.refund.customerName} ({modal.refund.customerPhone}) · claimed {formatMoney(modal.refund.amount)}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {modal.mode === 'reject' ? (
                <div>
                  <label className="block text-slate-300 mb-1">Reason for rejection (optional)</label>
                  <input type="text" placeholder="e.g. cancelled inside the 24h window" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className={inputCls}/>
                </div>
              ) : (<>
                <div>
                  <label className="block text-slate-300 mb-1">Amount refunded (৳) *</label>
                  <input type="number" required min={1} max={Number(modal.refund.amount) || undefined} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={`${inputCls} font-mono`}/>
                  <p className="text-[11px] text-slate-500 mt-1">Lower the amount for a partial refund.</p>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Method *</label>
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className={inputCls}>
                    {REFUND_METHODS.map(m => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Transaction reference *</label>
                  <input type="text" required placeholder="Gateway TrxID or voucher number" value={form.trxId} onChange={e => setForm(f => ({ ...f, trxId: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
              </>)}

              {formError && <p className="text-rose-400 text-[12px]">{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" disabled={isSubmitting} onClick={() => setModal(null)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className={`flex-1 py-2 font-black rounded-xl cursor-pointer disabled:opacity-50 ${modal.mode === 'reject' ? 'bg-rose-500 text-white' : 'bg-lime-400 text-slate-950'}`}>
                  {isSubmitting ? 'Saving…' : modal.mode === 'reject' ? 'Reject claim' : 'Confirm refunded'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

    </div>);
}
