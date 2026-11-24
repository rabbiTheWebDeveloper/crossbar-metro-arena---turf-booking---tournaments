'use client';
import React, { useState } from 'react';
import { cleanPhone } from '@/lib/phone';
import { Mail, Lock, KeyRound, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, MessageSquare, RotateCcw } from 'lucide-react';

const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeIdentifier(raw) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return { error: 'Please enter your registered mobile number or email address.' };
    if (trimmed.includes('@')) {
        const email = trimmed.toLowerCase();
        if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address.' };
        return { value: email };
    }
    const digits = cleanPhone(trimmed);
    if (!PHONE_RE.test(digits)) {
        return { error: 'Enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX) or email address.' };
    }
    return { value: digits };
}

/**
 * 2-step Password Reset via Email 6-digit OTP code.
 * Works inside LoginClient modal, AuthModal, or standalone /forgot-password page.
 */
export function ForgotPasswordFlow({
    initialIdentifier = '',
    whatsappUrl = '',
    deskPhone = '',
    deskPhoneFormatted = '',
    onSuccess,
    onBackToLogin
}) {
    const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
    const [identifier, setIdentifier] = useState(initialIdentifier);
    const [maskedEmail, setMaskedEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const sendResetCode = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setInfo('');
        const parsed = normalizeIdentifier(identifier);
        if (parsed.error) {
            setError(parsed.error);
            return;
        }
        setBusy(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: parsed.value })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || 'Could not send reset code.');
                return;
            }
            setMaskedEmail(data.maskedEmail || '');
            setInfo(data.message || 'Reset code sent to your email.');
            setStep('reset');
        } catch {
            setError('Network error while sending reset code. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const submitReset = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        const parsed = normalizeIdentifier(identifier);
        if (parsed.error) {
            setError(parsed.error);
            return;
        }
        const cleanCode = code.replace(/\s+/g, '');
        if (!/^\d{6}$/.test(cleanCode)) {
            setError('Please enter the 6-digit code sent to your email.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setBusy(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: parsed.value,
                    code: cleanCode,
                    newPassword
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || 'Could not reset password.');
                return;
            }
            setInfo(data.message || 'Password reset successfully!');
            setStep('done');
            if (onSuccess) onSuccess(parsed.value);
        } catch {
            setError('Network error while resetting password. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4 text-xs">
            {error && (
                <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5"/>
                    <span>{error}</span>
                </div>
            )}

            {info && (
                <div role="status" className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5"/>
                    <span>{info}</span>
                </div>
            )}

            {step === 'request' && (
                <form onSubmit={sendResetCode} className="space-y-3.5">
                    <p className="text-slate-300 leading-relaxed">
                        Enter your registered <strong>mobile number</strong> or <strong>email address</strong>. We&apos;ll send a 6-digit reset code to the email on your account.
                    </p>
                    <div className="space-y-1.5">
                        <label htmlFor="fp-identifier" className="block font-bold text-slate-300">Mobile Number or Email</label>
                        <div className="relative flex items-center">
                            <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none"/>
                            <input
                                id="fp-identifier"
                                type="text"
                                required
                                autoComplete="username"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                placeholder="01XXXXXXXXX or name@email.com"
                                className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <span>{busy ? 'Sending code…' : 'Send Reset Code to Email'}</span>
                        {!busy && <ArrowRight className="w-4 h-4"/>}
                    </button>
                </form>
            )}

            {step === 'reset' && (
                <form onSubmit={submitReset} className="space-y-3.5">
                    <p className="text-slate-300 leading-relaxed">
                        Enter the 6-digit code sent to <strong className="text-white">{maskedEmail || 'your email'}</strong> and choose a new password.
                    </p>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="fp-code" className="font-bold text-slate-300">6-Digit Email Code</label>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={sendResetCode}
                                className="text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                                <RotateCcw className="w-3 h-3"/>
                                <span>Resend code</span>
                            </button>
                        </div>
                        <div className="relative flex items-center">
                            <KeyRound className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none"/>
                            <input
                                id="fp-code"
                                type="text"
                                inputMode="numeric"
                                required
                                maxLength={6}
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white font-mono tracking-[0.3em] placeholder:tracking-normal placeholder:text-slate-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="fp-new-pw" className="block font-bold text-slate-300">New Password</label>
                        <div className="relative flex items-center">
                            <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none"/>
                            <input
                                id="fp-new-pw"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 text-slate-400 hover:text-white cursor-pointer"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="fp-confirm-pw" className="block font-bold text-slate-300">Confirm New Password</label>
                        <div className="relative flex items-center">
                            <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none"/>
                            <input
                                id="fp-confirm-pw"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {busy ? 'Resetting password…' : 'Reset Password'}
                    </button>

                    <button
                        type="button"
                        onClick={() => { setStep('request'); setError(''); setInfo(''); }}
                        className="w-full text-center text-slate-400 hover:text-white text-[11px] cursor-pointer"
                    >
                        Use a different mobile number or email
                    </button>
                </form>
            )}

            {step === 'done' && (
                <div className="space-y-3 text-center py-2">
                    <p className="text-slate-300">Your password is updated. Sign in now with your new password.</p>
                    {onBackToLogin && (
                        <button
                            type="button"
                            onClick={onBackToLogin}
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs cursor-pointer"
                        >
                            Back to Sign In
                        </button>
                    )}
                </div>
            )}

            {step !== 'done' && whatsappUrl && (
                <div className="pt-3 border-t border-white/10 space-y-2 text-[11px] text-slate-400">
                    <p>Don&apos;t have an email on your account? Message the arena desk on WhatsApp:</p>
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#25D366] font-bold hover:underline"
                    >
                        <MessageSquare className="w-3.5 h-3.5"/>
                        <span>Message the arena desk</span>
                    </a>
                    {deskPhone && (
                        <span className="ml-2">
                            or call <a href={`tel:${cleanPhone(deskPhone)}`} className="text-emerald-400 font-mono font-bold">{deskPhoneFormatted || deskPhone}</a>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default ForgotPasswordFlow;
