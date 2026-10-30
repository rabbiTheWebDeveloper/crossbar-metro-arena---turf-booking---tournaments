'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Calendar, LogOut, LogIn, UserCircle2 } from 'lucide-react';
import { useArena } from '@/context/ArenaContext';

export default function UserLayout({ children }) {
    const { currentUser, isVisitor, authChecked, logout, setShowAuthModal, setAuthModalInitialTab } = useArena();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try { await logout(); } finally { setLoggingOut(false); }
        router.push('/');
    };
    const openLogin = () => { setAuthModalInitialTab('login'); setShowAuthModal(true); };

    return (<div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#080d12]/95 backdrop-blur-md border-b border-emerald-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
            <CrossbarLogo size="responsive"/>
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/20"></div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Player &amp; Team Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {authChecked && !isVisitor && (<div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 max-w-[220px]" title={currentUser?.phone || ''}>
              <UserCircle2 className="w-4 h-4 text-emerald-400 shrink-0"/>
              <div className="min-w-0 leading-tight">
                <div className="text-xs font-bold text-white truncate">{currentUser?.name || 'Player'}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">{currentUser?.role || 'player'}</div>
              </div>
            </div>)}

          <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5"/>
            <span className="hidden xs:inline">Back to Arena</span>
          </Link>

          <Link href="/booking" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20">
            <Calendar className="w-3.5 h-3.5"/>
            <span>Book Slot</span>
          </Link>

          {authChecked && (isVisitor ? (
            <button type="button" onClick={openLogin} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all border border-white/10 cursor-pointer">
              <LogIn className="w-3.5 h-3.5"/>
              <span className="hidden xs:inline">Log In</span>
            </button>) : (
            <button type="button" onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-xs font-semibold text-slate-300 transition-all border border-white/10 disabled:opacity-50 cursor-pointer">
              <LogOut className="w-3.5 h-3.5"/>
              <span className="hidden xs:inline">{loggingOut ? 'Logging out…' : 'Logout'}</span>
            </button>))}
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>);
}
