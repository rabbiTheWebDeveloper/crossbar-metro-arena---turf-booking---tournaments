'use client';

import React from 'react';
import Link from 'next/link';
import { CrossbarLogo } from '../../components/CrossbarLogo';
import { Footer } from '../../components/Footer';
import { Ticket, ArrowLeft, Calendar, ShieldCheck } from 'lucide-react';
import { useArena } from '../../context/ArenaContext';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { bookings } = useArena();

  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col font-sans">
      {/* User Portal Header */}
      <header className="sticky top-0 z-40 bg-[#080d12]/95 backdrop-blur-md border-b border-emerald-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <CrossbarLogo size="responsive" />
          </Link>
          <div className="hidden sm:block h-5 w-px bg-white/20"></div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Player Wallet &amp; Passes</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Back to Arena</span>
          </Link>

          <Link
            href="/booking"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Slot</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>

      <Footer />
    </div>
  );
}
