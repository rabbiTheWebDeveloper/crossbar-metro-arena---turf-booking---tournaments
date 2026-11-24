'use client';
import React, { useEffect, useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { useInvestor } from '@/context/InvestorContext';
import { EmailVerificationBox } from '@/components/EmailVerificationBox';
import { formatMoney, formatDate, PAYOUT_METHODS, MOBILE_WALLET_METHODS, paymentMethodLabel, payoutDetailsSummary } from '@/data/finance';
import { isValidBdPhone } from '@/lib/phone';
import { Wallet, User, Lock, PieChart, CheckCircle2, AlertCircle } from 'lucide-react';

const CARD = 'bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-7 shadow-xl space-y-4';
const INPUT = 'w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/60';
const INPUT_DISABLED = 'w-full px-3 py-2 rounded-xl bg-[#080d12]/50 border border-white/5 text-slate-500 text-xs';
const LABEL = 'block text-slate-300 font-semibold mb-1';
const HINT = 'text-[11px] text-slate-500 mt-1';
const BTN_PRIMARY = 'px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black uppercase tracking-wider text-xs disabled:opacity-60 cursor-pointer transition-colors';
const BTN_SECONDARY = 'px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold uppercase tracking-wider text-xs disabled:opacity-60 cursor-pointer transition-colors';

const EMPTY_PAYOUT = { method: '', accountName: '', accountNumber: '', bankName: '', branch: '', note: '' };
const toForm = (details) => ({
    method: details?.method || '',
    accountName: details?.accountName || '',
    accountNumber: details?.accountNumber || '',
    bankName: details?.bankName || '',
    branch: details?.branch || '',
    note: details?.note || ''
});

function Message({ msg }) {
    if (!msg) return null;
    const isError = msg.type === 'error';
    const Icon = isError ? AlertCircle : CheckCircle2;
    return (
        <div role={isError ? 'alert' : 'status'} className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-xs ${isError ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
            <Icon className="w-4 h-4 shrink-0 mt-px"/>
            <span>{msg.text}</span>
        </div>
    );
}

function CardTitle({ icon: Icon, children }) {
    return (
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Icon className="w-4 h-4"/><span>{children}</span>
        </div>
    );
}

function Fact({ label, value, mono = false }) {
    return (
        <div className="min-w-0">
            <dt className="text-[11px] text-slate-500 uppercase font-mono tracking-wide">{label}</dt>
            <dd className={`text-xs font-bold text-white mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
        </div>
    );
}

export default function InvestorSettingsPage() {
    const { currentUser, isAdmin, handleUpdateProfile, handleChangePassword, handleSaveInvestorSettings } = useArena();
    const { activeInvestor } = useInvestor();
    const investorId = activeInvestor?.id || '';
    const saved = activeInvestor?.payoutDetails || null;

    // ---- Payout preference (stored on the partner record) ----
    const [payout, setPayout] = useState(EMPTY_PAYOUT);
    const [payoutMsg, setPayoutMsg] = useState(null);
    const [payoutSaving, setPayoutSaving] = useState(false);
    const savedKey = JSON.stringify(toForm(saved));
    useEffect(() => { setPayout(toForm(saved)); }, [investorId, savedKey]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { setPayoutMsg(null); }, [investorId]);

    const isWallet = MOBILE_WALLET_METHODS.includes(payout.method);
    const isBank = payout.method === 'bank_transfer';
    const isCheque = payout.method === 'cheque';
    const isCash = payout.method === 'cash';
    const setField = (key) => (e) => setPayout(f => ({ ...f, [key]: e.target.value }));

    const onMethodChange = (e) => {
        const method = e.target.value;
        setPayoutMsg(null);
        // Going back to the saved method restores what is on file
        if (saved && method === (saved.method || '')) { setPayout(toForm(saved)); return; }
        setPayout(f => {
            const wasWallet = MOBILE_WALLET_METHODS.includes(f.method);
            const nowWallet = MOBILE_WALLET_METHODS.includes(method);
            // A wallet number carries over between wallets; otherwise start from the partner's own mobile / a blank account
            const accountNumber = nowWallet ? (wasWallet && f.accountNumber ? f.accountNumber : (activeInvestor?.phone || '')) : '';
            return { ...f, method, accountNumber, accountName: f.accountName || activeInvestor?.name || '', bankName: method === 'bank_transfer' ? f.bankName : '', branch: method === 'bank_transfer' ? f.branch : '' };
        });
    };

    const submitPayout = async (e) => {
        e.preventDefault();
        if (payoutSaving || !investorId) return;
        setPayoutMsg(null);
        const d = { method: payout.method, accountName: payout.accountName.trim(), accountNumber: payout.accountNumber.trim(), bankName: payout.bankName.trim(), branch: payout.branch.trim(), note: payout.note.trim() };
        const fail = (text) => setPayoutMsg({ type: 'error', text });
        if (isWallet && !isValidBdPhone(d.accountNumber)) return fail('Enter a valid 11-digit wallet number (e.g. 01711223344).');
        if (isBank) {
            if (!d.accountName) return fail('Enter the account holder name.');
            if (!d.bankName) return fail('Enter the bank name.');
            if (!/^[0-9A-Za-z][0-9A-Za-z -]{4,32}[0-9A-Za-z]$/.test(d.accountNumber)) return fail('Enter the bank account number (6 to 34 letters or digits).');
        }
        if (isCheque && !d.accountName) return fail('Enter the payee name for the cheque.');
        setPayoutSaving(true);
        const r = await handleSaveInvestorSettings(d, isAdmin ? investorId : undefined);
        setPayoutSaving(false);
        setPayoutMsg(r?.ok
            ? { type: 'success', text: d.method ? 'Payout preference saved.' : 'Payout preference cleared.' }
            : { type: 'error', text: r?.error || 'Could not save the payout preference.' });
    };

    // ---- Login account (User record of whoever is signed in) ----
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [accountMsg, setAccountMsg] = useState(null);
    const [accountSaving, setAccountSaving] = useState(false);
    useEffect(() => {
        setName(currentUser?.name || '');
        setEmail(currentUser?.email || '');
    }, [currentUser?.id, currentUser?.name, currentUser?.email]);

    const submitAccount = async (e) => {
        e.preventDefault();
        if (accountSaving) return;
        setAccountMsg(null);
        const cleanName = name.trim();
        const cleanEmail = email.trim();
        if (cleanName.length < 2) { setAccountMsg({ type: 'error', text: 'Please enter your full name.' }); return; }
        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setAccountMsg({ type: 'error', text: 'Enter a valid email address.' }); return; }
        setAccountSaving(true);
        const r = await handleUpdateProfile({ name: cleanName, email: cleanEmail });
        setAccountSaving(false);
        setAccountMsg(r?.ok ? { type: 'success', text: 'Account details updated.' } : { type: 'error', text: r?.error || 'Could not update your account.' });
    };

    // ---- Password ----
    const [pwCurrent, setPwCurrent] = useState('');
    const [pwNew, setPwNew] = useState('');
    const [pwConfirm, setPwConfirm] = useState('');
    const [pwMsg, setPwMsg] = useState(null);
    const [pwSaving, setPwSaving] = useState(false);

    const submitPassword = async (e) => {
        e.preventDefault();
        if (pwSaving) return;
        setPwMsg(null);
        if (!pwCurrent) { setPwMsg({ type: 'error', text: 'Enter your current password.' }); return; }
        if (pwNew.length < 6) { setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' }); return; }
        if (pwNew !== pwConfirm) { setPwMsg({ type: 'error', text: 'New password and confirmation do not match.' }); return; }
        setPwSaving(true);
        const r = await handleChangePassword(pwCurrent, pwNew);
        setPwSaving(false);
        if (!r?.ok) { setPwMsg({ type: 'error', text: r?.error || 'Could not change the password.' }); return; }
        setPwMsg({ type: 'success', text: 'Password changed.' });
        setPwCurrent(''); setPwNew(''); setPwConfirm('');
    };

    if (!activeInvestor) return null; // the layout shows the loading / not-linked states

    const savedSummary = payoutDetailsSummary(saved);
    const savedOn = saved?.updatedAt ? new Date(saved.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    return (
        <div className="w-full max-w-5xl space-y-5 sm:space-y-6">
            {/* PARTNER RECORD (read-only) */}
            <section className={CARD} aria-labelledby="partner-record-title">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div id="partner-record-title"><CardTitle icon={PieChart}>Partner record</CardTitle></div>
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${(activeInvestor.status || 'active') === 'active' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' : 'text-amber-300 bg-amber-400/10 border-amber-400/25'}`}>
                        {activeInvestor.status || 'active'}
                    </span>
                </div>
                <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-4">
                    <Fact label="Partner" value={activeInvestor.name}/>
                    <Fact label="Mobile" value={activeInvestor.phone} mono/>
                    <Fact label="Email" value={activeInvestor.email}/>
                    <Fact label="Equity share" value={`${activeInvestor.sharePercentage ?? 0}%`} mono/>
                    <Fact label="Capital invested" value={formatMoney(activeInvestor.capitalInvested)} mono/>
                    <Fact label="Partner since" value={activeInvestor.joinedDate ? formatDate(activeInvestor.joinedDate, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}/>
                </dl>
                <p className={HINT}>These details are kept by the arena desk. Contact the desk if anything here needs correcting.</p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
                {/* PAYOUT PREFERENCE */}
                <section className={CARD} aria-labelledby="payout-pref-title">
                    <div id="payout-pref-title"><CardTitle icon={Wallet}>Payout preference</CardTitle></div>
                    <p className="text-xs text-slate-400">
                        {isAdmin
                            ? <>You are editing where <strong className="text-white">{activeInvestor.name}</strong> receives dividends.</>
                            : 'Tell the arena desk where to send your dividends. They will use this for your next payout.'}
                    </p>
                    <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                        <span className="text-slate-500">On file: </span>
                        <span className="text-white font-semibold break-words">{savedSummary || 'No preference set'}</span>
                        {savedSummary && savedOn && <span className="text-slate-500"> · updated {savedOn}</span>}
                    </div>

                    <Message msg={payoutMsg}/>
                    <form onSubmit={submitPayout} className="space-y-3.5 text-xs" noValidate>
                        <div>
                            <label htmlFor="payout-method" className={LABEL}>Payout method</label>
                            <select id="payout-method" value={payout.method} onChange={onMethodChange} className={INPUT}>
                                <option value="">No preference</option>
                                {PAYOUT_METHODS.map(m => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
                            </select>
                            {!payout.method && <p className={HINT}>With no preference, the arena desk will contact you before each payout.</p>}
                            {isCash && <p className={HINT}>Cash is collected in person at the arena desk.</p>}
                        </div>

                        {isWallet && (<>
                            <div>
                                <label htmlFor="payout-number" className={LABEL}>{paymentMethodLabel(payout.method)} number</label>
                                <input id="payout-number" type="tel" inputMode="numeric" maxLength={14} placeholder="01XXXXXXXXX" value={payout.accountNumber} onChange={setField('accountNumber')} className={`${INPUT} font-mono`}/>
                            </div>
                            <div>
                                <label htmlFor="payout-name" className={LABEL}>Account holder name <span className="text-slate-500 font-normal">(optional)</span></label>
                                <input id="payout-name" type="text" maxLength={80} value={payout.accountName} onChange={setField('accountName')} className={INPUT}/>
                            </div>
                        </>)}

                        {isBank && (<>
                            <div>
                                <label htmlFor="payout-name" className={LABEL}>Account holder name</label>
                                <input id="payout-name" type="text" maxLength={80} value={payout.accountName} onChange={setField('accountName')} className={INPUT}/>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="payout-bank" className={LABEL}>Bank name</label>
                                    <input id="payout-bank" type="text" maxLength={80} placeholder="e.g. Dutch-Bangla Bank" value={payout.bankName} onChange={setField('bankName')} className={INPUT}/>
                                </div>
                                <div>
                                    <label htmlFor="payout-branch" className={LABEL}>Branch <span className="text-slate-500 font-normal">(optional)</span></label>
                                    <input id="payout-branch" type="text" maxLength={80} value={payout.branch} onChange={setField('branch')} className={INPUT}/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="payout-number" className={LABEL}>Account number</label>
                                <input id="payout-number" type="text" maxLength={34} autoComplete="off" value={payout.accountNumber} onChange={setField('accountNumber')} className={`${INPUT} font-mono`}/>
                            </div>
                        </>)}

                        {isCheque && (
                            <div>
                                <label htmlFor="payout-name" className={LABEL}>Payee name on the cheque</label>
                                <input id="payout-name" type="text" maxLength={80} value={payout.accountName} onChange={setField('accountName')} className={INPUT}/>
                            </div>
                        )}

                        {payout.method && (
                            <div>
                                <label htmlFor="payout-note" className={LABEL}>Note for the arena desk <span className="text-slate-500 font-normal">(optional)</span></label>
                                <input id="payout-note" type="text" maxLength={200} placeholder="e.g. personal account, send before the 10th" value={payout.note} onChange={setField('note')} className={INPUT}/>
                            </div>
                        )}

                        <button type="submit" disabled={payoutSaving} className={BTN_PRIMARY}>
                            {payoutSaving ? 'Saving…' : 'Save payout preference'}
                        </button>
                    </form>
                </section>

                <div className="space-y-5 sm:space-y-6">
                    {/* LOGIN ACCOUNT */}
                    <section className={CARD} aria-labelledby="account-title">
                        <div id="account-title"><CardTitle icon={User}>Your login account</CardTitle></div>
                        {isAdmin && <p className="text-xs text-slate-400">These are your own admin login details, not {activeInvestor.name}&rsquo;s.</p>}
                        <Message msg={accountMsg}/>
                        <form onSubmit={submitAccount} className="space-y-3.5 text-xs" noValidate>
                            <div>
                                <label htmlFor="account-name" className={LABEL}>Full name</label>
                                <input id="account-name" type="text" maxLength={60} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={INPUT}/>
                            </div>
                            <div>
                                <label htmlFor="account-email" className={LABEL}>Email address</label>
                                <input id="account-email" type="email" maxLength={120} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT}/>
                                <EmailVerificationBox email={email} accent="emerald"/>
                            </div>
                            <div>
                                <label htmlFor="account-phone" className={LABEL}>Registered mobile</label>
                                <input id="account-phone" type="text" disabled value={currentUser?.phone || ''} className={`${INPUT_DISABLED} font-mono`}/>
                                <p className={HINT}>Your mobile number is your login{isAdmin ? '' : ' and links you to your partner record'}. Contact the arena desk to change it.</p>
                            </div>
                            <button type="submit" disabled={accountSaving} className={BTN_PRIMARY}>
                                {accountSaving ? 'Saving…' : 'Save account'}
                            </button>
                        </form>
                    </section>

                    {/* PASSWORD */}
                    <section className={CARD} aria-labelledby="password-title">
                        <div id="password-title"><CardTitle icon={Lock}>Change password</CardTitle></div>
                        <Message msg={pwMsg}/>
                        <form onSubmit={submitPassword} className="space-y-3.5 text-xs" noValidate>
                            <div>
                                <label htmlFor="pw-current" className={LABEL}>Current password</label>
                                <input id="pw-current" type="password" autoComplete="current-password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} className={INPUT}/>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="pw-new" className={LABEL}>New password</label>
                                    <input id="pw-new" type="password" autoComplete="new-password" value={pwNew} onChange={e => setPwNew(e.target.value)} className={INPUT}/>
                                </div>
                                <div>
                                    <label htmlFor="pw-confirm" className={LABEL}>Confirm new password</label>
                                    <input id="pw-confirm" type="password" autoComplete="new-password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} className={INPUT}/>
                                </div>
                            </div>
                            <button type="submit" disabled={pwSaving} className={BTN_SECONDARY}>
                                {pwSaving ? 'Updating…' : 'Update password'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
