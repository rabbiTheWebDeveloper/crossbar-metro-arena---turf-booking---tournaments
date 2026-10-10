'use client';
import React from 'react';
import Link from 'next/link';
import { CrossbarLogo } from '../components/CrossbarLogo';
import { Home, Calendar } from 'lucide-react';
export default function NotFound() {
    return (<div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-md mx-auto space-y-6">
        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
          <CrossbarLogo size="lg"/>
        </Link>

        <div className="space-y-2">
          <div className="text-7xl font-sport font-black text-emerald-400 tracking-wider">
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-wide text-white">
            SHOT HIT THE CROSSBAR!
          </h1>
          <p className="text-sm text-slate-400">
            Looks like this play was ruled offside. The page you are looking for does not exist on the pitch.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all">
            <Home className="w-4 h-4 text-emerald-400"/>
            <span>Return to Pitch</span>
          </Link>
          <Link href="/booking" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black bg-gradient-to-r from-emerald-500 to-green-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-green-400 transition-all">
            <Calendar className="w-4 h-4"/>
            <span>Book A Turf Slot</span>
          </Link>
        </div>
      </div>
    </div>);
}
