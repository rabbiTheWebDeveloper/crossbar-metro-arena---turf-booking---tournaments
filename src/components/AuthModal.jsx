'use client';
import React, { useState, useEffect } from 'react';
import { useArena, cleanPhone } from '../context/ArenaContext';
import { CrossbarLogo } from './CrossbarLogo';
import { X, ShieldCheck, CheckCircle2, AlertCircle, TrendingUp, ArrowRight, MessageSquare, UserCheck } from 'lucide-react';

const PHONE_RE = /^01[3-9]\d{8}$/;

/**
 * Login / sign-up modal. It is mounted only while `showAuthModal` is true (see GlobalModals),
 * so the initial tab is taken from `authModalInitialTab` on mount.
 */
export const AuthModal = () => {
    const { setShowAuthModal, authModalInitialTab, currentUser, login, signup, switchDemoUser, demoMode, siteSettings } = useArena();
    const [activeTab, setActiveTab] = useState(authModalInitialTab === 'signup' ? 'signup' : 'login');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [position, setPosition] = useState('MID');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForgotHelp, setShowForgotHelp] = useState(false);

    useEffect(() => {
        setActiveTab(authModalInitialTab === 'signup' ? 'signup' : 'login');
    }, [authModalInitialTab]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setShowAuthModal(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [setShowAuthModal]);

    const handleClose = () => {
        setShowAuthModal(false);
        setError('');
        setSuccessMsg('');
    };
    const switchTab = (tab) => { setActiveTab(tab); setError(''); setSuccessMsg(''); setShowForgotHelp(false); };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const digits = cleanPhone(phone);
        if (!PHONE_RE.test(digits)) { setError('Enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).'); return; }
        if (!password) { setError('Please enter your password.'); return; }
        setIsSubmitting(true);
        const res = await login(digits, password);
        setIsSubmitting(false);
        if (res.success) {
            setSuccessMsg(res.message || 'Signed in successfully.');
            setTimeout(() => handleClose(), 600);
        }
        else {
            setError(res.message || 'Sign in failed. Please check your number and password.');
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const digits = cleanPhone(phone);
        if (!name.trim() || name.trim().length < 2) { setError('Please enter your full name.'); return; }
        if (!PHONE_RE.test(digits)) { setError('Enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).'); return; }
        if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setIsSubmitting(true);
        const res = await signup({ name: name.trim(), phone: digits, password, playingPosition: position });
        setIsSubmitting(false);
        if (res.success) {
            setSuccessMsg(res.message || 'Player account created. Welcome to Crossbar Metro Arena!');
            setTimeout(() => handleClose(), 800);
        }
        else {
            setError(res.message || 'Registration failed. Please try again.');
        }
    };

    const handleDemo = async (role) => {
        setIsSubmitting(true);
        const res = await switchDemoUser(role);
        setIsSubmitting(false);
        if (res?.success) handleClose();
        else setError(res?.message || 'Demo sign-in failed.');
    };

    const tabs = [
        { id: 'login', label: 'Login' },
        { id: 'signup', label: 'Sign Up' },
        ...(demoMode ? [{ id: 'demo', label: 'Demo Roles' }] : [])
    ];

    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 blur-3xl pointer-events-none"></div>

        <button type="button" onClick={handleClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-slate-400 hover:text-white transition-colors cursor-pointer" aria-label="Close">
          <X className="w-5 h-5"/>
        </button>

        <div className="p-6 text-center border-b border-white/10 bg-gradient-to-b from-slate-900 to-[#0b1016]">
          <div className="flex justify-center mb-2">
            <CrossbarLogo size="responsive"/>
          </div>
          <h3 id="auth-modal-title" className="text-xl font-black text-white font-display uppercase tracking-wide">
            {activeTab === 'login' && 'Account Login'}
            {activeTab === 'signup' && 'Player Sign Up'}
            {activeTab === 'demo' && 'Demo Role Switcher'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'login' && 'Log in with your Bangladeshi mobile number'}
            {activeTab === 'signup' && 'Join the arena to book slots and post match results'}
            {activeTab === 'demo' && 'Demo accounts are enabled on this build only'}
          </p>

          <div className={`grid gap-1 mt-5 bg-white/5 p-1 rounded-xl text-xs font-bold border border-white/10 ${tabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`} role="tablist">
            {tabs.map(t => (<button key={t.id} type="button" role="tab" aria-selected={activeTab === t.id} onClick={() => switchTab(t.id)} className={`py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === t.id ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                {t.label}
              </button>))}
          </div>
        </div>

        <div className="px-6 pt-4">
          {error && (<div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400"/>
              <span>{error}</span>
            </div>)}
          {successMsg && (<div role="status" className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400"/>
              <span>{successMsg}</span>
            </div>)}
        </div>

        {activeTab === 'login' && (<form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="auth-login-phone" className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+880</span>
                <input id="auth-login-phone" type="tel" inputMode="numeric" autoComplete="tel-national" required placeholder="01XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"/>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-login-password" className="text-xs font-semibold text-slate-300">Password</label>
                <button type="button" onClick={() => setShowForgotHelp(v => !v)} className="text-xs text-emerald-400 hover:underline cursor-pointer">
                  Forgot password?
                </button>
              </div>
              <input id="auth-login-password" type="password" autoComplete="current-password" required placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"/>
            </div>

            {showForgotHelp && (<div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 space-y-2">
                <p>Password reset by SMS is not available yet. Message the arena desk on WhatsApp from your registered number and the team will reset it for you.</p>
                <a href={siteSettings.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#25D366] font-bold hover:underline">
                  <MessageSquare className="w-3.5 h-3.5"/>
                  <span>Message the arena desk</span>
                </a>
              </div>)}

            <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Signing in...' : 'Log In to Account'}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => switchTab('signup')} className="text-emerald-400 font-bold hover:underline cursor-pointer">
                Sign up as a player
              </button>
            </div>
          </form>)}

        {activeTab === 'signup' && (<form onSubmit={handleSignupSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="auth-signup-name" className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input id="auth-signup-name" type="text" autoComplete="name" required placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"/>
            </div>

            <div>
              <label htmlFor="auth-signup-phone" className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile Number (01XXXXXXXXX)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+880</span>
                <input id="auth-signup-phone" type="tel" inputMode="numeric" autoComplete="tel-national" required placeholder="01XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="auth-signup-position" className="block text-xs font-semibold text-slate-300 mb-1.5">Playing Position</label>
                <select id="auth-signup-position" value={position} onChange={e => setPosition(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500">
                  <option value="FWD">Forward (FWD)</option>
                  <option value="MID">Midfielder (MID)</option>
                  <option value="DEF">Defender (DEF)</option>
                  <option value="GK">Goalkeeper (GK)</option>
                </select>
              </div>
              <div>
                <label htmlFor="auth-signup-password" className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <input id="auth-signup-password" type="password" autoComplete="new-password" required minLength={6} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"/>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Creating profile...' : 'Create Player Account'}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              Already registered?{' '}
              <button type="button" onClick={() => switchTab('login')} className="text-emerald-400 font-bold hover:underline cursor-pointer">
                Log in
              </button>
            </div>
          </form>)}

        {activeTab === 'demo' && demoMode && (<div className="p-6 space-y-3">
            <div className="text-xs text-slate-300 mb-2">Select a role to test permissions and dashboards:</div>
            {[
                { role: 'visitor', label: 'Visitor (no account)', desc: 'Browse slots, shop and public matches', icon: null },
                { role: 'player', label: 'Player / Captain', desc: 'Book slots, manage a team, post scores', icon: UserCheck },
                { role: 'admin', label: 'Arena Admin', desc: 'Counter bookings, prices, reports, expenses', icon: ShieldCheck },
                { role: 'investor', label: 'Investor', desc: 'Read-only profit share and payout reports', icon: TrendingUp }
            ].map(d => {
                const Icon = d.icon;
                return (<button key={d.role} type="button" disabled={isSubmitting} onClick={() => handleDemo(d.role)} className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-colors cursor-pointer disabled:opacity-50">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4 text-emerald-400"/>}
                      <span>{d.label}</span>
                      {currentUser?.role === d.role && <span className="px-2 py-0.5 text-[11px] rounded bg-emerald-500 text-slate-950 font-bold">Active</span>}
                    </div>
                    <div className="text-[12px] text-slate-400">{d.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400"/>
                </button>);
            })}
          </div>)}
      </div>
    </div>);
};
