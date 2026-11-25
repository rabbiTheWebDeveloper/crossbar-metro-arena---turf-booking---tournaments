import React from 'react';
import Link from 'next/link';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { ArrowLeft, ShieldCheck, MapPin } from 'lucide-react';
import { VENUE_INFO } from '@/data/initialData';

export default function AuthLayout({ children }) {
    return (<div className="min-h-dvh bg-[#070b0e] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950">
      <div className="fixed inset-0 pointer-events-none z-0" style={{
            backgroundImage: `
            radial-gradient(900px 540px at 50% -10%, rgba(76, 191, 2, 0.16), transparent 70%),
            radial-gradient(700px 440px at 10% 40%, rgba(76, 191, 2, 0.08), transparent 60%),
            radial-gradient(700px 440px at 90% 70%, rgba(163, 230, 53, 0.06), transparent 60%)
          `
        }}/>

      <div className="fixed inset-0 pointer-events-none z-0 opacity-20" style={{
            backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)'
        }}/>

      <header className="sticky top-0 z-20 border-b border-emerald-500/15 bg-[#080d12]/85 backdrop-blur-xl px-4 sm:px-8 py-3 pt-safe flex items-center justify-between">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="hover:opacity-95 transition-opacity flex items-center gap-2 group min-w-0">
            <CrossbarLogo size="responsive"/>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-mono font-bold">SECURE PORTAL ACCESS</span>
              <span className="text-white/20">|</span>
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3 h-3 text-emerald-400"/>
                {VENUE_INFO.metroStation}
              </span>
            </div>

            <Link href="/" className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer group">
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform"/>
              <span>Arena Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-3.5 sm:px-4 py-6 sm:py-10">
        <div className="w-full max-w-md sm:max-w-lg animate-fade-in">
          {children}
        </div>
      </main>

      <footer className="relative z-20 border-t border-emerald-500/10 bg-[#070b0e]/90 backdrop-blur-sm px-4 py-4 pb-safe text-xs text-slate-400">
        <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0"/>
            <span>Encrypted session · Customer, Investor &amp; Admin Portals</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px] text-slate-400">
            <span>bKash · Nagad · Card (EPS)</span>
            <span className="hidden sm:inline">·</span>
            <a href={`tel:${VENUE_INFO.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-emerald-400 transition-colors font-mono">Helpline: {VENUE_INFO.phoneFormatted || VENUE_INFO.phone}</a>
          </div>
        </div>
      </footer>
    </div>);
}
