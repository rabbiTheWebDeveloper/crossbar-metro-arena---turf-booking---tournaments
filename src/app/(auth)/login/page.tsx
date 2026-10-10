'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useArena } from '@/context/ArenaContext';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  UserCheck,
  TrendingUp,
  HelpCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const { login, currentUser } = useArena();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Forgot password OTP simulation modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Handle Login submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 11) {
      setError('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(cleanPhone, password);
      if (res.success) {
        setSuccess('Authentication successful! Welcome to the arena.');
        
        // Determine redirect destination
        const dest = callbackUrl || (
          cleanPhone === '01711000001' ? '/admin' :
          cleanPhone === '01811223344' ? '/investor' :
          '/player'
        );

        setTimeout(() => {
          startTransition(() => {
            router.push(dest);
          });
        }, 600);
      } else {
        setError(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-Click Demo Profiles Fill
  const fillDemoCredentials = (demoPhone: string, demoPass: string) => {
    setPhone(demoPhone);
    setPassword(demoPass);
    setError('');
    setSuccess('');
  };

  // Forgot password simulation
  const handleSendOtp = () => {
    const clean = forgotPhone.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 11) {
      setError('Enter a valid 11-digit number for SMS reset.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(code);
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    if (enteredOtp === simulatedOtp) {
      setOtpSuccess('SMS verified! Temporary password set to: password123');
      setPassword('password123');
      setPhone(forgotPhone);
      setTimeout(() => {
        setShowForgotModal(false);
        setOtpSent(false);
        setOtpSuccess('');
      }, 1500);
    } else {
      setError('Incorrect OTP code. Please enter the simulated SMS code.');
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* AUTH CARD */}
      <div className="bg-[#0c131a]/95 border border-emerald-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="text-center space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>CROSSBAR MEMBER ACCESS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Welcome to the Pitch
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Enter your mobile number and password to access your turf bookings &amp; arena dashboard.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="flex-1 font-medium">{success}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Mobile Number Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Mobile Number</span>
              <span className="text-[10px] font-mono text-emerald-400 font-normal">Bangladesh (+880)</span>
            </label>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-slate-400">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-400 border-r border-white/10 pr-2">+88</span>
              </div>

              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01711223344"
                className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-20 pr-4 text-sm text-white placeholder:text-slate-500 font-mono transition-colors outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <label>Password</label>
              <button
                type="button"
                onClick={() => { setForgotPhone(phone); setShowForgotModal(true); }}
                className="text-emerald-400 hover:text-emerald-300 text-[11px] font-normal hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-slate-500 transition-colors outline-none"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-white cursor-pointer transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-6 rounded-xl font-black text-sm tracking-wide text-slate-950 bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 hover:brightness-110 active:scale-[0.99] shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Verifying Access...</span>
              </>
            ) : (
              <>
                <span>Sign In &amp; Enter Arena</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* 1-CLICK DEMO CREDENTIALS SHORTCUTS */}
        <div className="mt-6 pt-5 border-t border-emerald-500/15">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1-Click Demo Profiles:
            </span>
            <span className="text-[10px] text-slate-400">Click to autofill</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Player Demo */}
            <button
              type="button"
              onClick={() => fillDemoCredentials('01711223344', 'password123')}
              className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-emerald-400 truncate">
                <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Player</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">Siam H.</div>
            </button>

            {/* Admin Demo */}
            <button
              type="button"
              onClick={() => fillDemoCredentials('01711000001', 'admin123')}
              className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-emerald-400 truncate">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Admin</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">Desk Mgr</div>
            </button>

            {/* Investor Demo */}
            <button
              type="button"
              onClick={() => fillDemoCredentials('01811223344', 'investor123')}
              className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-emerald-400 truncate">
                <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Investor</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">Abid H.</div>
            </button>
          </div>
        </div>

        {/* Bottom Switch to Register */}
        <div className="mt-6 pt-5 border-t border-emerald-500/15 text-center">
          <p className="text-xs text-slate-400">
            Don&apos;t have a Crossbar arena pass yet?{' '}
            <Link
              href="/register"
              className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-colors ml-1"
            >
              Register / Sign up now →
            </Link>
          </p>
        </div>

      </div>

      {/* SIMULATED FORGOT PASSWORD SMS MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white font-display">Reset Password via SMS</h3>
              <button
                onClick={() => { setShowForgotModal(false); setOtpSent(false); }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter your registered mobile number. We will send an SMS OTP verification code.
            </p>

            <input
              type="tel"
              value={forgotPhone}
              onChange={(e) => setForgotPhone(e.target.value)}
              placeholder="01711223344"
              className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-sm text-white font-mono"
            />

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl"
              >
                Send SMS Code
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                  📱 Simulated SMS received: <span className="font-black text-white">{simulatedOtp}</span>
                </div>

                <input
                  type="text"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP code"
                  className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2 px-3 text-sm text-white font-mono text-center tracking-widest"
                />

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Verify &amp; Set Temporary Password
                </button>
              </div>
            )}

            {otpSuccess && (
              <p className="text-xs text-emerald-400 font-semibold">{otpSuccess}</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
