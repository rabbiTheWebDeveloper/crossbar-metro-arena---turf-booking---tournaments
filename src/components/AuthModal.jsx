'use client';
import React, { useState } from 'react';
import { useArena } from '../context/ArenaContext';
import { CrossbarLogo } from './CrossbarLogo';
import { X, ShieldCheck, CheckCircle2, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
export const AuthModal = () => {
    const { showAuthModal, setShowAuthModal, authModalInitialTab, setAuthModalInitialTab, currentUser, login, signup, resetPasswordSMS, switchDemoUser, logout, users } = useArena();
    const [activeTab, setActiveTab] = useState(authModalInitialTab || 'login');
    // Form states
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [position, setPosition] = useState('MID');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Forgot password OTP simulation state
    const [otpSent, setOtpSent] = useState(false);
    const [simulatedOtp, setSimulatedOtp] = useState('');
    const [enteredOtp, setEnteredOtp] = useState('');
    if (!showAuthModal)
        return null;
    const handleClose = () => {
        setShowAuthModal(false);
        setError('');
        setSuccessMsg('');
        setOtpSent(false);
    };
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        const res = await login(phone, password || 'password123');
        setIsSubmitting(false);
        if (res.success) {
            setSuccessMsg('Logged in successfully!');
            setTimeout(() => handleClose(), 700);
        }
        else {
            setError(res.message || 'Login failed.');
        }
    };
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        const res = await signup({
            name,
            phone,
            password: password || 'password123',
            playingPosition: position,
            role: 'player'
        });
        setIsSubmitting(false);
        if (res.success) {
            setSuccessMsg('Player account created successfully! Welcome to Crossbar Metro Arena.');
            setTimeout(() => handleClose(), 900);
        }
        else {
            setError(res.message || 'Registration failed.');
        }
    };
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        const res = await resetPasswordSMS(phone);
        setIsSubmitting(false);
        if (res.success && res.otp) {
            setOtpSent(true);
            setSimulatedOtp(res.otp);
            setSuccessMsg(res.message || 'OTP sent successfully!');
        }
        else {
            setError(res.message || 'Failed to send OTP.');
        }
    };
    const handleVerifyOtp = (e) => {
        e.preventDefault();
        if (enteredOtp === simulatedOtp) {
            setSuccessMsg('SMS verification verified! You can now log into your account.');
            setTimeout(() => {
                setActiveTab('login');
                setOtpSent(false);
            }, 1200);
        }
        else {
            setError('Incorrect SMS code. Please check and retry.');
        }
    };
    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button onClick={handleClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5"/>
        </button>

        {/* Header */}
        <div className="p-6 text-center border-b border-white/10 bg-gradient-to-b from-slate-900 to-[#0b1016]">
          <div className="flex justify-center mb-2">
            <CrossbarLogo size="responsive"/>
          </div>
          <h3 className="text-xl font-black text-white font-display uppercase tracking-wide">
            {activeTab === 'login' && 'Account Login'}
            {activeTab === 'signup' && 'Player Sign Up'}
            {activeTab === 'forgot' && 'Reset Password by SMS'}
            {activeTab === 'demo' && 'Quick Role Switcher'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'login' && 'Log in with your Bangladeshi mobile number'}
            {activeTab === 'signup' && 'Join the arena to book slots and post matchday results'}
            {activeTab === 'forgot' && 'Enter your phone to receive an instant verification code'}
            {activeTab === 'demo' && 'Test the platform seamlessly with pre-configured accounts'}
          </p>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 mt-5 bg-white/5 p-1 rounded-xl text-xs font-bold border border-white/10">
            <button type="button" onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }} className={`py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'login' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              Login
            </button>
            <button type="button" onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }} className={`py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'signup' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              Sign Up
            </button>
            <button type="button" onClick={() => { setActiveTab('forgot'); setError(''); setSuccessMsg(''); }} className={`py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'forgot' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              SMS Reset
            </button>
            <button type="button" onClick={() => { setActiveTab('demo'); setError(''); setSuccessMsg(''); }} className={`py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'demo' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-emerald-400 hover:text-emerald-300'}`}>
              Demo Roles
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        <div className="px-6 pt-4">
          {error && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400"/>
              <span>{error}</span>
            </div>)}
          {successMsg && (<div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400"/>
              <span>{successMsg}</span>
            </div>)}
        </div>

        {/* Tab 1: Login Form */}
        {activeTab === 'login' && (<form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bangladeshi Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +880
                </span>
                <input type="tel" required placeholder="01844-332211" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"/>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button type="button" onClick={() => setActiveTab('forgot')} className="text-xs text-emerald-400 hover:underline cursor-pointer">
                  Forgot password?
                </button>
              </div>
              <input type="password" placeholder="Enter password (default: password123)" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"/>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50">
              {isSubmitting ? 'Verifying...' : 'Log In to Account'}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => setActiveTab('signup')} className="text-emerald-400 font-bold hover:underline cursor-pointer">
                Sign up as Player
              </button>
            </div>
          </form>)}

        {/* Tab 2: Sign Up Form */}
        {activeTab === 'signup' && (<form onSubmit={handleSignupSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <input type="text" required placeholder="e.g. Siam Chowdhury" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"/>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mobile Number (01XXXXXXXXX)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +880
                </span>
                <input type="tel" required placeholder="017XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Playing Position
                </label>
                <select value={position} onChange={e => setPosition(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500">
                  <option value="FWD">Forward (FWD)</option>
                  <option value="MID">Midfielder (MID)</option>
                  <option value="DEF">Defender (DEF)</option>
                  <option value="GK">Goalkeeper (GK)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"/>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50">
              {isSubmitting ? 'Creating Profile...' : 'Create Player Account'}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              Already registered?{' '}
              <button type="button" onClick={() => setActiveTab('login')} className="text-emerald-400 font-bold hover:underline cursor-pointer">
                Log in
              </button>
            </div>
          </form>)}

        {/* Tab 3: Forgot Password by SMS */}
        {activeTab === 'forgot' && (<div className="p-6 space-y-4">
            {!otpSent ? (<form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +880
                    </span>
                    <input type="tel" required placeholder="01XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"/>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    A 4-digit SMS OTP code will be dispatched to this number via SSLWireless Gateway.
                  </p>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer">
                  {isSubmitting ? 'Sending SMS...' : 'Send SMS Security Code'}
                </button>
              </form>) : (<form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  <div className="font-bold">SMS Dispatched!</div>
                  <div className="text-[11px] mt-0.5">
                    Sandbox Verification OTP: <span className="font-mono font-bold text-emerald-400 text-sm">{simulatedOtp}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enter 4-Digit SMS Code
                  </label>
                  <input type="text" required maxLength={4} placeholder="e.g. 4921" value={enteredOtp} onChange={e => setEnteredOtp(e.target.value)} className="w-full text-center text-xl tracking-widest font-mono py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"/>
                </div>

                <button type="submit" className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer">
                  Verify Code &amp; Reset Password
                </button>
              </form>)}
          </div>)}

        {/* Tab 4: Demo Role Switcher */}
        {activeTab === 'demo' && (<div className="p-6 space-y-3">
            <div className="text-xs text-slate-300 mb-2">
              Select any role to test permissions and dashboards instantly:
            </div>

            {/* Visitor */}
            <button type="button" onClick={() => { switchDemoUser('visitor'); handleClose(); }} className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-colors cursor-pointer">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Visitor (No Account)</span>
                  {currentUser?.role === 'visitor' && <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500 text-slate-950 font-bold">Active</span>}
                </div>
                <div className="text-[11px] text-slate-400">Browse slots, shop, and public matches</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400"/>
            </button>

            {/* Player Captain */}
            <button type="button" onClick={() => { switchDemoUser('player', 'user-player-1'); handleClose(); }} className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-colors cursor-pointer">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Player / Captain (Siam Chowdhury)</span>
                  {currentUser?.role === 'player' && <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500 text-slate-950 font-bold">Active</span>}
                </div>
                <div className="text-[11px] text-slate-400">Book slots, manage Uttara Metro FC, post scores</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400"/>
            </button>

            {/* Arena Admin */}
            <button type="button" onClick={() => { switchDemoUser('admin', 'user-admin-1'); handleClose(); }} className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-colors cursor-pointer">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400"/>
                  <span>Arena Admin (Abid Hasan)</span>
                  {currentUser?.role === 'admin' && <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500 text-slate-950 font-bold">Active</span>}
                </div>
                <div className="text-[11px] text-slate-400">Walk-ins, 24 prices, monthly reports, expenses</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400"/>
            </button>

            {/* Investor */}
            <button type="button" onClick={() => { switchDemoUser('investor', 'user-investor-1'); handleClose(); }} className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-colors cursor-pointer">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400"/>
                  <span>Investor (Rafiqul Islam · 20%)</span>
                  {currentUser?.role === 'investor' && <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500 text-slate-950 font-bold">Active</span>}
                </div>
                <div className="text-[11px] text-slate-400">Read-only profit share &amp; dividend reports</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400"/>
            </button>
          </div>)}

      </div>
    </div>);
};
