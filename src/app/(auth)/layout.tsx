import React from 'react';
import Link from 'next/link';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { ArrowLeft, ShieldCheck, Phone, MapPin, Sparkles } from 'lucide-react';
import { VENUE_INFO } from '@/data/initialData';

export const metadata = {
  title: 'Crossbar Metro Arena | Player & Partner Authentication',
  description: 'Log in or sign up to book floodlit 90-minute turf slots, manage teams, or view investor dividends at Crossbar Metro Arena, Dhaka.'
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Dynamic Background Atmosphere */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            radial-gradient(1000px 600px at 50% -10%, rgba(16, 185, 129, 0.15), transparent 70%),
            radial-gradient(800px 500px at 10% 40%, rgba(34, 197, 94, 0.08), transparent 60%),
            radial-gradient(800px 500px at 90% 70%, rgba(163, 230, 53, 0.06), transparent 60%)
          `
        }}
      />

      {/* Stadium Pitch Grid Lines overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)'
        }}
      />

      {/* TOP HEADER */}
      <header className="relative z-20 border-b border-emerald-500/15 bg-[#080d12]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          
          {/* Logo with link to homepage */}
          <Link href="/" className="hover:opacity-95 transition-opacity flex items-center gap-2 group">
            <CrossbarLogo size="responsive" />
          </Link>

          {/* Quick Return to Arena Link */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-emerald-400 font-mono font-bold">24/7 LIVE SLOTS</span>
              <span className="text-white/20">|</span>
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3 h-3 text-emerald-400" />
                Uttara Metro Center
              </span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Arena</span>
            </Link>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md sm:max-w-lg">
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 border-t border-emerald-500/10 bg-[#070b0e]/90 backdrop-blur-sm px-4 py-4 text-xs text-slate-400">
        <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure 256-bit Encrypted Turf Access · Crossbar Metro Arena Dhaka</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>bKash &amp; Nagad Verified</span>
            <span>·</span>
            <span>Helpline: {VENUE_INFO.phone}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
