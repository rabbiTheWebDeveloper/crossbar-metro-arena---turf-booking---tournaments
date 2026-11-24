'use client';
import React, { useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { MailCheck, MailWarning, Send, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER_EMAIL_RE = /^01[3-9]\d{8}@bookcrossbar\.com$/i;

/**
 * Reusable email verification control for all user settings pages (Customer, Investor, Admin, Staff).
 */
export function EmailVerificationBox({ email, accent = 'emerald' }) {
    const { currentUser, handleSendEmailVerification, handleConfirmEmailVerification } = useArena();
    const [step, setStep] = useState('idle'); // 'idle' | 'code'
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null); // { type: 'success' | 'error', text }

    if (!currentUser || currentUser.role === 'visitor') return null;

    const cleanInput = String(email ?? currentUser.email ?? '').trim().toLowerCase();
    const savedEmail = String(currentUser.email || '').trim().toLowerCase();
    const hasRealEmail = Boolean(cleanInput && EMAIL_RE.test(cleanInput) && !PLACEHOLDER_EMAIL_RE.test(cleanInput));
    const isSameAsSaved = cleanInput === savedEmail;
    const isVerified = Boolean(currentUser.emailVerified && isSameAsSaved && hasRealEmail);

    const isLime = accent === 'lime';
    const accentBtn = isLime
        ? 'bg-lime-400 hover:bg-lime-300 text-slate-950'
        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950';
    const accentOutline = isLime
        ? 'text-lime-300 border-lime-400/30 bg-lime-400/10 hover:bg-lime-400/20'
        : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20';
    const accentBorderFocus = isLime ? 'focus:border-lime-400/60' : 'focus:border-emerald-400/60';

    const verifiedDate = currentUser.emailVerifiedAt
        ? new Date(currentUser.emailVerifiedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

    const onSendCode = async () => {
        if (busy) return;
        setMsg(null);
        if (!hasRealEmail) {
            setMsg({ type: 'error', text: 'Enter a valid personal email address above first.' });
            return;
        }
        setBusy(true);
        const r = await handleSendEmailVerification(cleanInput);
        setBusy(false);
        if (!r?.ok) {
            setMsg({ type: 'error', text: r?.error || 'Could not send verification code.' });
            return;
        }
        if (r.alreadyVerified) {
            setStep('idle');
            setMsg({ type: 'success', text: r.message });
            return;
        }
        setStep('code');
        setCode('');
        setMsg({ type: 'success', text: r.message || `Verification code sent to ${cleanInput}.` });
    };

    const onVerifyCode = async () => {
        if (busy) return;
        setMsg(null);
        const cleanCode = code.replace(/\s+/g, '');
        if (!/^\d{6}$/.test(cleanCode)) {
            setMsg({ type: 'error', text: 'Enter the 6-digit code sent to your email.' });
            return;
        }
        setBusy(true);
        const r = await handleConfirmEmailVerification(cleanCode);
        setBusy(false);
        if (!r?.ok) {
            setMsg({ type: 'error', text: r?.error || 'Invalid verification code.' });
            return;
        }
        setStep('idle');
        setCode('');
        setMsg({ type: 'success', text: r.message || 'Email verified!' });
    };

    return (
        <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
                {isVerified ? (
                    <div className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold">
                        <MailCheck className="w-4 h-4 text-emerald-400 shrink-0"/>
                        <span>Email verified{verifiedDate ? ` · ${verifiedDate}` : ''}</span>
                    </div>
                ) : hasRealEmail ? (
                    <div className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
                        <MailWarning className="w-4 h-4 text-amber-400 shrink-0"/>
                        <span>Email not verified</span>
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-1.5 text-slate-400">
                        <MailWarning className="w-4 h-4 text-slate-500 shrink-0"/>
                        <span>Add a real email address above to verify your email.</span>
                    </div>
                )}

                {!isVerified && hasRealEmail && step === 'idle' && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onSendCode}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 ${accentOutline}`}
                    >
                        <Send className="w-3 h-3"/>
                        <span>{busy ? 'Sending…' : 'Verify Email'}</span>
                    </button>
                )}
            </div>

            {!isVerified && step === 'code' && (
                <div className="space-y-2 pt-1 border-t border-white/10">
                    <p className="text-[11px] text-slate-400">
                        Enter the 6-digit code sent to <strong className="text-white">{cleanInput}</strong>:
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            placeholder="6-digit code"
                            aria-label="Email verification code"
                            className={`w-36 px-3 py-2 rounded-lg bg-[#080d12] border border-white/15 text-white font-mono tracking-[0.25em] text-center text-xs placeholder:tracking-normal placeholder:text-slate-600 focus:outline-none ${accentBorderFocus}`}
                        />
                        <button
                            type="button"
                            disabled={busy || code.length !== 6}
                            onClick={onVerifyCode}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 ${accentBtn}`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5"/>
                            <span>{busy ? 'Verifying…' : 'Confirm'}</span>
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={onSendCode}
                            className="px-2.5 py-2 rounded-lg text-[11px] text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
                        >
                            Resend
                        </button>
                    </div>
                </div>
            )}

            {msg && (
                <div
                    role={msg.type === 'error' ? 'alert' : 'status'}
                    className={`flex items-start gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border ${
                        msg.type === 'error'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                >
                    {msg.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5"/> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5"/>}
                    <span>{msg.text}</span>
                </div>
            )}
        </div>
    );
}

export default EmailVerificationBox;
