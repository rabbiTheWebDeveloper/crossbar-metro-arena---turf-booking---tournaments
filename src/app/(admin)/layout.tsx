'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CrossbarLogo } from '../../components/CrossbarLogo';
import { ArrowLeft, TrendingUp, ShieldCheck } from 'lucide-react';
import { useArena } from '../../context/ArenaContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { bookings, currentUser, grossRevenue } = useArena();
  const isInvestorView = pathname?.includes('/investor');

  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col font-sans">
      {/* Top Operations Header */}
      <header className="sticky top-0 z-40 bg-[#080d12]/95 backdrop-blur-md border-b border-emerald-500/30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <CrossbarLogo size="responsive" />
          </Link>
          <div className="h-5 w-px bg-white/20 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
              Staff &amp; Operations Desk
            </span>
          </div>
        </div>

        {/* Quick Top Stats & Exit */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          <div className="hidden md:flex items-center gap-4 bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-xl">
            <div>
              <span className="text-slate-400">Total Bookings: </span>
              <span className="font-bold text-white font-mono">{bookings.length}</span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div>
              <span className="text-slate-400">Gross Income: </span>
              <span className="font-bold text-emerald-400 font-mono">৳{grossRevenue.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick tab toggle between Admin & Investor if user has permission */}
          {(currentUser?.role === 'admin' || !currentUser) && (
            <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
              <Link
                href="/admin"
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  !isInvestorView ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </Link>
              <Link
                href="/investor"
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  isInvestorView ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Investor
              </Link>
            </div>
          )}

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exit to Arena</span>
          </Link>
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-white/10 py-4 px-6 text-center text-xs text-slate-500 bg-[#05080b]">
        Crossbar Metro Arena Management Console · Uttara Metro Center, Dhaka
      </footer>
    </div>
  );
}
