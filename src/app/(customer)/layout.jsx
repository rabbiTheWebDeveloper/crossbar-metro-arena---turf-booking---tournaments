'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Calendar, LogOut } from 'lucide-react';
import { useArena } from '@/context/ArenaContext';
import { canAccessPortal, getDefaultPortalForRole } from '@/lib/permissions';

export default function CustomerLayout({ children }) {
    const { currentUser, isVisitor, authChecked, logout } = useArena();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const portalAuthorized = canAccessPortal(currentUser, '/customer');

    useEffect(() => {
        if (!authChecked) return;
        if (!portalAuthorized) {
            if (isVisitor) router.replace('/login?callbackUrl=%2Fcustomer');
            else router.replace(getDefaultPortalForRole(currentUser));
        }
    }, [authChecked, portalAuthorized, isVisitor, currentUser, router]);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await logout();
            router.replace('/login');
            router.refresh();
        } finally {
            setLoggingOut(false);
        }
    };

    // Before the session check finishes, the user comes from the login cookie (the proxy already verified the token),
    // so an allowed user sees the panel at once; anyone else sees the skeleton until the redirect above runs.
    if (!portalAuthorized) {
        return (
            <div className="min-h-dvh bg-[#070b0e] text-slate-100 flex items-center justify-center p-6 font-sans">
                <div className="w-full max-w-md space-y-4 animate-pulse" aria-busy="true">
                    <div className="h-10 w-48 rounded-xl bg-[#0c131a] border border-white/5 mx-auto" />
                    <div className="h-40 rounded-3xl bg-[#0c131a] border border-white/5" />
                </div>
            </div>
        );
    }

    const avatarInitial = (currentUser?.name || 'C').trim().charAt(0).toUpperCase() || 'C';

    return (<div className="min-h-dvh bg-[#070b0e] text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#080d12]/95 backdrop-blur-xl border-b border-emerald-500/20 px-3.5 sm:px-8 py-3 pt-safe flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
            <CrossbarLogo size="responsive" compact/>
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/15"></div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Customer Account</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 max-w-[160px] sm:max-w-[220px]" title={currentUser?.phone || ''}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
              {avatarInitial}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-[11.5px] font-bold text-white truncate">{currentUser?.name || 'Customer'}</div>
              <div className="hidden sm:block text-[9.5px] font-mono uppercase tracking-wider text-emerald-400 truncate">
                {currentUser?.phone || 'Member'}
              </div>
            </div>
          </div>

          <Link href="/" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5"/>
            <span>Arena Home</span>
          </Link>

          <Link href="/booking" className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20">
            <Calendar className="w-3.5 h-3.5"/>
            <span className="hidden xs:inline">Book</span>
          </Link>

          <button type="button" onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-xs font-semibold text-slate-300 transition-all border border-white/10 disabled:opacity-50 cursor-pointer" title="Log out">
            <LogOut className="w-3.5 h-3.5"/>
            <span className="hidden sm:inline">{loggingOut ? 'Signing out…' : 'Logout'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>);
}
