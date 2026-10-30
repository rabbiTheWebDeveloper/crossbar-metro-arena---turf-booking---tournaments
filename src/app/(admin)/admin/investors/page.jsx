'use client';
import React, { useState, useMemo } from 'react';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { formatMoney, formatMonth, shiftMonth, PAYOUT_METHODS, paymentMethodLabel } from '@/data/finance';
import { ChevronLeft, ChevronRight, Plus, Link2, UserMinus, UserCheck, Trash2 } from 'lucide-react';
export const dynamic = 'force-dynamic';

const emptyNewInvestor = { name: '', phone: '', email: '', sharePercentage: '', capitalInvested: '' };

export default function AdminInvestorsPage() {
    const { investors, payouts, users, isLoadingData, showNotice, calculateMonthlyFinance,
        handleSaveInvestors, handleUpdateInvestor, handleDeleteInvestor, handleRecordPayout } = useArena();

    const [selectedMonth, setSelectedMonth] = useState(() => todayDhaka().slice(0, 7));
    const financeReport = useMemo(() => calculateMonthlyFinance(selectedMonth), [calculateMonthlyFinance, selectedMonth]);
    const shareById = useMemo(() => Object.fromEntries((financeReport.investorShares || []).map(s => [s.investor.id, s])), [financeReport]);

    const activeInvestors = useMemo(() => investors.filter(i => (i.status || 'active') === 'active'), [investors]);
    const totalInvestorPct = useMemo(() => activeInvestors.reduce((sum, inv) => sum + (Number(inv.sharePercentage) || 0), 0), [activeInvestors]);

    const lifetimePaidById = useMemo(() => {
        const map = {};
        payouts.forEach(p => { map[p.investorId] = (map[p.investorId] || 0) + (Number(p.amount) || 0); });
        return map;
    }, [payouts]);

    const investorUsers = useMemo(() => (users || []).filter(u => u.role === 'investor'), [users]);

    // Add partner modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newInv, setNewInv] = useState(emptyNewInvestor);
    const [addError, setAddError] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Payout modal
    const [payoutInvestor, setPayoutInvestor] = useState(null);
    const [payoutForm, setPayoutForm] = useState({ amount: 0, datePaid: todayDhaka(), paymentMethod: 'bank_transfer', transactionNote: '' });
    const [payoutError, setPayoutError] = useState('');
    const [isPayingOut, setIsPayingOut] = useState(false);

    // Link login modal
    const [linkInvestor, setLinkInvestor] = useState(null);
    const [linkUserId, setLinkUserId] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    const [busyId, setBusyId] = useState(null);

    const handlePrevMonth = () => setSelectedMonth(m => shiftMonth(m, -1));
    const handleNextMonth = () => setSelectedMonth(m => shiftMonth(m, 1));

    const handleAddInvestorSubmit = async (e) => {
        e.preventDefault();
        setAddError('');
        const share = Number(newInv.sharePercentage);
        if (!newInv.name.trim() || !newInv.phone.trim()) { setAddError('Name and phone are required.'); return; }
        if (Number.isNaN(share) || share < 0 || share > 100) { setAddError('Share must be between 0 and 100.'); return; }
        if (investors.length >= 10) { setAddError('Maximum 10 partners allowed.'); return; }
        setIsAdding(true);
        const result = await handleSaveInvestors([
            ...investors,
            { name: newInv.name.trim(), phone: newInv.phone.trim(), email: newInv.email.trim(), sharePercentage: share, capitalInvested: Number(newInv.capitalInvested) || 0 }
        ]);
        setIsAdding(false);
        if (!result.ok) { setAddError(result.error || 'Could not save the partner.'); return; }
        setShowAddModal(false);
        setNewInv(emptyNewInvestor);
    };

    const handleEditShare = async (inv) => {
        const input = prompt(`Equity share percentage for ${inv.name} (0–100):`, String(inv.sharePercentage ?? 0));
        if (input === null) return;
        const p = Number(input);
        if (input.trim() === '' || Number.isNaN(p) || p < 0 || p > 100) { showNotice('error', 'Share must be a number between 0 and 100.'); return; }
        setBusyId(inv.id);
        await handleUpdateInvestor(inv.id, { sharePercentage: p });
        setBusyId(null);
    };

    const handleToggleStatus = async (inv) => {
        const nextStatus = (inv.status || 'active') === 'active' ? 'inactive' : 'active';
        if (nextStatus === 'inactive' && !confirm(`Deactivate ${inv.name}? They will stop receiving a share of profit until reactivated.`)) return;
        setBusyId(inv.id);
        await handleUpdateInvestor(inv.id, { status: nextStatus });
        setBusyId(null);
    };

    const handleDelete = async (inv) => {
        if (!confirm(`Delete ${inv.name}? If payouts exist the account is set to inactive instead.`)) return;
        setBusyId(inv.id);
        await handleDeleteInvestor(inv.id);
        setBusyId(null);
    };

    const openPayout = (inv) => {
        const share = shareById[inv.id];
        setPayoutError('');
        setPayoutForm({ amount: share ? share.balance : 0, datePaid: todayDhaka(), paymentMethod: 'bank_transfer', transactionNote: '' });
        setPayoutInvestor(inv);
    };

    const handlePayoutSubmit = async (e) => {
        e.preventDefault();
        if (!payoutInvestor) return;
        setPayoutError('');
        const amount = Number(payoutForm.amount);
        if (!amount || amount <= 0) { setPayoutError('Enter a payout amount greater than zero.'); return; }
        const payload = { investorId: payoutInvestor.id, month: selectedMonth, amount, datePaid: payoutForm.datePaid, paymentMethod: payoutForm.paymentMethod, transactionNote: payoutForm.transactionNote.trim() };
        setIsPayingOut(true);
        let result = await handleRecordPayout(payload);
        if (!result.ok && result.status === 409) {
            const again = confirm(`${formatMoney(result.paidSoFar)} has already been paid to ${payoutInvestor.name} for ${formatMonth(selectedMonth)}. Record another ${formatMoney(amount)} for the same month?`);
            if (again) result = await handleRecordPayout({ ...payload, allowDuplicate: true });
            else { setIsPayingOut(false); return; }
        }
        setIsPayingOut(false);
        if (!result.ok) { setPayoutError(result.error || 'Could not record the payout.'); return; }
        setPayoutInvestor(null);
    };

    const openLink = (inv) => { setLinkUserId(inv.userId || ''); setLinkInvestor(inv); };
    const handleLinkSubmit = async (e) => {
        e.preventDefault();
        if (!linkInvestor) return;
        setIsLinking(true);
        const result = await handleUpdateInvestor(linkInvestor.id, { userId: linkUserId });
        setIsLinking(false);
        if (result.ok) setLinkInvestor(null);
    };

    const userLabel = (uid) => {
        const u = (users || []).find(x => x.id === uid);
        return u ? `${u.name} (${u.phone})` : '';
    };

    const inputCls = 'w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white';

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* MONTH SELECTOR */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-lg bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white cursor-pointer" aria-label="Previous month">
          <ChevronLeft className="w-4 h-4"/>
        </button>
        <span className="font-mono font-bold text-sm text-white tracking-widest uppercase">{formatMonth(selectedMonth)}</span>
        <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-lg bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white cursor-pointer" aria-label="Next month">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400">Active investor share</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">{totalInvestorPct}%</div>
          <div className="text-[12px] text-slate-500">Owners keep {Math.max(0, 100 - totalInvestorPct)}% · {activeInvestors.length} active partner{activeInvestors.length === 1 ? '' : 's'}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400">Net profit</div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${financeReport.isLossMonth ? 'text-rose-400' : 'text-emerald-400'}`}>
            {financeReport.netProfit < 0 ? '-' : ''}{formatMoney(Math.abs(financeReport.netProfit))}
          </div>
          <div className="text-[12px] text-slate-500">{formatMonth(selectedMonth)}{financeReport.isLossMonth ? ' · no dividend' : ''}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400">Partner share this month</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">{formatMoney(financeReport.totalInvestorShare)}</div>
          <div className="text-[12px] text-slate-500">
            paid {formatMoney((financeReport.investorShares || []).reduce((s, i) => s + i.paidAmount, 0))} · owed {formatMoney((financeReport.investorShares || []).reduce((s, i) => s + i.balance, 0))}
          </div>
        </div>
      </div>

      {/* INVESTOR LIST */}
      <div className="space-y-3">
        {isLoadingData && investors.length === 0 ? (
          [1, 2, 3].map(n => <div key={n} className="h-20 rounded-2xl bg-[#0c131a] border border-white/5 animate-pulse"/>)
        ) : investors.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">No partners yet. Add the first equity partner below.</div>
        ) : investors.map(inv => {
            const share = shareById[inv.id];
            const isActive = (inv.status || 'active') === 'active';
            const busy = busyId === inv.id;
            return (<div key={inv.id} className={`p-4 rounded-2xl bg-[#0c131a] border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs ${isActive ? 'border-white/5 hover:border-lime-400/20' : 'border-white/5 opacity-70'}`}>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-full font-black flex items-center justify-center text-sm font-mono shrink-0 ${isActive ? 'bg-lime-400 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                  {(inv.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                    <span>{inv.name}</span>
                    {!isActive && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-slate-700 text-slate-300 font-mono">inactive</span>}
                  </div>
                  <div className="text-[12px] text-slate-400 font-mono mt-0.5 truncate">
                    {inv.sharePercentage}% · invested {formatMoney(inv.capitalInvested)}{inv.phone ? ` · ${inv.phone}` : ''}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                    {inv.userId ? `Login: ${userLabel(inv.userId) || inv.userId}` : 'No login account linked'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 pl-12 lg:pl-0">
                <div className="text-right font-mono">
                  <div className="text-white font-bold text-sm">{formatMoney(share ? share.shareAmount : 0)} <span className="text-[10px] text-slate-500 font-normal">share</span></div>
                  <div className="text-[11px] text-slate-400">
                    paid {formatMoney(share ? share.paidAmount : 0)} this month{share && share.balance > 0 ? <span className="text-amber-300"> · owed {formatMoney(share.balance)}</span> : share && share.isPaid ? <span className="text-emerald-400"> · settled</span> : null}
                  </div>
                  <div className="text-[11px] text-slate-500">lifetime {formatMoney(lifetimePaidById[inv.id] || 0)}</div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button type="button" disabled={busy} onClick={() => handleEditShare(inv)} className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[12px] font-bold cursor-pointer disabled:opacity-50">Edit %</button>
                  <button type="button" disabled={busy} onClick={() => openLink(inv)} title="Link login account" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50" aria-label="Link login account"><Link2 className="w-3.5 h-3.5"/></button>
                  <button type="button" disabled={busy} onClick={() => handleToggleStatus(inv)} title={isActive ? 'Deactivate' : 'Reactivate'} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50" aria-label={isActive ? 'Deactivate partner' : 'Reactivate partner'}>
                    {isActive ? <UserMinus className="w-3.5 h-3.5"/> : <UserCheck className="w-3.5 h-3.5 text-emerald-400"/>}
                  </button>
                  <button type="button" disabled={busy} onClick={() => handleDelete(inv)} title="Delete" className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer disabled:opacity-50" aria-label="Delete partner"><Trash2 className="w-3.5 h-3.5"/></button>
                  <button type="button" disabled={busy || !isActive} onClick={() => openPayout(inv)} className="px-3 py-1.5 rounded-lg bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-slate-950 text-[12px] font-bold border border-lime-400/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">Payout</button>
                </div>
              </div>
            </div>);
        })}
      </div>

      <button type="button" disabled={investors.length >= 10} onClick={() => { setAddError(''); setShowAddModal(true); }} className="w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 transition-all cursor-pointer disabled:opacity-50">
        <Plus className="w-4 h-4 stroke-[3]"/>
        <span>Add investor</span>
      </button>

      {/* ADD INVESTOR MODAL */}
      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white font-display">Add Equity Partner</h3>
            <p className="text-xs text-slate-400">Active shares cannot exceed 100% in total ({Math.max(0, 100 - totalInvestorPct)}% available). Maximum 10 partners.</p>

            <form onSubmit={handleAddInvestorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Full name *</label>
                <input type="text" required value={newInv.name} onChange={e => setNewInv(f => ({ ...f, name: e.target.value }))} className={inputCls}/>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Mobile phone *</label>
                <input type="tel" required placeholder="01XXXXXXXXX" value={newInv.phone} onChange={e => setNewInv(f => ({ ...f, phone: e.target.value }))} className={`${inputCls} font-mono`}/>
                <p className="text-[11px] text-slate-500 mt-1">If the partner signs in with this phone number, the portal links automatically.</p>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Email</label>
                <input type="email" value={newInv.email} onChange={e => setNewInv(f => ({ ...f, email: e.target.value }))} className={inputCls}/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Share % *</label>
                  <input type="number" required min={0} max={100} step="0.5" value={newInv.sharePercentage} onChange={e => setNewInv(f => ({ ...f, sharePercentage: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Capital (৳)</label>
                  <input type="number" min={0} value={newInv.capitalInvested} onChange={e => setNewInv(f => ({ ...f, capitalInvested: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
              </div>

              {addError && <p className="text-rose-400 text-[12px]">{addError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" disabled={isAdding} onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isAdding} className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isAdding ? 'Saving…' : 'Save partner'}</button>
              </div>
            </form>
          </div>
        </div>)}

      {/* RECORD PAYOUT MODAL */}
      {payoutInvestor && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Record Investor Payout</h3>
            <p className="text-xs text-slate-400">
              <strong className="text-white">{payoutInvestor.name}</strong> ({payoutInvestor.sharePercentage}%) · {formatMonth(selectedMonth)}
              {shareById[payoutInvestor.id] && (<span className="block mt-1 font-mono">share {formatMoney(shareById[payoutInvestor.id].shareAmount)} · paid {formatMoney(shareById[payoutInvestor.id].paidAmount)} · owed {formatMoney(shareById[payoutInvestor.id].balance)}</span>)}
            </p>

            <form onSubmit={handlePayoutSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Payout amount (৳)</label>
                <input type="number" required min={1} value={payoutForm.amount} onChange={e => setPayoutForm(f => ({ ...f, amount: e.target.value }))} className={`${inputCls} font-mono`}/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Date paid</label>
                  <input type="date" required value={payoutForm.datePaid} onChange={e => setPayoutForm(f => ({ ...f, datePaid: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Method</label>
                  <select value={payoutForm.paymentMethod} onChange={e => setPayoutForm(f => ({ ...f, paymentMethod: e.target.value }))} className={inputCls}>
                    {PAYOUT_METHODS.map(m => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Transaction note</label>
                <input type="text" placeholder="e.g. bKash TrxID 8H3K…" value={payoutForm.transactionNote} onChange={e => setPayoutForm(f => ({ ...f, transactionNote: e.target.value }))} className={inputCls}/>
              </div>

              {payoutError && <p className="text-rose-400 text-[12px]">{payoutError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" disabled={isPayingOut} onClick={() => setPayoutInvestor(null)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isPayingOut} className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isPayingOut ? 'Recording…' : 'Confirm payout'}</button>
              </div>
            </form>
          </div>
        </div>)}

      {/* LINK LOGIN MODAL */}
      {linkInvestor && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Link login account</h3>
            <p className="text-xs text-slate-400">Choose which login sees <strong className="text-white">{linkInvestor.name}</strong>'s portal. Only accounts with the investor role are listed; change a user's role under Users first.</p>

            <form onSubmit={handleLinkSubmit} className="space-y-3 text-xs">
              <select value={linkUserId} onChange={e => setLinkUserId(e.target.value)} className={inputCls}>
                <option value="">— Not linked (match by phone only) —</option>
                {investorUsers.map(u => <option key={u.id} value={u.id}>{u.name} · {u.phone}</option>)}
              </select>
              {investorUsers.length === 0 && <p className="text-[11px] text-amber-300">No user accounts have the investor role yet.</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" disabled={isLinking} onClick={() => setLinkInvestor(null)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isLinking} className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isLinking ? 'Saving…' : 'Save link'}</button>
              </div>
            </form>
          </div>
        </div>)}

    </div>);
}
