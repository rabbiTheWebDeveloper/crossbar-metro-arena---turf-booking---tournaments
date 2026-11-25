'use client';
import React, { useState, useTransition, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useArena, cleanPhone } from '@/context/ArenaContext';
import { resolvePostLoginPath } from '@/lib/permissions';
import { ForgotPasswordFlow } from '@/components/ForgotPasswordFlow';
import {
    Phone, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2,
    AlertCircle, Sparkles, Zap, UserCheck, TrendingUp, X, LogOut
} from 'lucide-react';

const SAFE_PATH = /^\/(?![\/\\])/;
const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const safeCallback = (raw) => (raw && SAFE_PATH.test(raw) ? raw : null);

const PORTAL_HINTS = [
    {
        id: 'customer',
        label: 'Customer',
        icon: UserCheck,
        badge: 'PLAYER & CAPTAIN PORTAL',
        subtitle: 'Sign in to view your turf passes, manage bookings, build your squad, and post match scores.'
    },
    {
        id: 'investor',
        label: 'Investor',
        icon: TrendingUp,
        badge: 'EQUITY PARTNER PORTAL',
        subtitle: 'Sign in with your partner mobile or email to inspect live dividends, monthly expenses, and payouts.'
    },
    {
        id: 'admin',
        label: 'Admin / Staff',
        icon: ShieldCheck,
        badge: 'ARENA DESK CONSOLE',
        subtitle: 'Sign in with your Super Admin or assigned Staff Role account to open your permitted Arena Desk dashboard.'
    }
];

function initialPortalTab(callbackUrl) {
    if (!callbackUrl) return 'customer';
    if (callbackUrl.startsWith('/admin')) return 'admin';
    if (callbackUrl.startsWith('/investor')) return 'investor';
    return 'customer';
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = safeCallback(searchParams.get('callbackUrl'));
    const wantsSwitch = searchParams.get('switch') === 'true';
    const queryError = (searchParams.get('error') || '').slice(0, 180);

    const { login, logout, currentUser, isVisitor, authChecked, demoMode, siteSettings } = useArena();

    const [portalTab, setPortalTab] = useState(() => initialPortalTab(callbackUrl));
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(queryError);
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [switchingOut, setSwitchingOut] = useState(false);
    const [, startTransition] = useTransition();
    const [showForgotHelp, setShowForgotHelp] = useState(false);

    const activePortalMeta = useMemo(
        () => PORTAL_HINTS.find(p => p.id === portalTab) || PORTAL_HINTS[0],
        [portalTab]
    );

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
        } else {
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
                const dest = resolvePostLoginPath(res.user, callbackUrl);
                const roleLabel = res.user?.role === 'admin'
                    ? 'Admin Desk'
                    : res.user?.role === 'staff'
                        ? `${res.user.staffRoleName || 'Staff'} Dashboard`
                        : res.user?.role === 'investor'
                            ? 'Investor Portal'
                            : 'Customer Panel';
                setSuccess(`Welcome back, ${res.user?.name || 'Member'}! Opening ${roleLabel}…`);
                startTransition(() => {
                    router.replace(dest);
                    router.refresh();
                });
            } else {
                setError(res.message || 'Sign in failed. Please check your credentials and try again.');
            }
        } catch {
            setError('Something went wrong while signing in. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSwitchAccount = async () => {
        if (switchingOut) return;
        setSwitchingOut(true);
        try {
            await logout();
            router.refresh();
        } finally {
            setSwitchingOut(false);
        }
    };

    const fillDemoCredentials = (demoId, demoPass, roleKey) => {
        setIdentifier(demoId);
        setPassword(demoPass);
        if (roleKey) setPortalTab(roleKey);
        setError('');
        setSuccess('');
    };

    // If user is already authenticated on client navigation (and didn't request ?switch=true), offer instant portal jump
    if (authChecked && !isVisitor && !wantsSwitch && !success) {
        const myDest = resolvePostLoginPath(currentUser, callbackUrl);
        const myBadge = currentUser.role === 'admin'
            ? 'Super Admin'
            : currentUser.role === 'staff'
                ? (currentUser.staffRoleName || 'Staff')
                : currentUser.role === 'investor'
                    ? 'Investor Partner'
                    : 'Customer';

        return (
            <div className="w-full">
                <div className="bg-[#0c131a]/95 border border-emerald-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-400 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
                        {(currentUser.name || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Signed in · {myBadge}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white font-display pt-1">
                            {currentUser.name}
                        </h2>
                        <p className="text-xs font-mono text-slate-400">
                            {currentUser.phone}{currentUser.email && !currentUser.email.endsWith('@bookcrossbar.com') ? ` · ${currentUser.email}` : ''}
                        </p>
                    </div>

                    <div className="space-y-2.5 pt-1">
                        <Link
                            href={myDest}
                            className="w-full py-3.5 px-5 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 hover:brightness-110 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                        >
                            <span>Continue to {myBadge} Dashboard</span>
                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </Link>
                        <button
                            type="button"
                            disabled={switchingOut}
                            onClick={handleSwitchAccount}
                            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-xs font-bold text-slate-300 hover:text-rose-300 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>{switchingOut ? 'Signing out…' : 'Sign out & use another account'}</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (<div className="w-full space-y-6">
      <div className="bg-[#0c131a]/95 border border-emerald-500/25 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"/>

        {/* Role Portal Selector Strip */}
        <div className="relative grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#080d12] border border-white/10 mb-6" role="tablist" aria-label="Account portal">
          {PORTAL_HINTS.map(p => {
            const Icon = p.icon;
            const active = portalTab === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPortalTab(p.id)}
                className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500 to-lime-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{p.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
            <Sparkles className="w-3 h-3 text-emerald-400"/>
            <span>{activePortalMeta.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Welcome to the Pitch
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            {activePortalMeta.subtitle}
          </p>
        </div>

        {error && (<div role="alert" className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5"/>
            <span className="flex-1 font-medium leading-relaxed">{error}</span>
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
              <input id="login-identifier" type="text" autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="01XXXXXXXXX or name@email.com" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-4 text-base sm:text-sm text-white placeholder:text-slate-500 transition-colors outline-none"/>
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
              <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-11 text-base sm:text-sm text-white placeholder:text-slate-500 transition-colors outline-none"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 text-slate-400 hover:text-white cursor-pointer transition-colors" title={showPassword ? 'Hide password' : 'Show password'} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full mt-2 py-3.5 px-6 rounded-xl font-black text-sm tracking-wide text-slate-950 bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 hover:brightness-110 active:scale-[0.99] shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? (<>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"/>
                <span>Verifying &amp; Signing in…</span>
              </>) : (<>
                <span>Sign In to Your Account</span>
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
              <button type="button" onClick={() => fillDemoCredentials('01844332211', 'password123', 'customer')} className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group">
                <div className="flex items-center gap-1 text-[12px] font-bold text-white group-hover:text-emerald-400 truncate">
                  <UserCheck className="w-3 h-3 text-emerald-400 shrink-0"/>
                  <span>Customer</span>
                </div>
              </button>
              <button type="button" onClick={() => fillDemoCredentials('01711223344', 'password123', 'admin')} className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group">
                <div className="flex items-center gap-1 text-[12px] font-bold text-white group-hover:text-emerald-400 truncate">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0"/>
                  <span>Admin</span>
                </div>
              </button>
              <button type="button" onClick={() => fillDemoCredentials('01819556677', 'password123', 'investor')} className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group">
                <div className="flex items-center gap-1 text-[12px] font-bold text-white group-hover:text-emerald-400 truncate">
                  <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0"/>
                  <span>Investor</span>
                </div>
              </button>
            </div>
          </div>)}

        <div className="mt-6 pt-5 border-t border-emerald-500/15 text-center space-y-1.5">
          {portalTab === 'customer' ? (
            <p className="text-xs text-slate-400">
              New to Crossbar Metro Arena?{' '}
              <Link href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/register'} className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-colors ml-1">
                Create Customer Account →
              </Link>
            </p>
          ) : (
            <p className="text-[11.5px] text-slate-400">
              {portalTab === 'investor'
                ? 'Investor Partner accounts are provisioned by Arena Administration.'
                : 'Staff & Admin accounts are managed by Super Admin under Users & Roles.'}{' '}
              <button type="button" onClick={() => setPortalTab('customer')} className="text-emerald-400 hover:underline font-semibold cursor-pointer">
                Customer sign-up →
              </button>
            </p>
          )}
        </div>
      </div>

      {showForgotHelp && (<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="forgot-title">
          <div className="bg-[#0c131a] border-t sm:border border-emerald-500/30 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="sm:hidden w-10 h-1 rounded-full bg-white/15 mx-auto -mt-1 mb-1"/>
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
    return (<Suspense fallback={<div className="w-full min-h-[380px] rounded-3xl bg-[#0c131a]/80 border border-white/10 animate-pulse flex items-center justify-center text-slate-400 font-mono text-xs">
        Loading secure sign-in…
      </div>}>
      <LoginForm />
    </Suspense>);
}
