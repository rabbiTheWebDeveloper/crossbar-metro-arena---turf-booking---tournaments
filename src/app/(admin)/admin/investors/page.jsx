'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { formatMoney, formatMonth, shiftMonth, PAYOUT_METHODS, paymentMethodLabel, payoutDetailsSummary } from '@/data/finance';
import { cleanPhone, isValidBdPhone } from '@/lib/phone';
import {
    ChevronLeft, ChevronRight, Plus, UserMinus, UserCheck, Trash2, KeyRound,
    AlertTriangle, Copy, Check, Pencil, User, ShieldCheck, Lock, RefreshCw,
    X, UserX, ExternalLink, ShieldAlert, Sparkles, Unlink, ArrowRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const emptyNewInvestor = { name: '', phone: '', email: '', sharePercentage: '', capitalInvested: '' };

/** 10 characters without look-alikes (0/O, 1/l/I) so it can be read out over the phone. */
const generatePassword = () => {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const bytes = new Uint32Array(10);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
};

export default function AdminInvestorsPage() {
    const {
        investors, payouts, users, isLoadingData, showNotice, calculateMonthlyFinance,
        handleSaveInvestors, handleUpdateInvestor, handleDeleteInvestor, handleRecordPayout,
        handleAdminUpdateUser, handleCreateUser, refreshUsers
    } = useArena();

    useEffect(() => {
        if (typeof refreshUsers === 'function') refreshUsers();
    }, [refreshUsers]);

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

    const [busyId, setBusyId] = useState(null);

    const handlePrevMonth = () => setSelectedMonth(m => shiftMonth(m, -1));
    const handleNextMonth = () => setSelectedMonth(m => shiftMonth(m, 1));

    // ---- Helper to resolve login account for an investor ----
    const loginAccountFor = (inv) => {
        if (!inv) return null;
        const list = users || [];
        return list.find(u => inv.userId && u.id === inv.userId) || list.find(u => inv.phone && cleanPhone(u.phone) === cleanPhone(inv.phone)) || null;
    };

    const userLabel = (uid) => {
        const u = (users || []).find(x => x.id === uid);
        return u ? `${u.name} (${u.phone})` : '';
    };

    // ==========================================
    // 1. ADD INVESTOR MODAL
    // ==========================================
    const [showAddModal, setShowAddModal] = useState(false);
    const [newInv, setNewInv] = useState(emptyNewInvestor);
    const [addError, setAddError] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddInvestorSubmit = async (e) => {
        e.preventDefault();
        setAddError('');
        const share = Number(newInv.sharePercentage);
        if (!newInv.name.trim() || !newInv.phone.trim()) { setAddError('Name and phone are required.'); return; }
        if (!isValidBdPhone(newInv.phone)) { setAddError('Enter a valid 11-digit Bangladeshi mobile number.'); return; }
        if (Number.isNaN(share) || share < 0 || share > 100) { setAddError('Share must be between 0 and 100.'); return; }
        if (totalInvestorPct + share > 100.0001) { setAddError(`Available equity is ${Math.max(0, 100 - totalInvestorPct)}%. Total active shares cannot exceed 100%.`); return; }
        if (investors.length >= 10) { setAddError('Maximum 10 partners allowed.'); return; }
        setIsAdding(true);
        const result = await handleSaveInvestors([
            ...investors,
            { name: newInv.name.trim(), phone: cleanPhone(newInv.phone), email: newInv.email.trim(), sharePercentage: share, capitalInvested: Number(newInv.capitalInvested) || 0 }
        ]);
        setIsAdding(false);
        if (!result.ok) { setAddError(result.error || 'Could not save the partner.'); return; }
        setShowAddModal(false);
        setNewInv(emptyNewInvestor);
    };

    // ==========================================
    // 2. EDIT INVESTOR MODAL
    // ==========================================
    const [editInvestor, setEditInvestor] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', sharePercentage: '', capitalInvested: '', status: 'active' });
    const [editError, setEditError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const openEditInvestor = (inv) => {
        setEditError('');
        setEditInvestor(inv);
        setEditForm({
            name: inv.name || '',
            phone: inv.phone || '',
            email: inv.email || '',
            sharePercentage: inv.sharePercentage ?? '',
            capitalInvested: inv.capitalInvested ?? '',
            status: inv.status || 'active'
        });
    };

    const handleEditInvestorSubmit = async (e) => {
        e.preventDefault();
        if (!editInvestor || isEditing) return;
        setEditError('');
        const share = Number(editForm.sharePercentage);
        if (!editForm.name.trim() || !editForm.phone.trim()) { setEditError('Name and phone are required.'); return; }
        if (!isValidBdPhone(editForm.phone)) { setEditError('Enter a valid 11-digit Bangladeshi mobile number.'); return; }
        if (Number.isNaN(share) || share < 0 || share > 100) { setEditError('Share must be between 0 and 100.'); return; }

        const otherActiveShares = investors
            .filter(i => i.id !== editInvestor.id && (i.status || 'active') === 'active')
            .reduce((sum, i) => sum + (Number(i.sharePercentage) || 0), 0);
        const newTotal = otherActiveShares + (editForm.status === 'active' ? share : 0);
        if (newTotal > 100.0001) {
            setEditError(`Total active shares would be ${newTotal.toFixed(1)}%. It cannot exceed 100%.`);
            return;
        }

        setIsEditing(true);
        const result = await handleUpdateInvestor(editInvestor.id, {
            name: editForm.name.trim(),
            phone: cleanPhone(editForm.phone),
            email: editForm.email.trim(),
            sharePercentage: share,
            capitalInvested: Number(editForm.capitalInvested) || 0,
            status: editForm.status
        });
        setIsEditing(false);
        if (!result.ok) { setEditError(result.error || 'Could not update partner.'); return; }
        setEditInvestor(null);
    };

    const handleToggleStatus = async (inv) => {
        const nextStatus = (inv.status || 'active') === 'active' ? 'inactive' : 'active';
        if (nextStatus === 'inactive' && !confirm(`Deactivate ${inv.name}? They will stop receiving a share of profit until reactivated.`)) return;
        setBusyId(inv.id);
        await handleUpdateInvestor(inv.id, { status: nextStatus });
        setBusyId(null);
    };

    // ==========================================
    // 3. INVESTOR USER (LOGIN ACCOUNT) MODAL
    // ==========================================
    const [accountInvestor, setAccountInvestor] = useState(null);
    const [userModalTab, setUserModalTab] = useState('manage'); // 'manage' | 'create' | 'link'
    const [userModalError, setUserModalError] = useState('');
    const [userModalSuccess, setUserModalSuccess] = useState('');
    const [userModalBusy, setUserModalBusy] = useState(false);

    // Create user account state
    const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', password: '' });
    const [createdCreds, setCreatedCreds] = useState(null);
    const [copiedCreds, setCopiedCreds] = useState(false);

    // Reset password state
    const [userResetPassword, setUserResetPassword] = useState('');
    const [userResetDone, setUserResetDone] = useState('');
    const [copiedReset, setCopiedReset] = useState(false);

    // Link existing user state
    const [selectedUserId, setSelectedUserId] = useState('');
    const [linkUserSearch, setLinkUserSearch] = useState('');

    const openInvestorUserModal = (inv) => {
        setAccountInvestor(inv);
        setUserModalError('');
        setUserModalSuccess('');
        setCreatedCreds(null);
        setCopiedCreds(false);
        setUserResetDone('');
        setCopiedReset(false);
        setSelectedUserId(inv.userId || '');
        setLinkUserSearch('');

        const account = loginAccountFor(inv);
        if (account) {
            setUserModalTab('manage');
            setUserResetPassword(generatePassword());
        } else {
            setUserModalTab('create');
            setCreateForm({
                name: inv.name || '',
                phone: inv.phone || '',
                email: inv.email || '',
                password: generatePassword()
            });
        }
    };

    const closeInvestorUserModal = () => {
        if (!userModalBusy) {
            setAccountInvestor(null);
            setCreatedCreds(null);
            setUserResetDone('');
        }
    };

    const copyCredentials = async (phone, password) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const text = `Crossbar Arena Investor Portal\nPhone: ${phone}\nPassword: ${password}\nURL: ${origin}/investor`;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedCreds(true);
            setTimeout(() => setCopiedCreds(false), 3000);
        } catch {
            setCopiedCreds(false);
        }
    };

    const copyResetPassword = async (password) => {
        try {
            await navigator.clipboard.writeText(password);
            setCopiedReset(true);
            setTimeout(() => setCopiedReset(false), 3000);
        } catch {
            setCopiedReset(false);
        }
    };

    const handleCreateInvestorUser = async (e) => {
        e.preventDefault();
        if (!accountInvestor || userModalBusy) return;
        setUserModalError('');
        setUserModalSuccess('');

        const name = createForm.name.trim();
        const phone = cleanPhone(createForm.phone);
        const email = createForm.email.trim();
        const password = createForm.password.trim();

        if (name.length < 2) { setUserModalError('Full name must be at least 2 characters.'); return; }
        if (!isValidBdPhone(phone)) { setUserModalError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).'); return; }
        if (password.length < 6) { setUserModalError('Password must be at least 6 characters.'); return; }

        setUserModalBusy(true);
        const userRes = await handleCreateUser({ name, phone, email, password, role: 'investor' });
        if (!userRes.ok) {
            setUserModalBusy(false);
            setUserModalError(userRes.error || 'Could not create user account.');
            return;
        }

        // Link newly created user account to this investor record
        const linkRes = await handleUpdateInvestor(accountInvestor.id, { userId: userRes.user.id });
        setUserModalBusy(false);
        if (!linkRes.ok) {
            setUserModalError('Account created, but linking to investor failed: ' + (linkRes.error || ''));
            return;
        }

        setCreatedCreds({ name, phone, password });
        setUserModalSuccess(`Investor login account created and linked successfully!`);
        if (typeof refreshUsers === 'function') refreshUsers();
    };

    const handleResetInvestorPassword = async (e) => {
        e.preventDefault();
        const account = loginAccountFor(accountInvestor);
        if (!account || userModalBusy) return;
        setUserModalError('');
        setUserModalSuccess('');

        const password = userResetPassword.trim();
        if (password.length < 6) { setUserModalError('Password must be at least 6 characters.'); return; }

        setUserModalBusy(true);
        try {
            await handleAdminUpdateUser(account.id, { newPassword: password });
            setUserResetDone(password);
            setUserModalSuccess(`Password reset successfully for ${account.name}`);
            showNotice('success', `Password updated for ${account.name}`);
        } catch (err) {
            setUserModalError(err?.message || 'Could not reset password.');
        }
        setUserModalBusy(false);
    };

    const handleToggleInvestorUserDisabled = async () => {
        const account = loginAccountFor(accountInvestor);
        if (!account || userModalBusy) return;
        setUserModalError('');
        const newDisabled = !account.disabled;
        if (newDisabled && !confirm(`Disable login for ${account.name}? They will be logged out and cannot sign in until re-enabled.`)) return;

        setUserModalBusy(true);
        try {
            await handleAdminUpdateUser(account.id, { disabled: newDisabled });
            setUserModalSuccess(`Account ${newDisabled ? 'disabled' : 'enabled'} successfully.`);
            showNotice('success', `${account.name} ${newDisabled ? 'disabled' : 'enabled'}`);
            if (typeof refreshUsers === 'function') refreshUsers();
        } catch (err) {
            setUserModalError(err?.message || 'Could not update account status.');
        }
        setUserModalBusy(false);
    };

    const handlePromoteToInvestorRole = async () => {
        const account = loginAccountFor(accountInvestor);
        if (!account || userModalBusy) return;
        setUserModalError('');
        setUserModalBusy(true);
        try {
            await handleAdminUpdateUser(account.id, { role: 'investor' });
            setUserModalSuccess(`Role updated to Investor for ${account.name}. They can now access the Investor Portal.`);
            showNotice('success', `${account.name} role changed to Investor`);
            if (typeof refreshUsers === 'function') refreshUsers();
        } catch (err) {
            setUserModalError(err?.message || 'Could not update role.');
        }
        setUserModalBusy(false);
    };

    const handleUnlinkInvestorUser = async () => {
        if (!accountInvestor || userModalBusy) return;
        if (!confirm(`Unlink login account from ${accountInvestor.name}? The user login will stay in the system, but will no longer be attached to this partner.`)) return;
        setUserModalBusy(true);
        const res = await handleUpdateInvestor(accountInvestor.id, { userId: '' });
        setUserModalBusy(false);
        if (res.ok) {
            showNotice('success', 'Account unlinked');
            setAccountInvestor(prev => prev ? { ...prev, userId: '' } : null);
            setUserModalTab('create');
            setCreateForm({
                name: accountInvestor.name || '',
                phone: accountInvestor.phone || '',
                email: accountInvestor.email || '',
                password: generatePassword()
            });
            if (typeof refreshUsers === 'function') refreshUsers();
        } else {
            setUserModalError(res.error || 'Could not unlink account.');
        }
    };

    const handleLinkExistingUser = async (e) => {
        e.preventDefault();
        if (!accountInvestor || userModalBusy) return;
        setUserModalError('');
        setUserModalBusy(true);

        const targetUser = (users || []).find(u => u.id === selectedUserId);
        if (targetUser && targetUser.role !== 'investor' && targetUser.role !== 'admin') {
            try {
                await handleAdminUpdateUser(targetUser.id, { role: 'investor' });
            } catch (err) {
                console.error('Failed to update user role to investor:', err);
            }
        }

        const res = await handleUpdateInvestor(accountInvestor.id, { userId: selectedUserId });
        setUserModalBusy(false);
        if (res.ok) {
            showNotice('success', 'Login account linked successfully');
            setAccountInvestor(prev => prev ? { ...prev, userId: selectedUserId } : null);
            setUserModalTab('manage');
            setUserModalSuccess('Account linked to partner successfully!');
            if (typeof refreshUsers === 'function') refreshUsers();
        } else {
            setUserModalError(res.error || 'Could not link account.');
        }
    };

    const filteredUsersForLink = useMemo(() => {
        const q = linkUserSearch.trim().toLowerCase();
        return (users || []).filter(u => {
            if (!q) return true;
            return (u.name || '').toLowerCase().includes(q) || (u.phone || '').includes(q) || (u.email || '').toLowerCase().includes(q);
        });
    }, [users, linkUserSearch]);

    // ==========================================
    // 4. RECORD PAYOUT MODAL
    // ==========================================
    const [payoutInvestor, setPayoutInvestor] = useState(null);
    const [payoutForm, setPayoutForm] = useState({ amount: 0, datePaid: todayDhaka(), paymentMethod: 'bank_transfer', transactionNote: '' });
    const [payoutError, setPayoutError] = useState('');
    const [isPayingOut, setIsPayingOut] = useState(false);

    const openPayout = (inv) => {
        const share = shareById[inv.id];
        setPayoutError('');
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

    // ==========================================
    // 5. DELETE PARTNER MODAL
    // ==========================================
    const [deleteInvestor, setDeleteInvestor] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const payoutCountById = useMemo(() => {
        const map = {};
        payouts.forEach(p => { map[p.investorId] = (map[p.investorId] || 0) + 1; });
        return map;
    }, [payouts]);
    const deletePayoutCount = deleteInvestor ? (payoutCountById[deleteInvestor.id] || 0) : 0;
    const deleteNameMatches = deleteInvestor ? deleteConfirmText.trim().toLowerCase() === String(deleteInvestor.name || '').trim().toLowerCase() : false;

    const openDelete = (inv) => { setDeleteConfirmText(''); setDeleteError(''); setDeleteInvestor(inv); };
    const closeDelete = () => { if (!isDeleting) setDeleteInvestor(null); };

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

    const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400/60 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 outline-none transition-colors';

    const activeUser = accountInvestor ? loginAccountFor(accountInvestor) : null;

    return (
        <div className="space-y-6 animate-fade-in font-sans">

            {/* MONTH SELECTOR */}
            <div className="flex items-center justify-center gap-4 py-2">
                <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-lg bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white cursor-pointer" aria-label="Previous month">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-sm text-white tracking-widest uppercase">{formatMonth(selectedMonth)}</span>
                <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-lg bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white cursor-pointer" aria-label="Next month">
                    <ChevronRight className="w-4 h-4" />
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
                    [1, 2, 3].map(n => <div key={n} className="h-20 rounded-2xl bg-[#0c131a] border border-white/5 animate-pulse" />)
                ) : investors.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">No partners yet. Add the first equity partner below.</div>
                ) : investors.map(inv => {
                    const share = shareById[inv.id];
                    const isActive = (inv.status || 'active') === 'active';
                    const busy = busyId === inv.id;
                    const linkedUser = loginAccountFor(inv);
                    const hasUser = Boolean(linkedUser);

                    return (
                        <div key={inv.id} className={`p-4 rounded-2xl bg-[#0c131a] border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs ${isActive ? 'border-white/5 hover:border-lime-400/20' : 'border-white/5 opacity-70'}`}>
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

                                    {/* Interactive Investor User Login Status */}
                                    <div className="mt-1">
                                        <button
                                            type="button"
                                            onClick={() => openInvestorUserModal(inv)}
                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-mono cursor-pointer transition-all border ${hasUser
                                                ? linkedUser?.disabled
                                                    ? 'bg-rose-500/10 border-rose-500/25 text-rose-300 hover:bg-rose-500/20'
                                                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
                                                : 'bg-amber-400/10 border-amber-400/25 text-amber-300 hover:bg-amber-400/20'
                                            }`}
                                            title="Click to manage investor login account"
                                        >
                                            <KeyRound className="w-3 h-3" />
                                            {hasUser ? (
                                                <span>Login: <strong className="text-white">{linkedUser?.phone}</strong> ({linkedUser?.role})</span>
                                            ) : (
                                                <span>+ Set up login account</span>
                                            )}
                                        </button>
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
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => openEditInvestor(inv)}
                                        title="Edit partner details"
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
                                        aria-label="Edit partner details"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => openInvestorUserModal(inv)}
                                        title="Manage investor user account"
                                        className={`p-1.5 rounded-lg cursor-pointer disabled:opacity-50 transition-colors ${hasUser ? 'bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 border border-lime-400/30' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'}`}
                                        aria-label="Manage investor user account"
                                    >
                                        <KeyRound className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => handleToggleStatus(inv)}
                                        title={isActive ? 'Deactivate' : 'Reactivate'}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
                                        aria-label={isActive ? 'Deactivate partner' : 'Reactivate partner'}
                                    >
                                        {isActive ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => openDelete(inv)}
                                        title="Delete partner"
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer disabled:opacity-50"
                                        aria-label="Delete partner"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        disabled={busy || !isActive}
                                        onClick={() => openPayout(inv)}
                                        className="px-3 py-1.5 rounded-lg bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-slate-950 text-[12px] font-bold border border-lime-400/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Payout
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ADD INVESTOR BUTTON */}
            <button
                type="button"
                disabled={investors.length >= 10}
                onClick={() => { setAddError(''); setShowAddModal(true); }}
                className="w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 transition-all cursor-pointer disabled:opacity-50"
            >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add equity partner</span>
            </button>

            {/* ==================================================== */}
            {/* 1. ADD INVESTOR MODAL                                */}
            {/* ==================================================== */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
                    <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white font-display">Add Equity Partner</h3>
                            <button type="button" onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-xs text-slate-400">Active shares cannot exceed 100% in total ({Math.max(0, 100 - totalInvestorPct)}% available). Maximum 10 partners.</p>

                        <form onSubmit={handleAddInvestorSubmit} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1">Full name *</label>
                                <input type="text" required value={newInv.name} onChange={e => setNewInv(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Tariq Ahmed" />
                            </div>
                            <div>
                                <label className="block text-slate-300 mb-1">Mobile phone *</label>
                                <input type="tel" required placeholder="01XXXXXXXXX" value={newInv.phone} onChange={e => setNewInv(f => ({ ...f, phone: e.target.value }))} className={`${inputCls} font-mono`} />
                                <p className="text-[11px] text-slate-500 mt-1">Used for the partner&rsquo;s login and auto-matching.</p>
                            </div>
                            <div>
                                <label className="block text-slate-300 mb-1">Email</label>
                                <input type="email" value={newInv.email} onChange={e => setNewInv(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="partner@example.com" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-slate-300 mb-1">Share % *</label>
                                    <input type="number" required min={0} max={100} step="0.5" value={newInv.sharePercentage} onChange={e => setNewInv(f => ({ ...f, sharePercentage: e.target.value }))} className={`${inputCls} font-mono`} />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1">Capital (৳)</label>
                                    <input type="number" min={0} value={newInv.capitalInvested} onChange={e => setNewInv(f => ({ ...f, capitalInvested: e.target.value }))} className={`${inputCls} font-mono`} />
                                </div>
                            </div>

                            {addError && <p className="text-rose-400 text-[12px]">{addError}</p>}

                            <div className="flex gap-2 pt-2">
                                <button type="button" disabled={isAdding} onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isAdding} className="flex-1 py-2 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isAdding ? 'Saving…' : 'Save partner'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================================================== */}
            {/* 2. EDIT INVESTOR MODAL                               */}
            {/* ==================================================== */}
            {editInvestor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
                    <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-lime-400/10 text-lime-400"><Pencil className="w-4 h-4" /></div>
                                <h3 className="text-base font-bold text-white font-display">Edit Partner Details</h3>
                            </div>
                            <button type="button" onClick={() => setEditInvestor(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>

                        <form onSubmit={handleEditInvestorSubmit} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1">Full name *</label>
                                <input type="text" required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-slate-300 mb-1">Mobile phone *</label>
                                <input type="tel" required value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className={`${inputCls} font-mono`} />
                            </div>
                            <div>
                                <label className="block text-slate-300 mb-1">Email</label>
                                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-slate-300 mb-1">Share % *</label>
                                    <input type="number" required min={0} max={100} step="0.5" value={editForm.sharePercentage} onChange={e => setEditForm(f => ({ ...f, sharePercentage: e.target.value }))} className={`${inputCls} font-mono`} />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1">Capital (৳)</label>
                                    <input type="number" min={0} value={editForm.capitalInvested} onChange={e => setEditForm(f => ({ ...f, capitalInvested: e.target.value }))} className={`${inputCls} font-mono`} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-300 mb-1">Partner status</label>
                                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                                    <option value="active">Active (Receives profit dividends)</option>
                                    <option value="inactive">Inactive (Profit dividend paused)</option>
                                </select>
                            </div>

                            {editError && <p className="text-rose-400 text-[12px]">{editError}</p>}

                            <div className="flex gap-2 pt-2">
                                <button type="button" disabled={isEditing} onClick={() => setEditInvestor(null)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isEditing} className="flex-1 py-2 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isEditing ? 'Saving…' : 'Save changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================================================== */}
            {/* 3. INVESTOR USER (LOGIN ACCOUNT) MODAL                */}
            {/* ==================================================== */}
            {accountInvestor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
                    <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-md w-full space-y-4 text-xs">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 shrink-0">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white font-display">Investor User Account</h3>
                                    <p className="text-[12px] text-slate-400">
                                        Partner: <strong className="text-white">{accountInvestor.name}</strong> ({accountInvestor.phone})
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={closeInvestorUserModal} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Top Navigation Tabs */}
                        <div className="flex border-b border-white/10 gap-2 pb-2">
                            {activeUser && (
                                <button
                                    type="button"
                                    onClick={() => { setUserModalTab('manage'); setUserModalError(''); setUserModalSuccess(''); }}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${userModalTab === 'manage' ? 'bg-lime-400 text-slate-950' : 'text-slate-400 hover:text-white bg-white/5'}`}
                                >
                                    Manage Account
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => { setUserModalTab('create'); setUserModalError(''); setUserModalSuccess(''); setCreatedCreds(null); }}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${userModalTab === 'create' ? 'bg-lime-400 text-slate-950' : 'text-slate-400 hover:text-white bg-white/5'}`}
                            >
                                {activeUser ? 'Create New Login' : '1. Create Login Account'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setUserModalTab('link'); setUserModalError(''); setUserModalSuccess(''); }}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${userModalTab === 'link' ? 'bg-lime-400 text-slate-950' : 'text-slate-400 hover:text-white bg-white/5'}`}
                            >
                                {activeUser ? 'Switch Linked User' : '2. Link Existing User'}
                            </button>
                        </div>

                        {/* Messages */}
                        {userModalError && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{userModalError}</span>
                            </div>
                        )}
                        {userModalSuccess && (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-start gap-2">
                                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{userModalSuccess}</span>
                            </div>
                        )}

                        {/* TAB 1: MANAGE EXISTING USER */}
                        {userModalTab === 'manage' && activeUser && (
                            <div className="space-y-4">
                                {/* Account Card */}
                                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-white text-sm flex items-center gap-2">
                                            <span>{activeUser.name}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${activeUser.role === 'investor' ? 'bg-violet-400/20 text-violet-300 border border-violet-400/30' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'}`}>
                                                {activeUser.role}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${activeUser.disabled ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                                                {activeUser.disabled ? 'Disabled' : 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-slate-400 font-mono text-[11px] space-y-0.5">
                                        <div>Login Mobile: <span className="text-white font-bold">{activeUser.phone}</span></div>
                                        {activeUser.email && <div>Email: <span className="text-white">{activeUser.email}</span></div>}
                                        <div>Link type: <span className="text-slate-300">{accountInvestor.userId === activeUser.id ? 'Directly linked by User ID' : 'Auto-matched by phone number'}</span></div>
                                    </div>
                                </div>

                                {/* Warning if role is not investor */}
                                {activeUser.role !== 'investor' && activeUser.role !== 'admin' && (
                                    <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-200 flex flex-col gap-2">
                                        <p>This user has the <strong className="text-white">{activeUser.role}</strong> role. They cannot access the investor portal until their role is set to <strong>investor</strong>.</p>
                                        <button
                                            type="button"
                                            disabled={userModalBusy}
                                            onClick={handlePromoteToInvestorRole}
                                            className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer self-start disabled:opacity-50"
                                        >
                                            Promote to Investor Role
                                        </button>
                                    </div>
                                )}

                                {/* Reset Password Section */}
                                <div className="p-3.5 rounded-xl bg-[#080d12] border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-slate-200 font-bold flex items-center gap-1.5">
                                            <Lock className="w-3.5 h-3.5 text-lime-400" />
                                            <span>Reset Login Password</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setUserResetPassword(generatePassword())}
                                            className="text-[11px] text-lime-400 hover:text-lime-300 font-semibold cursor-pointer"
                                        >
                                            Generate secure
                                        </button>
                                    </div>

                                    {userResetDone ? (
                                        <div className="p-3 rounded-xl bg-lime-400/10 border border-lime-400/30 space-y-2">
                                            <p className="text-slate-200">New password saved for <strong className="text-white">{activeUser.phone}</strong>:</p>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 px-3 py-2 rounded-xl bg-[#080d12] border border-lime-400/30 text-lime-300 font-mono text-sm break-all select-all">{userResetDone}</code>
                                                <button
                                                    type="button"
                                                    onClick={() => copyResetPassword(userResetDone)}
                                                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold cursor-pointer flex items-center gap-1.5"
                                                >
                                                    {copiedReset ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                    <span>{copiedReset ? 'Copied' : 'Copy'}</span>
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-500">Pass this password on to the partner now; it is not displayed again.</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleResetInvestorPassword} className="space-y-2">
                                            <input
                                                type="text"
                                                autoComplete="off"
                                                placeholder="min 6 characters"
                                                value={userResetPassword}
                                                onChange={e => setUserResetPassword(e.target.value)}
                                                className={`${inputCls} font-mono`}
                                            />
                                            <button
                                                type="submit"
                                                disabled={userModalBusy}
                                                className="w-full py-2 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold rounded-xl cursor-pointer disabled:opacity-50"
                                            >
                                                {userModalBusy ? 'Updating…' : 'Set new password'}
                                            </button>
                                        </form>
                                    )}
                                </div>

                                {/* Account Actions: Disable & Unlink */}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        disabled={userModalBusy}
                                        onClick={handleToggleInvestorUserDisabled}
                                        className={`flex-1 py-2 px-3 rounded-xl font-bold cursor-pointer border transition-colors disabled:opacity-50 ${activeUser.disabled ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/25' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/25'}`}
                                    >
                                        {activeUser.disabled ? 'Re-enable account' : 'Disable login'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={userModalBusy}
                                        onClick={handleUnlinkInvestorUser}
                                        className="py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer border border-white/10 disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <Unlink className="w-3.5 h-3.5" />
                                        <span>Unlink</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: CREATE NEW LOGIN ACCOUNT */}
                        {userModalTab === 'create' && (
                            <div className="space-y-3">
                                <p className="text-slate-400">
                                    Create a user account so <strong className="text-white">{accountInvestor.name}</strong> can sign in to the Investor Portal with their mobile phone and view dividends.
                                </p>

                                {createdCreds ? (
                                    <div className="p-4 rounded-xl bg-lime-400/10 border border-lime-400/30 space-y-3">
                                        <div className="flex items-center gap-2 text-lime-400 font-bold">
                                            <Check className="w-4 h-4" />
                                            <span>Account Created &amp; Linked!</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-[#080d12] border border-white/10 space-y-1 font-mono text-[12px]">
                                            <div className="text-slate-400">Name: <span className="text-white font-bold">{createdCreds.name}</span></div>
                                            <div className="text-slate-400">Phone: <span className="text-white font-bold">{createdCreds.phone}</span></div>
                                            <div className="text-slate-400">Password: <span className="text-lime-300 font-bold">{createdCreds.password}</span></div>
                                            <div className="text-slate-400">Role: <span className="text-violet-300 font-bold">investor</span></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => copyCredentials(createdCreds.phone, createdCreds.password)}
                                                className="flex-1 py-2 px-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                {copiedCreds ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                <span>{copiedCreds ? 'Copied to clipboard' : 'Copy credentials'}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={closeInvestorUserModal}
                                                className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold cursor-pointer"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleCreateInvestorUser} className="space-y-3">
                                        <div>
                                            <label className="block text-slate-300 mb-1">Full name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={createForm.name}
                                                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 mb-1">Login mobile number *</label>
                                            <input
                                                type="tel"
                                                required
                                                placeholder="01XXXXXXXXX"
                                                value={createForm.phone}
                                                onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                                                className={`${inputCls} font-mono`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 mb-1">Email (optional)</label>
                                            <input
                                                type="email"
                                                value={createForm.email}
                                                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-slate-300">Initial password *</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setCreateForm(f => ({ ...f, password: generatePassword() }))}
                                                    className="text-[11px] text-lime-400 hover:text-lime-300 font-semibold cursor-pointer"
                                                >
                                                    Regenerate
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                autoComplete="off"
                                                value={createForm.password}
                                                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                                                className={`${inputCls} font-mono`}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={userModalBusy}
                                            className="w-full py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50 mt-2"
                                        >
                                            {userModalBusy ? 'Creating account…' : 'Create & Link Investor Login'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* TAB 3: LINK EXISTING USER */}
                        {userModalTab === 'link' && (
                            <form onSubmit={handleLinkExistingUser} className="space-y-3">
                                <p className="text-slate-400">
                                    Select an existing user account to link to <strong className="text-white">{accountInvestor.name}</strong>. If the user does not have the investor role, they will be upgraded automatically.
                                </p>

                                <div>
                                    <label className="block text-slate-300 mb-1">Search user</label>
                                    <input
                                        type="search"
                                        placeholder="Search by name or mobile number"
                                        value={linkUserSearch}
                                        onChange={e => setLinkUserSearch(e.target.value)}
                                        className={inputCls}
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1">Choose user account *</label>
                                    <select
                                        value={selectedUserId}
                                        onChange={e => setSelectedUserId(e.target.value)}
                                        className={inputCls}
                                    >
                                        <option value="">— Select an account —</option>
                                        {filteredUsersForLink.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} · {u.phone} ({u.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        disabled={userModalBusy}
                                        onClick={closeInvestorUserModal}
                                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={userModalBusy || !selectedUserId}
                                        className="flex-1 py-2 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {userModalBusy ? 'Linking…' : 'Link account'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ==================================================== */}
            {/* 4. RECORD PAYOUT MODAL                               */}
            {/* ==================================================== */}
            {payoutInvestor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
                    <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white">Record Investor Payout</h3>
                            <button type="button" onClick={() => setPayoutInvestor(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-xs text-slate-400">
                            <strong className="text-white">{payoutInvestor.name}</strong> ({payoutInvestor.sharePercentage}%) · {formatMonth(selectedMonth)}
                            {shareById[payoutInvestor.id] && (
                                <span className="block mt-1 font-mono">share {formatMoney(shareById[payoutInvestor.id].shareAmount)} · paid {formatMoney(shareById[payoutInvestor.id].paidAmount)} · owed {formatMoney(shareById[payoutInvestor.id].balance)}</span>
                            )}
                        </p>
                        <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                            <span className="text-slate-500">Partner prefers: </span>
                            <span className="text-white font-semibold break-words">{payoutDetailsSummary(payoutInvestor.payoutDetails) || 'no preference set'}</span>
                            {payoutInvestor.payoutDetails?.method && payoutInvestor.payoutDetails?.note && (
                                <span className="block text-slate-400 mt-0.5">Note: {payoutInvestor.payoutDetails.note}</span>
                            )}
                        </div>

                        <form onSubmit={handlePayoutSubmit} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1">Payout amount (৳)</label>
                                <input type="number" required min={1} value={payoutForm.amount} onChange={e => setPayoutForm(f => ({ ...f, amount: e.target.value }))} className={`${inputCls} font-mono`} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-slate-300 mb-1">Date paid</label>
                                    <input type="date" required value={payoutForm.datePaid} onChange={e => setPayoutForm(f => ({ ...f, datePaid: e.target.value }))} className={`${inputCls} font-mono`} />
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
                                <input type="text" placeholder="e.g. bKash TrxID 8H3K…" value={payoutForm.transactionNote} onChange={e => setPayoutForm(f => ({ ...f, transactionNote: e.target.value }))} className={inputCls} />
                            </div>

                            {payoutError && <p className="text-rose-400 text-[12px]">{payoutError}</p>}

                            <div className="flex gap-2 pt-2">
                                <button type="button" disabled={isPayingOut} onClick={() => setPayoutInvestor(null)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isPayingOut} className="flex-1 py-2 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isPayingOut ? 'Recording…' : 'Confirm payout'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================================================== */}
            {/* 5. DELETE PARTNER MODAL                              */}
            {/* ==================================================== */}
            {deleteInvestor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="delete-partner-title">
                    <div className="bg-[#0c131a] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 text-xs">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300"><AlertTriangle className="w-4 h-4" /></div>
                            <h3 id="delete-partner-title" className="text-base font-bold text-white">Delete partner</h3>
                        </div>

                        <p className="text-slate-400">
                            <strong className="text-white">{deleteInvestor.name}</strong> · {deleteInvestor.sharePercentage}% share · invested {formatMoney(deleteInvestor.capitalInvested)}
                        </p>

                        {deletePayoutCount === 0 ? (
                            <p className="text-slate-300">This partner has no payouts on record and will be removed completely. This cannot be undone.</p>
                        ) : (
                            <>
                                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-200 space-y-1">
                                    <p className="font-semibold">{deletePayoutCount} payout{deletePayoutCount === 1 ? '' : 's'} on record · {formatMoney(lifetimePaidById[deleteInvestor.id] || 0)} paid in total.</p>
                                    <p className="text-amber-200/80">Deactivating keeps the partner and their history, and stops their profit share. Deleting permanently removes the partner record; past payouts stay in the ledger so earlier reports do not change. This cannot be undone.</p>
                                </div>
                                <div>
                                    <label htmlFor="delete-partner-confirm" className="block text-slate-300 mb-1">To delete permanently, type the partner&rsquo;s name: <strong className="text-white">{deleteInvestor.name}</strong></label>
                                    <input id="delete-partner-confirm" type="text" autoComplete="off" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className={inputCls} />
                                </div>
                            </>
                        )}

                        <p className="text-[11px] text-slate-500">The partner&rsquo;s login account is not removed. You can manage or disable it under Users or via the User Account button.</p>

                        {deleteError && <p className="text-rose-400 text-[12px]" role="alert">{deleteError}</p>}

                        <div className="flex flex-wrap gap-2 pt-1">
                            <button type="button" disabled={isDeleting} onClick={closeDelete} className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                            {deletePayoutCount > 0 && (deleteInvestor.status || 'active') === 'active' && (
                                <button type="button" disabled={isDeleting} onClick={() => handleDeleteConfirm('deactivate')} className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-bold cursor-pointer disabled:opacity-50">Deactivate</button>
                            )}
                            <button type="button" disabled={isDeleting || (deletePayoutCount > 0 && !deleteNameMatches)} onClick={() => handleDeleteConfirm(deletePayoutCount > 0 ? 'permanent' : 'delete')} className="flex-1 py-2 px-3 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                                {isDeleting ? 'Working…' : deletePayoutCount > 0 ? 'Delete permanently' : 'Delete partner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
