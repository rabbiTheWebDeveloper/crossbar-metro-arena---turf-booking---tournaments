'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useArena } from '../../../context/ArenaContext';
import { MatchTrackerSection } from '../../../components/MatchTrackerSection';
import { Ticket, Users, Flame, Calendar, MessageSquare } from 'lucide-react';

export default function MatchesPage() {
  const router = useRouter();
  const { bookings, challenges, handleAddChallenge } = useArena();

  return (
    <div className="py-8 md:py-12">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span>Matchday Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight text-white">
              Live Fixtures &amp; Squad Challenges
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-2xl">
              Track upcoming match kickoffs across Pitch Alpha and Bravo, find opponent teams looking for scrimmages, or request guest players to complete your squad.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/booking')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-black hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule A Fixture</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Fixtures and Match Tracker Section */}
      <MatchTrackerSection
        bookings={bookings}
        challenges={challenges}
        onAddChallenge={handleAddChallenge}
        onBookSlotClick={() => router.push('/booking')}
      />
    </div>
  );
}
