'use client';

import React from 'react';
import { useArena } from '../../../context/ArenaContext';
import { TournamentSection } from '../../../components/TournamentSection';
import { Trophy, Award, Flame, Users, Calendar, ShieldCheck, Sparkles, Check } from 'lucide-react';

export default function TournamentsPage() {
  const { tournaments, handleRegistrationSuccess } = useArena();

  return (
    <div className="py-8 md:py-12">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>Championship Arena</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight text-white">
              Tournaments &amp; Cups
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-2xl">
              Compete with the top amateur &amp; semi-pro squads across Dhaka. Cash prizes, trophies, medals, live Facebook commentary, and official BFF referees.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 px-4 flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-mono">Total Prize Pool</div>
                <div className="text-lg font-black text-amber-400 font-mono">৳85,000+</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Highlights Banner */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-black/60 border border-amber-500/20">
            <Flame className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-xs text-slate-400">Live Broadcast</div>
            <div className="text-sm font-bold text-white mt-0.5">Facebook Livestreamed</div>
            <p className="text-[11px] text-slate-400 mt-1">Multi-camera knockout match coverage with pro commentary</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900/40 to-black/60 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-xs text-slate-400">Officiating</div>
            <div className="text-sm font-bold text-white mt-0.5">BFF Certified Referees</div>
            <p className="text-[11px] text-slate-400 mt-1">Neutral professional referees with strict match conduct</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-slate-900/40 to-black/60 border border-blue-500/20">
            <Trophy className="w-5 h-5 text-sky-400 mb-2" />
            <div className="text-xs text-slate-400">Individual Accolades</div>
            <div className="text-sm font-bold text-white mt-0.5">Golden Boot &amp; Glove</div>
            <p className="text-[11px] text-slate-400 mt-1">Custom engraved trophies + cash rewards for standout players</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-900/40 to-black/60 border border-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-xs text-slate-400">Team Media</div>
            <div className="text-sm font-bold text-white mt-0.5">High-Res Squad Photos</div>
            <p className="text-[11px] text-slate-400 mt-1">Pitchside photographer captures all match action &amp; celebrations</p>
          </div>
        </div>
      </div>

      {/* Main Tournaments Section */}
      <TournamentSection
        tournaments={tournaments}
        onRegistrationSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
