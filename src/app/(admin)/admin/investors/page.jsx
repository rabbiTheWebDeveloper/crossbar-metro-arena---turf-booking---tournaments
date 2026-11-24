'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { formatMoney, formatDate, formatMonth, shiftMonth, PAYOUT_METHODS, paymentMethodLabel, payoutDetailsSummary } from '@/data/finance';
import { cleanPhone, isValidBdPhone } from '@/lib/phone';
import {
    ChevronLeft, ChevronRight, Plus, Pencil, Mail, Send, Link2, UserMinus, UserCheck,
    Trash2, KeyRound, AlertTriangle, Copy, Check, CheckCircle2, Info, UserPlus
} from 'lucide-react';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER_EMAIL_RE = /^01[3-9]\d{8}@bookcrossbar\.com$/i;
const hasDeliverableEmail = (email) => {
    const clean = String(email || '').trim().toLowerCase();
    return Boolean(clean && EMAIL_RE.test(clean) && !PLACEHOLDER_EMAIL_RE.test(clean));
};

/** 10 characters without look-alikes (0/O, 1/l/I) so it can be read out over the phone. */
const makeRandomPassword = () => {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const bytes = new Uint32Array(10);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
};

const emailReasonText = (status) => {
    if (!status) return '';
    if (status.sent) return `Email sent to ${status.toEmail || 'investor'}.`;
    if (status.reason === 'no_deliverable_email') return 'Email not sent: no valid email address was provided.';
    if (status.reason === 'mail_not_configured') return 'Email not sent: GMAIL_USER / GMAIL_APP_PASSWORD is not configured in .env.';
    if (status.reason === 'skipped_by_admin') return 'Email sending was unchecked.';
    return `Email could not be delivered (${status.reason || 'mail server error'}).`;
};

const makeEmptyNewInvestor = () => ({
    name: '',
    phone: '',
    email: '',
    sharePercentage: '',
    capitalInvested: '',
    joinedDate: todayDhaka(),
    createLogin: true,
    password: '',
    sendEmail: true
});

export default function AdminInvestorsPage() {
    const {
        investors, payouts, users, isAdmin, isLoadingData, showNotice, calculateMonthlyFinance,
        refreshUsers, handleCreateInvestor, handleUpdateInvestor, handleDeleteInvestor,
        handleInvestorMailAction, handleRecordPayout
    } = useArena();

    useEffect(() => { refreshUsers(); }, [refreshUsers]);

    const [selectedMonth, setSelectedMonth] = useState(() => todayDhaka().slice(0, 7));
    const financeReport = useMemo(() => calculateMonthlyFinance(selectedMonth), [calculateMonthlyFinance, selectedMonth]);
    const shareById = useMemo(() => Object.fromEntries((financeReport.investorShares || []).map(s => [s.investor.id, s])), [financeReport]);

    const activeInvestors = useMemo(() => investors.filter(i => (i.status || 'active') === 'active'), [investors]);
    const totalInvestorPct = useMemo(
        () => Math.round(activeInvestors.reduce((sum, inv) => sum + (Number(inv.sharePercentage) || 0), 0) * 100) / 100,
        [activeInvestors]
    );
    const totalActiveCapital = useMemo(
        () => activeInvestors.reduce((sum, inv) => sum + (Number(inv.capitalInvested) || 0), 0),
        [activeInvestors]
    );
    const totalAllCapital = useMemo(
        () => investors.reduce((sum, inv) => sum + (Number(inv.capitalInvested) || 0), 0),
        [investors]
    );

    const lifetimePaidById = useMemo(() => {
        const map = {};
        payouts.forEach(p => { map[p.investorId] = (map[p.investorId] || 0) + (Number(p.amount) || 0); });
        return map;
    }, [payouts]);

    const investorUsers = useMemo(() => (users || []).filter(u => u.role === 'investor'), [users]);

    /** The login behind a partner: the linked account first, otherwise the account with the same mobile number. */
    const loginAccountFor = (inv) => {
        if (!inv) return null;
        const list = users || [];
        return list.find(u => inv.userId && u.id === inv.userId)
            || list.find(u => inv.phone && cleanPhone(u.phone) === cleanPhone(inv.phone))
            || null;
    };

    const bestEmailFor = (inv) => {
        if (hasDeliverableEmail(inv?.email)) return String(inv.email).trim().toLowerCase();
        const acct = loginAccountFor(inv);
        if (hasDeliverableEmail(acct?.email)) return String(acct.email).trim().toLowerCase();
        return '';
    };

    // ---- Add partner modal ----
    const [showAddModal, setShowAddModal] = useState(false);
    const [newInv, setNewInv] = useState(makeEmptyNewInvestor);
    const [addError, setAddError] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [createdSummary, setCreatedSummary] = useState(null);
    const [copiedCreated, setCopiedCreated] = useState(false);

    // ---- Edit partner modal ----
    const [editInvestor, setEditInvestor] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', sharePercentage: '', capitalInvested: '', joinedDate: '', status: 'active', syncAccount: true });
    const [editError, setEditError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // ---- Mail / Resend modal ----
    const [mailInvestor, setMailInvestor] = useState(null);
    const [mailEmail, setMailEmail] = useState('');
    const [mailBusyAction, setMailBusyAction] = useState('');
    const [mailFeedback, setMailFeedback] = useState(null); // { type: 'success'|'error', text }

    // ---- Payout modal ----
    const [payoutInvestor, setPayoutInvestor] = useState(null);
    const [payoutForm, setPayoutForm] = useState({ amount: 0, datePaid: todayDhaka(), paymentMethod: 'bank_transfer', transactionNote: '' });
    const [payoutError, setPayoutError] = useState('');
    const [isPayingOut, setIsPayingOut] = useState(false);

    // ---- Link login modal ----
    const [linkInvestor, setLinkInvestor] = useState(null);
    const [linkUserId, setLinkUserId] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    // ---- Delete modal ----
    const [deleteInvestor, setDeleteInvestor] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteAlsoAccount, setDeleteAlsoAccount] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // ---- Reset password / Create login modal ----
    const [resetInvestor, setResetInvestor] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [resetSendEmail, setResetSendEmail] = useState(true);
    const [resetError, setResetError] = useState('');
    const [resetResult, setResetResult] = useState(null); // { mode, password, emailStatus, phone, name }
    const [resetCopied, setResetCopied] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    const [busyId, setBusyId] = useState(null);

    const handlePrevMonth = () => setSelectedMonth(m => shiftMonth(m, -1));
    const handleNextMonth = () => setSelectedMonth(m => shiftMonth(m, 1));

    // ---- Create partner ----
    const openAddModal = () => {
        setAddError('');
        setCreatedSummary(null);
        setCopiedCreated(false);
        setNewInv({ ...makeEmptyNewInvestor(), password: makeRandomPassword() });
        setShowAddModal(true);
    };
    const closeAddModal = () => {
        if (isAdding) return;
        setShowAddModal(false);
        setCreatedSummary(null);
    };

    const handleAddInvestorSubmit = async (e) => {
        e.preventDefault();
        setAddError('');
        const name = newInv.name.trim();
        const phone = cleanPhone(newInv.phone);
        const email = newInv.email.trim().toLowerCase();
        const share = Number(newInv.sharePercentage);
        const capital = Number(newInv.capitalInvested === '' ? 0 : newInv.capitalInvested);
        const password = newInv.password.trim();

        if (name.length < 2) { setAddError('Enter the investor full name (at least 2 characters).'); return; }
        if (!isValidBdPhone(phone)) { setAddError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).'); return; }
        if (email && !EMAIL_RE.test(email)) { setAddError('Enter a valid email address.'); return; }
        if (newInv.sharePercentage === '' || Number.isNaN(share) || share < 0 || share > 100) { setAddError('Share must be between 0 and 100.'); return; }
        if (Number.isNaN(capital) || capital < 0) { setAddError('Invested amount must be zero or more.'); return; }
        if (totalInvestorPct + share > 100.0001) { setAddError(`Active shares would total ${Math.round((totalInvestorPct + share) * 100) / 100}%. Maximum is 100%.`); return; }
        if (investors.length >= 10) { setAddError('Maximum 10 partners allowed.'); return; }
        if (newInv.createLogin && password.length < 6) { setAddError('Login password must be at least 6 characters.'); return; }

        setIsAdding(true);
        const result = await handleCreateInvestor({
            name,
            phone,
            email,
            sharePercentage: share,
            capitalInvested: capital,
            joinedDate: newInv.joinedDate || todayDhaka(),
            createLogin: newInv.createLogin,
            password: newInv.createLogin ? password : '',
            sendEmail: newInv.sendEmail
        });
        setIsAdding(false);
        if (!result.ok) { setAddError(result.error || 'Could not save the partner.'); return; }

        setCreatedSummary({
            investor: result.investor,
            password: result.accountCreated ? password : '',
            accountCreated: Boolean(result.accountCreated),
            accountLinked: Boolean(result.accountLinked),
            accountNote: result.accountNote || '',
            emailStatus: result.emailStatus || null
        });
        setCopiedCreated(false);
    };

    // ---- Edit partner (all fields including capitalInvested) ----
    const openEditModal = (inv) => {
        setEditError('');
        setEditForm({
            name: inv.name || '',
            phone: inv.phone || '',
            email: inv.email || '',
            sharePercentage: String(inv.sharePercentage ?? 0),
            capitalInvested: String(inv.capitalInvested ?? 0),
            joinedDate: inv.joinedDate || todayDhaka(),
            status: inv.status || 'active',
            syncAccount: true
        });
        setEditInvestor(inv);
    };
    const closeEditModal = () => { if (!isEditing) setEditInvestor(null); };

    const editAvailableShare = useMemo(() => {
        if (!editInvestor) return Math.max(0, 100 - totalInvestorPct);
        const ownActiveShare = (editInvestor.status || 'active') === 'active' ? (Number(editInvestor.sharePercentage) || 0) : 0;
        return Math.max(0, Math.round((100 - (totalInvestorPct - ownActiveShare)) * 100) / 100);
    }, [editInvestor, totalInvestorPct]);

    const handleEditInvestorSubmit = async (e) => {
        e.preventDefault();
        if (!editInvestor || isEditing) return;
        setEditError('');

        const name = editForm.name.trim();
        const phone = cleanPhone(editForm.phone);
        const email = editForm.email.trim().toLowerCase();
        const share = Number(editForm.sharePercentage);
        const capital = Number(editForm.capitalInvested === '' ? 0 : editForm.capitalInvested);

        if (name.length < 2) { setEditError('Full name must be at least 2 characters.'); return; }
        if (!isValidBdPhone(phone)) { setEditError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).'); return; }
        if (email && !EMAIL_RE.test(email)) { setEditError('Enter a valid email address.'); return; }
        if (editForm.sharePercentage === '' || Number.isNaN(share) || share < 0 || share > 100) { setEditError('Share must be between 0 and 100.'); return; }
        if (Number.isNaN(capital) || capital < 0) { setEditError('Invested amount must be zero or more.'); return; }
        if (editForm.status === 'active' && share > editAvailableShare + 0.0001) {
            setEditError(`Active share cannot exceed ${editAvailableShare}% (remaining out of 100%).`);
            return;
        }

        setIsEditing(true);
        const result = await handleUpdateInvestor(editInvestor.id, {
            name,
            phone,
            email,
            sharePercentage: share,
            capitalInvested: capital,
            joinedDate: editForm.joinedDate || editInvestor.joinedDate,
            status: editForm.status,
            syncAccount: editForm.syncAccount
        });
        setIsEditing(false);
        if (!result.ok) { setEditError(result.error || 'Could not update the partner.'); return; }
        setEditInvestor(null);
    };

    const handleToggleStatus = async (inv) => {
        const nextStatus = (inv.status || 'active') === 'active' ? 'inactive' : 'active';
        if (nextStatus === 'inactive' && !confirm(`Deactivate ${inv.name}? They will stop receiving a share of profit until reactivated.`)) return;
        setBusyId(inv.id);
        await handleUpdateInvestor(inv.id, { status: nextStatus });
        setBusyId(null);
    };

    // ---- Mail / Resend modal ----
    const openMailModal = (inv) => {
        setMailFeedback(null);
        setMailBusyAction('');
        setMailEmail(bestEmailFor(inv));
        setMailInvestor(inv);
    };
    const closeMailModal = () => { if (!mailBusyAction) setMailInvestor(null); };
    const mailAccount = loginAccountFor(mailInvestor);

    const handleSendMailAction = async (action) => {
        if (!mailInvestor || mailBusyAction) return;
        setMailFeedback(null);
        const cleanEmail = mailEmail.trim().toLowerCase();
        if (!hasDeliverableEmail(cleanEmail)) {
            setMailFeedback({ type: 'error', text: 'Enter a valid email address to send the mail.' });
            return;
        }
        setMailBusyAction(action);
        const res = await handleInvestorMailAction(mailInvestor.id, {
            action,
            email: cleanEmail,
            saveEmail: true
        });
        setMailBusyAction('');
        if (res.ok) {
            setMailFeedback({ type: 'success', text: res.message || 'Email sent successfully.' });
        } else {
            setMailFeedback({ type: 'error', text: res.error || 'Could not send email.' });
        }
    };

    // ---- Delete partner ----
    const payoutCountById = useMemo(() => {
        const map = {};
        payouts.forEach(p => { map[p.investorId] = (map[p.investorId] || 0) + 1; });
        return map;
    }, [payouts]);
    const deletePayoutCount = deleteInvestor ? (payoutCountById[deleteInvestor.id] || 0) : 0;
    const deleteNameMatches = deleteInvestor ? deleteConfirmText.trim().toLowerCase() === String(deleteInvestor.name || '').trim().toLowerCase() : false;
    const deleteAccount = loginAccountFor(deleteInvestor);
    const canDeleteLinkedLogin = Boolean(isAdmin && deleteAccount && deleteAccount.role === 'investor');

    const openDelete = (inv) => {
        setDeleteConfirmText('');
        setDeleteAlsoAccount(false);
        setDeleteError('');
        setDeleteInvestor(inv);
    };
    const closeDelete = () => { if (!isDeleting) setDeleteInvestor(null); };
    /** mode: 'delete' (no payouts), 'permanent' (payouts kept in the ledger) or 'deactivate' */
    const handleDeleteConfirm = async (mode) => {
        if (!deleteInvestor || isDeleting) return;
        setDeleteError('');
        setIsDeleting(true);
        const result = mode === 'deactivate'
            ? await handleUpdateInvestor(deleteInvestor.id, { status: 'inactive' })
            : await handleDeleteInvestor(deleteInvestor.id, {
                permanent: mode === 'permanent',
                deleteAccount: canDeleteLinkedLogin && deleteAlsoAccount
            });
        setIsDeleting(false);
        if (!result.ok) { setDeleteError(result.error || 'Could not complete the action.'); return; }
        setDeleteInvestor(null);
    };

    // ---- Reset password / Create login modal ----
    const resetAccount = loginAccountFor(resetInvestor);

    const openReset = (inv) => {
        const email = bestEmailFor(inv);
        const acct = loginAccountFor(inv);
        setResetPassword(acct ? '' : makeRandomPassword());
        setResetEmail(email);
        setResetSendEmail(Boolean(email));
        setResetError('');
        setResetResult(null);
        setResetCopied(false);
        setResetInvestor(inv);
    };
    const closeReset = () => { if (!isResetting && !isSendingOtp) setResetInvestor(null); };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (!resetInvestor || isResetting || isSendingOtp) return;
        setResetError('');
        const password = resetPassword.trim();
        const email = resetEmail.trim().toLowerCase();
        if (password.length < 6) { setResetError('Password must be at least 6 characters.'); return; }
        if (email && !EMAIL_RE.test(email)) { setResetError('Enter a valid email address.'); return; }
        if (resetSendEmail && !hasDeliverableEmail(email)) {
            setResetError('Enter a valid email address, or uncheck "Send email".');
            return;
        }

        const isCreating = !resetAccount;
        setIsResetting(true);
        const res = await handleInvestorMailAction(resetInvestor.id, isCreating
            ? { action: 'create_login', password, email, sendEmail: resetSendEmail }
            : { action: 'reset_password', newPassword: password, email, sendEmail: resetSendEmail, saveEmail: Boolean(email) });
        setIsResetting(false);
        if (!res.ok) {
            setResetError(res.error || (isCreating ? 'Could not create login account.' : 'Could not reset password.'));
            return;
        }
        setResetResult({
            mode: isCreating ? 'created' : 'reset',
            password,
            name: res.user?.name || resetInvestor.name,
            phone: res.user?.phone || resetInvestor.phone,
            emailStatus: res.emailStatus || null
        });
        setResetCopied(false);
    };

    const handleSendResetOtpFromModal = async () => {
        if (!resetInvestor || !resetAccount || isResetting || isSendingOtp) return;
        setResetError('');
        const email = resetEmail.trim().toLowerCase();
        if (!hasDeliverableEmail(email)) {
            setResetError('Enter a valid email address above to send the 6-digit password reset code.');
            return;
        }
        setIsSendingOtp(true);
        const res = await handleInvestorMailAction(resetInvestor.id, {
            action: 'send_reset_code',
            email,
            saveEmail: true
        });
        setIsSendingOtp(false);
        if (!res.ok) {
            setResetError(res.error || 'Could not send reset code.');
            return;
        }
        setResetResult({
            mode: 'otp',
            password: '',
            name: resetAccount.name || resetInvestor.name,
            phone: resetAccount.phone || resetInvestor.phone,
            emailStatus: res.emailStatus || { sent: true, toEmail: email }
        });
    };

    const copyText = async (text, setter) => {
        try { await navigator.clipboard.writeText(text); setter(true); } catch { setter(false); }
    };

    // ---- Payout modal ----
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

    // ---- Link login modal ----
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

    const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400/60 rounded-xl px-3 py-2 text-white outline-none placeholder:text-slate-600';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400">Active investor share</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">{totalInvestorPct}%</div>
          <div className="text-[12px] text-slate-500">Owners keep {Math.max(0, Math.round((100 - totalInvestorPct) * 100) / 100)}% · {activeInvestors.length} active partner{activeInvestors.length === 1 ? '' : 's'}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400">Total invested amount</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-lime-400">{formatMoney(totalActiveCapital)}</div>
          <div className="text-[12px] text-slate-500">
            {totalAllCapital !== totalActiveCapital ? `all partners ${formatMoney(totalAllCapital)}` : `${investors.length} partner${investors.length === 1 ? '' : 's'} total`}
          </div>
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
          [1, 2, 3].map(n => <div key={n} className="h-24 rounded-2xl bg-[#0c131a] border border-white/5 animate-pulse"/>)
        ) : investors.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">No partners yet. Add the first equity partner below.</div>
        ) : investors.map(inv => {
            const share = shareById[inv.id];
            const isActive = (inv.status || 'active') === 'active';
            const busy = busyId === inv.id;
            const acct = loginAccountFor(inv);
            const emailText = bestEmailFor(inv);
            return (<div key={inv.id} className={`p-4 rounded-2xl bg-[#0c131a] border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs ${isActive ? 'border-white/5 hover:border-lime-400/20' : 'border-white/5 opacity-70'}`}>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-10 h-10 rounded-full font-black flex items-center justify-center text-sm font-mono shrink-0 ${isActive ? 'bg-lime-400 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                  {(inv.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm truncate flex items-center gap-2 flex-wrap">
                    <span>{inv.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-lime-400/10 text-lime-300 border border-lime-400/20">
                      {inv.sharePercentage}%
                    </span>
                    {!isActive && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-slate-700 text-slate-300 font-mono">inactive</span>}
                  </div>
                  <div className="text-[12px] text-slate-300 font-mono mt-0.5 truncate">
                    Invested <strong className="text-white">{formatMoney(inv.capitalInvested)}</strong>
                    {inv.phone ? ` · ${inv.phone}` : ''}
                    {inv.joinedDate ? ` · joined ${formatDate(inv.joinedDate, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate flex items-center gap-2 flex-wrap">
                    <span>{emailText || 'No email'}</span>
                    <span>·</span>
                    {acct ? (
                      <span className="text-emerald-400/90">Login: {userLabel(acct.id) || acct.phone}</span>
                    ) : (
                      <span className="text-amber-300/80">No login account</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 pl-13 lg:pl-0">
                <div className="text-right font-mono">
                  <div className="text-white font-bold text-sm">{formatMoney(share ? share.shareAmount : 0)} <span className="text-[10px] text-slate-500 font-normal">share</span></div>
                  <div className="text-[11px] text-slate-400">
                    paid {formatMoney(share ? share.paidAmount : 0)} this month{share && share.balance > 0 ? <span className="text-amber-300"> · owed {formatMoney(share.balance)}</span> : share && share.isPaid ? <span className="text-emerald-400"> · settled</span> : null}
                  </div>
                  <div className="text-[11px] text-slate-500">lifetime {formatMoney(lifetimePaidById[inv.id] || 0)}</div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button type="button" disabled={busy} onClick={() => openEditModal(inv)} title="Edit partner details & invested amount" className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[12px] font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1">
                    <Pencil className="w-3 h-3"/><span>Edit</span>
                  </button>
                  <button type="button" disabled={busy} onClick={() => openMailModal(inv)} title="Send / resend email" className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 cursor-pointer disabled:opacity-50" aria-label="Send or resend email">
                    <Mail className="w-3.5 h-3.5"/>
                  </button>
                  <button type="button" disabled={busy} onClick={() => openReset(inv)} title={acct ? 'Reset password & send mail' : 'Create login & send mail'} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50" aria-label={acct ? 'Reset password' : 'Create login account'}>
                    <KeyRound className="w-3.5 h-3.5"/>
                  </button>
                  <button type="button" disabled={busy} onClick={() => openLink(inv)} title="Link login account" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50" aria-label="Link login account">
                    <Link2 className="w-3.5 h-3.5"/>
                  </button>
                  <button type="button" disabled={busy} onClick={() => handleToggleStatus(inv)} title={isActive ? 'Deactivate' : 'Reactivate'} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50" aria-label={isActive ? 'Deactivate partner' : 'Reactivate partner'}>
                    {isActive ? <UserMinus className="w-3.5 h-3.5"/> : <UserCheck className="w-3.5 h-3.5 text-emerald-400"/>}
                  </button>
                  <button type="button" disabled={busy} onClick={() => openDelete(inv)} title="Delete partner" className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer disabled:opacity-50" aria-label="Delete partner">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                  <button type="button" disabled={busy || !isActive} onClick={() => openPayout(inv)} className="px-3 py-1.5 rounded-lg bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-slate-950 text-[12px] font-bold border border-lime-400/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">Payout</button>
                </div>
              </div>
            </div>);
        })}
      </div>

      <button type="button" disabled={investors.length >= 10} onClick={openAddModal} className="w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 transition-all cursor-pointer disabled:opacity-50">
        <Plus className="w-4 h-4 stroke-[3]"/>
        <span>Add investor</span>
      </button>

      {/* ADD INVESTOR MODAL */}
      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="add-investor-title">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-md w-full max-h-[92vh] overflow-y-auto space-y-4 text-xs">
            <h3 id="add-investor-title" className="text-base font-bold text-white font-display">
              {createdSummary ? 'Investor Partner Created' : 'Add Equity Partner'}
            </h3>

            {createdSummary ? (<div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1 font-mono">
                <div className="text-white font-bold font-sans text-sm">{createdSummary.investor?.name}</div>
                <div className="text-slate-400">
                  {createdSummary.investor?.sharePercentage}% equity · Invested {formatMoney(createdSummary.investor?.capitalInvested)}
                </div>
                {createdSummary.investor?.email && <div className="text-slate-400">{createdSummary.investor.email}</div>}
              </div>

              {createdSummary.accountCreated && createdSummary.password && (
                <div className="space-y-2">
                  <p className="text-slate-300">Investor portal login created. Share these credentials now; the password is not shown again:</p>
                  <div className="p-3 rounded-xl bg-[#080d12] border border-lime-400/30 font-mono space-y-1">
                    <div><span className="text-slate-500">Mobile: </span><span className="text-white select-all">{createdSummary.investor?.phone}</span></div>
                    {createdSummary.investor?.email && <div><span className="text-slate-500">Email: </span><span className="text-white select-all">{createdSummary.investor.email}</span></div>}
                    <div><span className="text-slate-500">Password: </span><span className="text-lime-300 select-all break-all">{createdSummary.password}</span></div>
                  </div>
                </div>
              )}

              {createdSummary.accountNote && (
                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-200 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-px"/>
                  <span>{createdSummary.accountNote}</span>
                </div>
              )}

              {createdSummary.emailStatus && (
                <div className={`p-3 rounded-xl border flex items-start gap-2 ${createdSummary.emailStatus.sent ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-400/10 border-amber-400/25 text-amber-200'}`}>
                  {createdSummary.emailStatus.sent ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-px"/> : <AlertTriangle className="w-4 h-4 shrink-0 mt-px"/>}
                  <span>{emailReasonText(createdSummary.emailStatus)}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {createdSummary.password && (
                  <button
                    type="button"
                    onClick={() => copyText(`Investor Portal Login\nMobile: ${createdSummary.investor?.phone}\n${createdSummary.investor?.email ? `Email: ${createdSummary.investor.email}\n` : ''}Password: ${createdSummary.password}`, setCopiedCreated)}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-bold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {copiedCreated ? <Check className="w-3.5 h-3.5 text-lime-400"/> : <Copy className="w-3.5 h-3.5"/>}
                    <span>{copiedCreated ? 'Copied' : 'Copy credentials'}</span>
                  </button>
                )}
                <button type="button" onClick={closeAddModal} className="flex-1 py-2.5 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer">Done</button>
              </div>
            </div>) : (<>
              <p className="text-xs text-slate-400">Active shares cannot exceed 100% in total ({Math.max(0, Math.round((100 - totalInvestorPct) * 100) / 100)}% available). Maximum 10 partners.</p>

              <form onSubmit={handleAddInvestorSubmit} className="space-y-3">
                <div>
                  <label htmlFor="add-inv-name" className="block text-slate-300 font-semibold mb-1">Full name <span className="text-lime-400">*</span></label>
                  <input id="add-inv-name" type="text" required maxLength={80} value={newInv.name} onChange={e => setNewInv(f => ({ ...f, name: e.target.value }))} className={inputCls}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="add-inv-phone" className="block text-slate-300 font-semibold mb-1">Mobile phone <span className="text-lime-400">*</span></label>
                    <input id="add-inv-phone" type="tel" required placeholder="01XXXXXXXXX" maxLength={14} value={newInv.phone} onChange={e => setNewInv(f => ({ ...f, phone: e.target.value }))} className={`${inputCls} font-mono`}/>
                  </div>
                  <div>
                    <label htmlFor="add-inv-email" className="block text-slate-300 font-semibold mb-1">Email address</label>
                    <input id="add-inv-email" type="email" placeholder="partner@email.com" maxLength={120} value={newInv.email} onChange={e => setNewInv(f => ({ ...f, email: e.target.value }))} className={inputCls}/>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label htmlFor="add-inv-share" className="block text-slate-300 font-semibold mb-1">Share % <span className="text-lime-400">*</span></label>
                    <input id="add-inv-share" type="number" required min={0} max={100} step="0.5" value={newInv.sharePercentage} onChange={e => setNewInv(f => ({ ...f, sharePercentage: e.target.value }))} className={`${inputCls} font-mono`}/>
                  </div>
                  <div>
                    <label htmlFor="add-inv-capital" className="block text-slate-300 font-semibold mb-1">Invested (৳)</label>
                    <input id="add-inv-capital" type="number" min={0} step="1" placeholder="0" value={newInv.capitalInvested} onChange={e => setNewInv(f => ({ ...f, capitalInvested: e.target.value }))} className={`${inputCls} font-mono`}/>
                  </div>
                  <div>
                    <label htmlFor="add-inv-joined" className="block text-slate-300 font-semibold mb-1">Joined date</label>
                    <input id="add-inv-joined" type="date" value={newInv.joinedDate} onChange={e => setNewInv(f => ({ ...f, joinedDate: e.target.value }))} className={`${inputCls} font-mono`}/>
                  </div>
                </div>

                {/* Portal Login & Welcome Mail */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newInv.createLogin}
                      onChange={e => setNewInv(f => ({ ...f, createLogin: e.target.checked, password: f.password || makeRandomPassword() }))}
                      className="accent-lime-400 w-3.5 h-3.5 rounded"
                    />
                    <span className="text-white font-semibold">Create investor portal login account</span>
                  </label>

                  {newInv.createLogin && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="add-inv-password" className="text-slate-300">Initial password <span className="text-lime-400">*</span></label>
                        <button type="button" onClick={() => setNewInv(f => ({ ...f, password: makeRandomPassword() }))} className="text-[11px] text-lime-400 hover:text-lime-300 font-semibold cursor-pointer">Generate</button>
                      </div>
                      <input id="add-inv-password" type="text" autoComplete="off" spellCheck={false} placeholder="min 6 characters" value={newInv.password} onChange={e => setNewInv(f => ({ ...f, password: e.target.value }))} className={`${inputCls} font-mono`}/>
                    </div>
                  )}

                  <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={newInv.sendEmail}
                      onChange={e => setNewInv(f => ({ ...f, sendEmail: e.target.checked }))}
                      className="accent-lime-400 w-3.5 h-3.5 rounded mt-0.5"
                    />
                    <span className="text-slate-300">
                      Send welcome email {newInv.email.trim() ? <span className="text-emerald-300 font-mono">to {newInv.email.trim().toLowerCase()}</span> : <span className="text-slate-500">(enter an email above)</span>}
                      {newInv.createLogin ? ' with login credentials' : ''}
                    </span>
                  </label>
                </div>

                {addError && <p className="text-rose-400 text-[12px]" role="alert">{addError}</p>}

                <div className="flex gap-2 pt-2">
                  <button type="button" disabled={isAdding} onClick={closeAddModal} className="flex-1 py-2.5 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isAdding} className="flex-1 py-2.5 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isAdding ? 'Creating…' : 'Create investor'}</button>
                </div>
              </form>
            </>)}
          </div>
        </div>)}

      {/* EDIT INVESTOR MODAL */}
      {editInvestor && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="edit-investor-title">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-md w-full max-h-[92vh] overflow-y-auto space-y-4 text-xs">
            <h3 id="edit-investor-title" className="text-base font-bold text-white font-display">Edit Equity Partner</h3>
            <p className="text-xs text-slate-400">
              Update partner details, equity share (up to {editAvailableShare}% available), and invested amount.
            </p>

            <form onSubmit={handleEditInvestorSubmit} className="space-y-3">
              <div>
                <label htmlFor="edit-inv-name" className="block text-slate-300 font-semibold mb-1">Full name <span className="text-lime-400">*</span></label>
                <input id="edit-inv-name" type="text" required maxLength={80} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="edit-inv-phone" className="block text-slate-300 font-semibold mb-1">Mobile phone <span className="text-lime-400">*</span></label>
                  <input id="edit-inv-phone" type="tel" required maxLength={14} value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
                <div>
                  <label htmlFor="edit-inv-email" className="block text-slate-300 font-semibold mb-1">Email address</label>
                  <input id="edit-inv-email" type="email" maxLength={120} placeholder="partner@email.com" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputCls}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="edit-inv-share" className="block text-slate-300 font-semibold mb-1">Equity Share % <span className="text-lime-400">*</span></label>
                  <input id="edit-inv-share" type="number" required min={0} max={100} step="0.5" value={editForm.sharePercentage} onChange={e => setEditForm(f => ({ ...f, sharePercentage: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
                <div>
                  <label htmlFor="edit-inv-capital" className="block text-slate-300 font-semibold mb-1">Invested Amount (৳)</label>
                  <input id="edit-inv-capital" type="number" min={0} step="1" value={editForm.capitalInvested} onChange={e => setEditForm(f => ({ ...f, capitalInvested: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="edit-inv-joined" className="block text-slate-300 font-semibold mb-1">Joined date</label>
                  <input id="edit-inv-joined" type="date" value={editForm.joinedDate} onChange={e => setEditForm(f => ({ ...f, joinedDate: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
                <div>
                  <label htmlFor="edit-inv-status" className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select id="edit-inv-status" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {loginAccountFor(editInvestor)?.role === 'investor' && (
                <label className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.syncAccount}
                    onChange={e => setEditForm(f => ({ ...f, syncAccount: e.target.checked }))}
                    className="accent-lime-400 w-3.5 h-3.5 rounded mt-0.5"
                  />
                  <span className="text-slate-300">Also sync updated name, email &amp; phone to the linked investor login account</span>
                </label>
              )}

              {editError && <p className="text-rose-400 text-[12px]" role="alert">{editError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" disabled={isEditing} onClick={closeEditModal} className="flex-1 py-2.5 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isEditing} className="flex-1 py-2.5 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isEditing ? 'Saving…' : 'Save changes'}</button>
              </div>
            </form>
          </div>
        </div>)}

      {/* SEND / RESEND EMAIL MODAL */}
      {mailInvestor && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="mail-investor-title">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"><Mail className="w-4 h-4"/></div>
              <div>
                <h3 id="mail-investor-title" className="text-base font-bold text-white">Send Email to Investor</h3>
                <p className="text-[11px] text-slate-400">{mailInvestor.name} · {mailInvestor.sharePercentage}% · {formatMoney(mailInvestor.capitalInvested)}</p>
              </div>
            </div>

            <div>
              <label htmlFor="mail-inv-email" className="block text-slate-300 font-semibold mb-1">Recipient email address</label>
              <input
                id="mail-inv-email"
                type="email"
                placeholder="partner@email.com"
                value={mailEmail}
                onChange={e => { setMailEmail(e.target.value); setMailFeedback(null); }}
                className={inputCls}
              />
              <p className="text-[11px] text-slate-500 mt-1">If you enter or change the email here, it will also be saved to this partner record.</p>
            </div>

            {mailFeedback && (
              <div role={mailFeedback.type === 'error' ? 'alert' : 'status'} className={`p-3 rounded-xl border flex items-start gap-2 ${mailFeedback.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                {mailFeedback.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0 mt-px"/> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-px"/>}
                <span>{mailFeedback.text}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-white">Welcome &amp; Partner Summary Email</div>
                  <div className="text-[11px] text-slate-400">Sends equity share, invested amount, login info &amp; portal link.</div>
                </div>
                <button
                  type="button"
                  disabled={Boolean(mailBusyAction)}
                  onClick={() => handleSendMailAction('resend_welcome')}
                  className="px-3 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black cursor-pointer disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5"/>
                  <span>{mailBusyAction === 'resend_welcome' ? 'Sending…' : 'Send'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-white">Password Reset Code (OTP) Email</div>
                  <div className="text-[11px] text-slate-400">
                    {mailAccount
                      ? 'Emails a 6-digit code valid for 15 minutes so the partner can set a new password.'
                      : 'No login account linked yet. Create a login first to send a reset code.'}
                  </div>
                </div>
                {mailAccount ? (
                  <button
                    type="button"
                    disabled={Boolean(mailBusyAction)}
                    onClick={() => handleSendMailAction('send_reset_code')}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold cursor-pointer disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5"/>
                    <span>{mailBusyAction === 'send_reset_code' ? 'Sending…' : 'Send OTP'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { const target = mailInvestor; setMailInvestor(null); openReset(target); }}
                    className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5"/>
                    <span>Create login</span>
                  </button>
                )}
              </div>
            </div>

            <button type="button" disabled={Boolean(mailBusyAction)} onClick={closeMailModal} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Close</button>
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
            <p className="text-xs text-slate-400">Choose which login sees <strong className="text-white">{linkInvestor.name}</strong>&rsquo;s portal. Only accounts with the investor role are listed; change a user&rsquo;s role under Users first.</p>

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

            {canDeleteLinkedLogin ? (
              <label className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteAlsoAccount}
                  onChange={e => setDeleteAlsoAccount(e.target.checked)}
                  className="accent-rose-500 w-3.5 h-3.5 rounded mt-0.5"
                />
                <span className="text-slate-300">
                  Also permanently delete the linked investor login (<span className="font-mono text-white">{deleteAccount.phone}</span>)
                </span>
              </label>
            ) : (
              <p className="text-[11px] text-slate-500">The partner&rsquo;s login account is not removed. Manage logins under Users if they should no longer sign in.</p>
            )}

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

      {/* RESET PASSWORD / CREATE LOGIN MODAL */}
      {resetInvestor && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400">
                {resetAccount ? <KeyRound className="w-4 h-4"/> : <UserPlus className="w-4 h-4"/>}
              </div>
              <h3 id="reset-password-title" className="text-base font-bold text-white">
                {resetResult?.mode === 'otp'
                  ? 'Password Reset Code Sent'
                  : resetResult?.mode === 'created'
                    ? 'Investor Login Created'
                    : resetResult?.mode === 'reset'
                      ? 'Password Reset Complete'
                      : resetAccount
                        ? 'Reset Password & Send Mail'
                        : 'Create Investor Login Account'}
              </h3>
            </div>

            {resetResult ? (<div className="space-y-3">
              {resetResult.mode === 'otp' ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-px"/>
                  <span>A 6-digit password reset code has been sent to <strong className="font-mono">{resetResult.emailStatus?.toEmail}</strong>. It expires in 15 minutes and can be used on the Forgot Password page.</span>
                </div>
              ) : (<>
                <p className="text-slate-300">
                  {resetResult.mode === 'created'
                    ? <>Portal login created for <strong className="text-white">{resetResult.name}</strong> (<span className="font-mono">{resetResult.phone}</span>).</>
                    : <>The password for <strong className="text-white">{resetResult.name}</strong> (<span className="font-mono">{resetResult.phone}</span>) has been updated.</>}
                  {' '}Save or share it now; it is not shown again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-xl bg-[#080d12] border border-lime-400/30 text-lime-300 font-mono text-sm break-all select-all">{resetResult.password}</code>
                  <button type="button" onClick={() => copyText(resetResult.password, setResetCopied)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold cursor-pointer flex items-center gap-1.5" aria-label="Copy password">
                    {resetCopied ? <Check className="w-3.5 h-3.5 text-lime-400"/> : <Copy className="w-3.5 h-3.5"/>}
                    <span>{resetCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                {resetResult.emailStatus && (
                  <div className={`p-3 rounded-xl border flex items-start gap-2 ${resetResult.emailStatus.sent ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-400/10 border-amber-400/25 text-amber-200'}`}>
                    {resetResult.emailStatus.sent ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-px"/> : <AlertTriangle className="w-4 h-4 shrink-0 mt-px"/>}
                    <span>{emailReasonText(resetResult.emailStatus)}</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500">The partner can change it anytime under Settings in the investor portal.</p>
              </>)}
              <button type="button" onClick={closeReset} className="w-full py-2.5 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer">Done</button>
            </div>) : (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                {resetAccount ? (
                  <p className="text-slate-400">
                    Set a new password for <strong className="text-white">{resetInvestor.name}</strong>&rsquo;s login: <span className="text-white">{resetAccount.name}</span> · <span className="font-mono text-white">{resetAccount.phone}</span> · {resetAccount.role}
                  </p>
                ) : (
                  <p className="text-slate-300">
                    <strong className="text-white">{resetInvestor.name}</strong> (<span className="font-mono">{resetInvestor.phone}</span>) has no login account yet. Create their investor portal login right now and email their credentials.
                  </p>
                )}

                {resetAccount?.disabled && <p className="text-amber-300 text-[11px]">This account is disabled. The new password will not work until it is enabled under Users.</p>}
                {resetAccount && resetAccount.role !== 'investor' && resetAccount.role !== 'admin' && <p className="text-amber-300 text-[11px]">This account has the {resetAccount.role} role, so it cannot open the investor portal until its role is changed under Users.</p>}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="reset-password-input" className="block text-slate-300 font-semibold">{resetAccount ? 'New password' : 'Initial password'}</label>
                    <button type="button" onClick={() => { setResetPassword(makeRandomPassword()); setResetError(''); }} className="text-[11px] text-lime-400 hover:text-lime-300 font-semibold cursor-pointer">Generate</button>
                  </div>
                  <input id="reset-password-input" type="text" autoComplete="off" spellCheck={false} placeholder="min 6 characters" value={resetPassword} onChange={e => { setResetPassword(e.target.value); setResetError(''); }} className={`${inputCls} font-mono`}/>
                  {resetAccount && <p className="text-[11px] text-slate-500 mt-1">Their current password stops working as soon as you save.</p>}
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div>
                    <label htmlFor="reset-email-input" className="block text-slate-300 font-semibold mb-1">Investor email</label>
                    <input id="reset-email-input" type="email" placeholder="partner@email.com" value={resetEmail} onChange={e => { setResetEmail(e.target.value); setResetError(''); }} className={inputCls}/>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={resetSendEmail}
                      onChange={e => setResetSendEmail(e.target.checked)}
                      className="accent-lime-400 w-3.5 h-3.5 rounded"
                    />
                    <span className="text-slate-300">
                      {resetAccount ? 'Email the new password to the investor' : 'Send welcome email with login credentials'}
                    </span>
                  </label>
                </div>

                {resetError && <p className="text-rose-400 text-[12px]" role="alert">{resetError}</p>}

                <div className="flex gap-2 pt-1">
                  <button type="button" disabled={isResetting || isSendingOtp} onClick={closeReset} className="flex-1 py-2.5 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isResetting || isSendingOtp} className="flex-1 py-2.5 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">
                    {isResetting ? 'Saving…' : resetAccount ? (resetSendEmail ? 'Reset & Email' : 'Reset Password') : 'Create Login'}
                  </button>
                </div>

                {resetAccount && !resetAccount.disabled && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <p className="text-[11px] text-slate-400">Or let the partner pick their own password by emailing a 6-digit verification code:</p>
                    <button
                      type="button"
                      disabled={isResetting || isSendingOtp}
                      onClick={handleSendResetOtpFromModal}
                      className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400"/>
                      <span>{isSendingOtp ? 'Sending reset code…' : 'Send 6-digit password reset code email'}</span>
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>)}

    </div>);
}
