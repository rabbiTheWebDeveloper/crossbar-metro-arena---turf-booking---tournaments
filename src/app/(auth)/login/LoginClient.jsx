'use client';
import React, { useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useArena, cleanPhone } from '@/context/ArenaContext';
import { ForgotPasswordFlow } from '@/components/ForgotPasswordFlow';
import { Phone, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Zap, UserCheck, TrendingUp, X } from 'lucide-react';

// Only same-origin relative paths are accepted as a post-login destination.
const SAFE_PATH = /^\/(?![\/\\])/;
const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const safeCallback = (raw) => (raw && SAFE_PATH.test(raw) ? raw : null);
const destinationForRole = (role) => (role === 'admin' || role === 'staff' ? '/admin' : role === 'investor' ? '/investor' : '/customer');

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = safeCallback(searchParams.get('callbackUrl'));
    const { login, demoMode, siteSettings } = useArena();
    const queryError = searchParams.get('error');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(queryError ? 'Please sign in to continue.' : '');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [, startTransition] = useTransition();
    const [showForgotHelp, setShowForgotHelp] = useState(false);

    const isEmailInput = identifier.includes('@') || /[a-zA-Z]/.test(identifier);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const trimmed = identifier.trim();
        let normalized = '';
        if (trimmed.includes('@')) {
            const email = trimmed.toLowerCase();
            if (!EMAIL_RE.test(email)) {
                setError('Please enter a valid email address.');
                return;
            }
            normalized = email;
        }
        else {
            const digits = cleanPhone(trimmed);
            if (!PHONE_RE.test(digits)) {
                setError('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01XXXXXXXXX) or email address.');
                return;
            }
            normalized = digits;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await login(normalized, password);
            if (res.success) {
                setSuccess(res.message || 'Signed in. Taking you to your dashboard...');
                const dest = callbackUrl || destinationForRole(res.user?.role);
                startTransition(() => {
                    router.push(dest);
                    router.refresh();
                });
            }
            else {
                setError(res.message || 'Sign in failed. Please check your credentials and try again.');
            }
        }
        catch {
            setError('Something went wrong while signing in. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };

    const fillDemoCredentials = (demoId, demoPass) => {
        setIdentifier(demoId);
        setPassword(demoPass);
        setError('');
        setSuccess('');
    };

    return (<div className="w-full space-y-6">
      <div className="bg-[#0c131a]/95 border border-emerald-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"/>

        <div className="text-center space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-mono font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
            <Sparkles className="w-3 h-3 text-emerald-400"/>
            <span>CROSSBAR MEMBER ACCESS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Welcome to the Pitch
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Enter your mobile number or email and password to access your turf bookings &amp; arena dashboard.
          </p>
        </div>

        {error && (<div role="alert" className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400"/>
            <span className="flex-1 font-medium">{error}</span>
          </div>)}

        {success && (<div role="status" className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400"/>
            <span className="flex-1 font-medium">{success}</span>
          </div>)}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-identifier" className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Mobile Number or Email</span>
              <span className="text-[11px] font-mono text-emerald-400 font-normal">01XXXXXXXXX / email</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-slate-400">
                {isEmailInput ? <Mail className="w-4 h-4 text-emerald-400"/> : <Phone className="w-4 h-4 text-emerald-400"/>}
              </div>
              <input id="login-identifier" type="text" autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="01XXXXXXXXX or name@email.com" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition-colors outline-none"/>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <label htmlFor="login-password">Password</label>
              <button type="button" onClick={() => setShowForgotHelp(true)} className="text-emerald-400 hover:text-emerald-300 text-[12px] font-normal hover:underline cursor-pointer">
                Forgot password?
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400"/>
              </div>
              <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-slate-500 transition-colors outline-none"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 text-slate-400 hover:text-white cursor-pointer transition-colors" title={showPassword ? 'Hide password' : 'Show password'} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full mt-2 py-3.5 px-6 rounded-xl font-black text-sm tracking-wide text-slate-950 bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 hover:brightness-110 active:scale-[0.99] shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? (<>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"/>
                <span>Signing in...</span>
              </>) : (<>
                <span>Sign In &amp; Enter Arena</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]"/>
              </>)}
          </button>
        </form>

        {demoMode && (<div className="mt-6 pt-5 border-t border-emerald-500/15">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[12px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400"/>
                Demo profiles (demo mode only)
              </span>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => fillDemoCredentials('01844332211', 'password123')} className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group">
                <div className="flex items-center gap-1 text-[12px] font-bold text-white group-hover:text-emerald-400 truncate">
                  <UserCheck className="w-3 h-3 text-emerald-400 shrink-0"/>
                  <span>Player</span>
                </div>
              </button>
              <button type="button" onClick={() => fillDemoCredentials('01711223344', 'password123')} className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group">
                <div className="flex items-center gap-1 text-[12px] font-bold text-white group-hover:text-emerald-400 truncate">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0"/>
                  <span>Admin</span>
                </div>
              </button>
              <button type="button" onClick={() => fillDemoCredentials('01819556677', 'password123')} className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group">
                <div className="flex items-center gap-1 text-[12px] font-bold text-white group-hover:text-emerald-400 truncate">
                  <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0"/>
                  <span>Investor</span>
                </div>
              </button>
            </div>
          </div>)}

        <div className="mt-6 pt-5 border-t border-emerald-500/15 text-center">
          <p className="text-xs text-slate-400">
            Don&apos;t have a Crossbar account yet?{' '}
            <Link href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/register'} className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-colors ml-1">
              Register now →
            </Link>
          </p>
        </div>
      </div>

      {showForgotHelp && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="forgot-title">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 id="forgot-title" className="text-sm font-bold text-white font-display">Reset your password</h3>
              <button type="button" onClick={() => setShowForgotHelp(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer" aria-label="Close">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <ForgotPasswordFlow
              initialIdentifier={identifier}
              whatsappUrl={siteSettings.whatsappUrl}
              deskPhone={siteSettings.phone}
              deskPhoneFormatted={siteSettings.phoneFormatted}
              onSuccess={(resetId) => {
                if (resetId) setIdentifier(resetId);
                setPassword('');
              }}
              onBackToLogin={() => setShowForgotHelp(false)}
            />
          </div>
        </div>)}
    </div>);
}

export default function LoginPage() {
    return (<Suspense fallback={<div className="w-full min-h-[400px] flex items-center justify-center text-slate-400 font-mono text-xs">
        Loading member portal...
      </div>}>
      <LoginForm />
    </Suspense>);
}
