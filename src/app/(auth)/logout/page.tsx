'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useArena } from '@/context/ArenaContext';
import {
  LogOut,
  CheckCircle2,
  ArrowRight,
  Home,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useArena();
  const [countdown, setCountdown] = useState(4);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Perform server-side & client-side logout
    const performLogout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        console.warn('Logout API error:', err);
      }
      logout();
      setIsDone(true);
    };

    performLogout();
  }, [logout]);

  useEffect(() => {
    if (!isDone) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDone, router]);

  return (
    <div className="w-full">
      <div className="bg-[#0c131a]/95 border border-emerald-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden text-center">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Icon Emblem */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-5 shadow-xl shadow-emerald-500/20">
          <LogOut className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SESSION CLOSED SAFELY</span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display mb-2">
          See You Next Match Day!
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mb-6">
          You have been securely logged out of Crossbar Metro Arena. Your bookings and team stats remain safe.
        </p>

        {/* Countdown notice */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 font-mono mb-6">
          <span>Redirecting to arena homepage in </span>
          <span className="font-bold text-emerald-400 text-sm">{countdown}</span>
          <span> seconds...</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs tracking-wider text-slate-950 bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sign Back In</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Go to Arena Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
