'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useArena } from '@/context/ArenaContext';
import { User, Phone, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
export default function RegisterPage() {
    const router = useRouter();
    const { signup } = useArena();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [position, setPosition] = useState('MID');
    const [agreeTerms, setAgreeTerms] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPending, startTransition] = useTransition();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!name.trim() || name.trim().length < 2) {
            setError('Please enter your full name (minimum 2 characters).');
            return;
        }
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(cleanPhone)) {
            setError('Please enter a valid 11-digit Bangladeshi mobile number starting with 01 (e.g. 01711223344).');
            return;
        }
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match. Please re-check.');
            return;
        }
        if (!agreeTerms) {
            setError('Please accept the Crossbar Arena turf rules & fair play pledge to continue.');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await signup({
                name: name.trim(),
                phone: cleanPhone,
                password,
                playingPosition: position,
                role: 'player'
            });
            if (res.success) {
                setSuccess('Player profile created successfully! Welcome to Crossbar Metro Arena.');
                setTimeout(() => {
                    startTransition(() => {
                        router.push('/player');
                    });
                }, 800);
            }
            else {
                setError(res.message || 'Registration failed. Please try again.');
            }
        }
        catch (err) {
            setError(err?.message || 'A network error occurred. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="w-full space-y-6">
      
      {/* AUTH CARD */}
      <div className="bg-[#0c131a]/95 border border-emerald-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"/>

        {/* Card Header */}
        <div className="text-center space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
            <Trophy className="w-3 h-3 text-emerald-400"/>
            <span>JOIN CROSSBAR METRO ARENA</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Create Player Profile
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Book 90-min floodlit slots 24/7, enter tournaments, and track match stats in Dhaka.
          </p>
        </div>

        {/* Error Alert */}
        {error && (<div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400"/>
            <span className="flex-1 font-medium">{error}</span>
          </div>)}

        {/* Success Alert */}
        {success && (<div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400"/>
            <span className="flex-1 font-medium">{success}</span>
          </div>)}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Full Name
            </label>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-slate-400">
                <User className="w-4 h-4 text-emerald-400"/>
              </div>

              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tanvir Ahmed" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition-colors outline-none"/>
            </div>
          </div>

          {/* Mobile Number Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Mobile Number</span>
              <span className="text-[10px] font-mono text-emerald-400 font-normal">Bangladesh (+880)</span>
            </label>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-slate-400">
                <Phone className="w-4 h-4 text-emerald-400"/>
                <span className="text-xs font-mono font-bold text-slate-400 border-r border-white/10 pr-2">+88</span>
              </div>

              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01711223344" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-3 pl-20 pr-4 text-sm text-white placeholder:text-slate-500 font-mono transition-colors outline-none"/>
            </div>
          </div>

          {/* Playing Position Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Playing Position</span>
              <span className="text-[10px] text-slate-400">Shown on squad cards</span>
            </label>

            <div className="grid grid-cols-4 gap-2">
              {[
            { id: 'GK', label: 'GK', desc: 'Goalkeeper' },
            { id: 'DEF', label: 'DEF', desc: 'Defender' },
            { id: 'MID', label: 'MID', desc: 'Midfielder' },
            { id: 'FWD', label: 'FWD', desc: 'Forward' },
        ].map(pos => {
            const isSelected = position === pos.id;
            return (<button key={pos.id} type="button" onClick={() => setPosition(pos.id)} className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all text-center cursor-pointer border ${isSelected
                    ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-md shadow-emerald-400/20'
                    : 'bg-[#080d12] text-slate-400 border-white/10 hover:text-white hover:border-white/20'}`}>
                    <div>{pos.label}</div>
                    <div className={`text-[9px] font-sans font-normal ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                      {pos.desc}
                    </div>
                  </button>);
        })}
            </div>
          </div>

          {/* Password & Confirm Password in 2 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-emerald-400"/>
                </div>
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 chars" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-3 pl-10 pr-9 text-sm text-white placeholder:text-slate-500 outline-none"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Confirm Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-emerald-400"/>
                </div>
                <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none"/>
              </div>
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#080d12] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"/>
              <span>
                I agree to Crossbar Arena turf rules, fair play pledge &amp; ৳500 advance deposit policy.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={isSubmitting} className="w-full mt-2 py-3.5 px-6 rounded-xl font-black text-sm tracking-wide text-slate-950 bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 hover:brightness-110 active:scale-[0.99] shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? (<>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"/>
                <span>Creating Player Profile...</span>
              </>) : (<>
                <span>Create Player Account</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]"/>
              </>)}
          </button>
        </form>

        {/* Bottom Switch to Login */}
        <div className="mt-6 pt-5 border-t border-emerald-500/15 text-center">
          <p className="text-xs text-slate-400">
            Already have an arena account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-colors ml-1">
              Sign in to your account →
            </Link>
          </p>
        </div>

      </div>

    </div>);
}
