'use client';
import React, { useState, useMemo } from 'react';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { formatMoney, formatMonth, shiftMonth, PAYOUT_METHODS, paymentMethodLabel, payoutDetailsSummary } from '@/data/finance';
import { cleanPhone } from '@/lib/phone';
import { ChevronLeft, ChevronRight, Plus, Link2, UserMinus, UserCheck, Trash2, KeyRound, AlertTriangle, Copy, Check } from 'lucide-react';
export const dynamic = 'force-dynamic';

const emptyNewInvestor = { name: '', phone: '', email: '', sharePercentage: '', capitalInvested: '' };

export default function AdminInvestorsPage() {
    const { investors, payouts, users, isLoadingData, showNotice, calculateMonthlyFinance,
        handleSaveInvestors, handleUpdateInvestor, handleDeleteInvestor, handleRecordPayout, handleAdminUpdateUser } = useArena();

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

    // Delete modal
    const [deleteInvestor, setDeleteInvestor] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset password modal
    const [resetInvestor, setResetInvestor] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetDone, setResetDone] = useState(''); // the password just set, shown once so it can be passed on
    const [resetCopied, setResetCopied] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

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

    // ---- Delete partner ----
    const payoutCountById = useMemo(() => {
        const map = {};
        payouts.forEach(p => { map[p.investorId] = (map[p.investorId] || 0) + 1; });
        return map;
    }, [payouts]);
    const deletePayoutCount = deleteInvestor ? (payoutCountById[deleteInvestor.id] || 0) : 0;
    const deleteNameMatches = deleteInvestor ? deleteConfirmText.trim().toLowerCase() === String(deleteInvestor.name || '').trim().toLowerCase() : false;

    const openDelete = (inv) => { setDeleteConfirmText(''); setDeleteError(''); setDeleteInvestor(inv); };
    const closeDelete = () => { if (!isDeleting) setDeleteInvestor(null); };
    /** mode: 'delete' (no payouts), 'permanent' (payouts kept in the ledger) or 'deactivate' */
    const handleDeleteConfirm = async (mode) => {
        if (!deleteInvestor || isDeleting) return;
        setDeleteError('');
        setIsDeleting(true);
        const result = mode === 'deactivate'
            ? await handleUpdateInvestor(deleteInvestor.id, { status: 'inactive' })
            : await handleDeleteInvestor(deleteInvestor.id, { permanent: mode === 'permanent' });
        setIsDeleting(false);
        if (!result.ok) { setDeleteError(result.error || 'Could not complete the action.'); return; }
        setDeleteInvestor(null);
    };

    // ---- Reset the partner's login password ----
    /** The login behind a partner: the linked account first, otherwise the account with the same mobile number. */
    const loginAccountFor = (inv) => {
        if (!inv) return null;
        const list = users || [];
        return list.find(u => inv.userId && u.id === inv.userId) || list.find(u => inv.phone && cleanPhone(u.phone) === cleanPhone(inv.phone)) || null;
    };
    const resetAccount = loginAccountFor(resetInvestor);

    const openReset = (inv) => { setResetPassword(''); setResetError(''); setResetDone(''); setResetCopied(false); setResetInvestor(inv); };
    const closeReset = () => { if (!isResetting) setResetInvestor(null); };
    const generatePassword = () => {
        // No look-alike characters (0/O, 1/l/I) so it can be read out over the phone
        const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        const bytes = new Uint32Array(10);
        window.crypto.getRandomValues(bytes);
        setResetPassword(Array.from(bytes, b => alphabet[b % alphabet.length]).join(''));
        setResetError('');
    };
    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (!resetInvestor || !resetAccount || isResetting) return;
        setResetError('');
        const password = resetPassword.trim();
        if (password.length < 6) { setResetError('Password must be at least 6 characters.'); return; }
        setIsResetting(true);
        try {
            await handleAdminUpdateUser(resetAccount.id, { newPassword: password });
            setResetDone(password);
            showNotice('success', `Password reset for ${resetAccount.name}`);
        } catch (err) {
            setResetError(err?.message || 'Could not reset the password.');
        }
        setIsResetting(false);
    };
    const copyResetPassword = async () => {
        try { await navigator.clipboard.writeText(resetDone); setResetCopied(true); } catch { setResetCopied(false); }
    };

    const openPayout = (inv) => {
        const share = shareById[inv.id];
        setPayoutError('');
        // Start from the method the partner asked for in their portal settings
        setPayoutForm({ amount: share ? share.balance : 0, datePaid: todayDhaka(), paymentMethod: inv.payoutDetails?.method || 'bank_transfer', transactionNote: '' });
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
                  <button type="button" disabled={busy} onClick={() => openReset(inv)} title="Reset login password" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50" aria-label="Reset login password"><KeyRound className="w-3.5 h-3.5"/></button>
                  <button type="button" disabled={busy} onClick={() => openDelete(inv)} title="Delete partner" className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer disabled:opacity-50" aria-label="Delete partner"><Trash2 className="w-3.5 h-3.5"/></button>
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
            <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
              <span className="text-slate-500">Partner prefers: </span>
              <span className="text-white font-semibold break-words">{payoutDetailsSummary(payoutInvestor.payoutDetails) || 'no preference set'}</span>
              {payoutInvestor.payoutDetails?.method && payoutInvestor.payoutDetails?.note && (<span className="block text-slate-400 mt-0.5">Note: {payoutInvestor.payoutDetails.note}</span>)}
            </div>

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

      {/* DELETE PARTNER MODAL */}
      {deleteInvestor && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="delete-partner-title">
          <div className="bg-[#0c131a] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300"><AlertTriangle className="w-4 h-4"/></div>
              <h3 id="delete-partner-title" className="text-base font-bold text-white">Delete partner</h3>
            </div>

            <p className="text-slate-400">
              <strong className="text-white">{deleteInvestor.name}</strong> · {deleteInvestor.sharePercentage}% share · invested {formatMoney(deleteInvestor.capitalInvested)}
            </p>

            {deletePayoutCount === 0 ? (
              <p className="text-slate-300">This partner has no payouts on record and will be removed completely. This cannot be undone.</p>
            ) : (<>
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-200 space-y-1">
                <p className="font-semibold">{deletePayoutCount} payout{deletePayoutCount === 1 ? '' : 's'} on record · {formatMoney(lifetimePaidById[deleteInvestor.id] || 0)} paid in total.</p>
                <p className="text-amber-200/80">Deactivating keeps the partner and their history, and stops their profit share. Deleting permanently removes the partner record; the past payouts stay in the ledger so earlier reports do not change. This cannot be undone.</p>
              </div>
              <div>
                <label htmlFor="delete-partner-confirm" className="block text-slate-300 mb-1">To delete permanently, type the partner&rsquo;s name: <strong className="text-white">{deleteInvestor.name}</strong></label>
                <input id="delete-partner-confirm" type="text" autoComplete="off" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className={inputCls}/>
              </div>
            </>)}

            <p className="text-[11px] text-slate-500">The partner&rsquo;s login account is not removed. Disable it under Players if they should no longer sign in.</p>

            {deleteError && <p className="text-rose-400 text-[12px]" role="alert">{deleteError}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" disabled={isDeleting} onClick={closeDelete} className="flex-1 py-2 px-3 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
              {deletePayoutCount > 0 && (deleteInvestor.status || 'active') === 'active' && (
                <button type="button" disabled={isDeleting} onClick={() => handleDeleteConfirm('deactivate')} className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-bold cursor-pointer disabled:opacity-50">Deactivate</button>
              )}
              <button type="button" disabled={isDeleting || (deletePayoutCount > 0 && !deleteNameMatches)} onClick={() => handleDeleteConfirm(deletePayoutCount > 0 ? 'permanent' : 'delete')} className="flex-1 py-2 px-3 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                {isDeleting ? 'Working…' : deletePayoutCount > 0 ? 'Delete permanently' : 'Delete partner'}
              </button>
            </div>
          </div>
        </div>)}

      {/* RESET PASSWORD MODAL */}
      {resetInvestor && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400"><KeyRound className="w-4 h-4"/></div>
              <h3 id="reset-password-title" className="text-base font-bold text-white">Reset login password</h3>
            </div>

            {!resetAccount ? (<>
              <p className="text-slate-300">
                <strong className="text-white">{resetInvestor.name}</strong> has no login account yet, so there is no password to reset.
              </p>
              <p className="text-slate-400">Ask them to sign up on the website with <span className="font-mono text-white">{resetInvestor.phone || 'their mobile number'}</span>, then set that account&rsquo;s role to investor under Players. The portal links to this partner automatically by phone number.</p>
              <button type="button" onClick={closeReset} className="w-full py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer">Close</button>
            </>) : resetDone ? (<>
              <p className="text-slate-300">The password for <strong className="text-white">{resetAccount.name}</strong> (<span className="font-mono">{resetAccount.phone}</span>) has been changed. Pass it on now; it is not shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-xl bg-[#080d12] border border-lime-400/30 text-lime-300 font-mono text-sm break-all select-all">{resetDone}</code>
                <button type="button" onClick={copyResetPassword} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold cursor-pointer flex items-center gap-1.5" aria-label="Copy password">
                  {resetCopied ? <Check className="w-3.5 h-3.5 text-lime-400"/> : <Copy className="w-3.5 h-3.5"/>}
                  <span>{resetCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">The partner can change it themselves under Settings in the investor portal.</p>
              <button type="button" onClick={closeReset} className="w-full py-2 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer">Done</button>
            </>) : (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                <p className="text-slate-400">
                  Set a new password for <strong className="text-white">{resetInvestor.name}</strong>&rsquo;s login: <span className="text-white">{resetAccount.name}</span> · <span className="font-mono text-white">{resetAccount.phone}</span> · {resetAccount.role}
                </p>
                {resetAccount.disabled && <p className="text-amber-300 text-[11px]">This account is disabled. The new password will not work until it is enabled under Players.</p>}
                {resetAccount.role !== 'investor' && resetAccount.role !== 'admin' && <p className="text-amber-300 text-[11px]">This account has the {resetAccount.role} role, so it cannot open the investor portal until its role is changed under Players.</p>}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="reset-password-input" className="block text-slate-300">New password</label>
                    <button type="button" onClick={generatePassword} className="text-[11px] text-lime-400 hover:text-lime-300 font-semibold cursor-pointer">Generate</button>
                  </div>
                  <input id="reset-password-input" type="text" autoComplete="off" spellCheck={false} placeholder="min 6 characters" value={resetPassword} onChange={e => { setResetPassword(e.target.value); setResetError(''); }} className={`${inputCls} font-mono`}/>
                  <p className="text-[11px] text-slate-500 mt-1">Their current password stops working as soon as you save.</p>
                </div>

                {resetError && <p className="text-rose-400 text-[12px]" role="alert">{resetError}</p>}

                <div className="flex gap-2 pt-1">
                  <button type="button" disabled={isResetting} onClick={closeReset} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isResetting} className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isResetting ? 'Saving…' : 'Reset password'}</button>
                </div>
              </form>
            )}
          </div>
        </div>)}

    </div>);
}
