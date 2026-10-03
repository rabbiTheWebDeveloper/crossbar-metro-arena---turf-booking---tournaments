'use client';

import React from 'react';
import Link from 'next/link';
import { CrossbarLogo } from '../../components/CrossbarLogo';
import { ShieldCheck, ArrowLeft, ExternalLink, Calendar, Users, DollarSign } from 'lucide-react';
import { useArena } from '../../context/ArenaContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { bookings, registrations } = useArena();
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

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
              <span className="text-slate-400">Bookings: </span>
              <span className="font-bold text-white font-mono">{bookings.length}</span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div>
              <span className="text-slate-400">Total Rev: </span>
              <span className="font-bold text-emerald-400 font-mono">৳{totalRevenue.toLocaleString()}</span>
            </div>
          </div>

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
