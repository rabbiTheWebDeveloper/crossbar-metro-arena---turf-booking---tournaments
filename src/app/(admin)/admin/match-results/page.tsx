'use client';

import React, { useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { MatchDayResult } from '@/types';
import { Award, Trophy, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminMatchResultsPage() {
  const { matchResults, handleSaveMatchResult } = useArena();

  const handleUpdateStatus = (result: MatchDayResult, status: 'published' | 'hidden') => {
    handleSaveMatchResult({ ...result, status });
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="pb-4 border-b border-white/10">
        <h2 className="text-xl font-black text-white font-display">
          Match Results &amp; Leaderboard Review
        </h2>
        <p className="text-xs text-slate-400">
          Authorize scorelines submitted by match captains before publishing to public tables and squad rankings.
        </p>
      </div>

      {matchResults.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">
          No match scorecards pending approval.
        </div>
      ) : (
        <div className="space-y-3">
          {matchResults.map(res => {
            const isPublished = res.status === 'published';
            const isPending = res.status === 'pending_approval';

            return (
              <div
                key={res.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all text-xs space-y-3 ${
                  isPublished
                    ? 'bg-[#0a1210] border-emerald-500/30'
                    : 'bg-[#0c131a] border-amber-400/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {res.date} · {res.slotDisplay} · {res.matchType}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    isPublished ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
                  }`}>
                    {res.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Scoreline */}
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="text-right font-bold text-sm sm:text-base text-white flex-1 truncate">
                    {res.homeTeam}
                  </div>
                  <div className="px-4 py-1.5 rounded-xl bg-black/60 border border-white/10 font-mono font-black text-xl text-lime-400">
                    {res.homeScore} : {res.awayScore}
                  </div>
                  <div className="text-left font-bold text-sm sm:text-base text-white flex-1 truncate">
                    {res.awayTeam}
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-white/5">
                  <div>
                    {res.playerOfTheMatch && (
                      <span>★ Player of Match: <strong className="text-white">{res.playerOfTheMatch}</strong></span>
                    )}
                  </div>
                  <div className="text-slate-500">
                    Submitted by: {res.postedBy}
                  </div>
                </div>

                {/* Actions */}
                {isPending && (
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(res, 'published')}
                      className="px-4 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-lime-400/10"
                    >
                      Approve &amp; Publish Score
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(res, 'hidden')}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold text-xs cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
