'use client';

import React, { useState } from 'react';
import { useArena } from '../../../context/ArenaContext';
import { PageHero } from '../../../components/PageHero';
import { Trophy, Award, Calendar, Clock, Flame, Users, PlusCircle, CheckCircle2, ChevronRight, Shield, Target } from 'lucide-react';
import Link from 'next/link';

export default function ResultsPage() {
  const { matchResults, teams } = useArena();
  const [selectedFilter, setSelectedFilter] = useState<'all' | '7v7' | '5v5'>('all');

  // Sort teams by points, then goal difference
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
    const gdA = a.stats.gf - a.stats.ga;
    const gdB = b.stats.gf - b.stats.ga;
    return gdB - gdA;
  });

  // Calculate top goal scorers across all teams
  const allPlayers = teams.flatMap(t =>
    t.players.map(p => ({
      ...p,
      teamName: t.name,
      teamColor: t.homeColor
    }))
  );
  const topScorers = allPlayers
    .filter(p => (p.goals || 0) > 0)
    .sort((a, b) => (b.goals || 0) - (a.goals || 0))
    .slice(0, 8);

  const filteredMatches = matchResults.filter(m => {
    if (selectedFilter === '7v7') return m.matchType.includes('7v7') || m.courtName.includes('Alpha');
    if (selectedFilter === '5v5') return m.matchType.includes('5v5') || m.courtName.includes('Bravo');
    return true;
  });

  return (
    <>
      <PageHero
        crumb="Match Day Results"
        eyebrow="Crossbar Metro Arena League"
        eyebrowIcon={Trophy}
        title="Official Scores &"
        highlight="Goal Scorers"
        description="Live match scores, certified goal scorer records, team standings, and the official Golden Boot race at bookcrossbar.com."
        stats={[
          { label: 'Matches Logged', value: `${matchResults.length} Games`, icon: Calendar },
          { label: 'Active Teams', value: `${teams.length} Squads`, icon: Users },
          { label: 'Top Scorer', value: topScorers[0]?.name || 'Siam Chowdhury', icon: Award },
          { label: 'Pitch Format', value: '7v7 & 5v5', icon: Trophy }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* Call to action for players */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Team Captains & Players</span>
            <h3 className="text-lg font-bold text-white mt-1">Played a match at Crossbar Arena today?</h3>
            <p className="text-xs text-slate-300">Submit your final score and official goal scorers to update the arena leaderboard.</p>
          </div>
          <Link
            href="/player"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-colors shadow-md shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Match Score</span>
          </Link>
        </div>

        {/* 1. Recent Match Results */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white font-display">
                Recent Match Results
              </h2>
              <p className="text-xs text-slate-400">
                Official scores verified by match captains and arena desk
              </p>
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              {(['all', '7v7', '5v5'] as const).map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFilter(fmt)}
                  className={`px-3 py-1 rounded-lg uppercase font-bold text-xs transition-colors cursor-pointer ${
                    selectedFilter === fmt
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fmt === 'all' ? 'All Matches' : fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMatches.map(match => (
              <div
                key={match.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-emerald-500/40 transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-emerald-400">{match.date}</span>
                    <span>·</span>
                    <span>{match.slotDisplay}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 font-medium">
                    {match.courtName}
                  </span>
                </div>

                {/* Scoreboard */}
                <div className="grid grid-cols-3 items-center text-center my-3">
                  <div className="text-left">
                    <div className="text-base sm:text-lg font-bold text-white line-clamp-1">{match.homeTeam}</div>
                    <span className="text-[11px] text-slate-400">Home Squad</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className={`text-3xl sm:text-4xl font-black font-mono ${match.homeScore > match.awayScore ? 'text-emerald-400' : 'text-white'}`}>
                      {match.homeScore}
                    </span>
                    <span className="text-slate-500 font-bold text-lg">:</span>
                    <span className={`text-3xl sm:text-4xl font-black font-mono ${match.awayScore > match.homeScore ? 'text-emerald-400' : 'text-white'}`}>
                      {match.awayScore}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold text-white line-clamp-1">{match.awayTeam}</div>
                    <span className="text-[11px] text-slate-400">Away Squad</span>
                  </div>
                </div>

                {/* Scorers list */}
                {match.scorers && match.scorers.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Official Goal Scorers</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match.scorers.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 flex items-center gap-1"
                        >
                          <span className="font-semibold text-white">{s.playerName}</span>
                          {s.minute && <span className="text-[10px] text-emerald-400 font-mono">({s.minute}')</span>}
                          <span className="text-[10px] text-slate-400">· {s.teamName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-white/5">
                  <span>Category: {match.matchType}</span>
                  <span>Posted by: {match.postedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Team Standings Table & Top Scorers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* League Table (2 Cols) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <h3 className="text-lg font-bold text-white font-display uppercase tracking-tight">
                  Crossbar Metro Arena · Team Table
                </h3>
              </div>
              <span className="text-xs text-slate-400">2026/27 Season</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold"># Pos</th>
                    <th className="pb-3 font-semibold">Team</th>
                    <th className="pb-3 font-semibold text-center">P</th>
                    <th className="pb-3 font-semibold text-center">W</th>
                    <th className="pb-3 font-semibold text-center">D</th>
                    <th className="pb-3 font-semibold text-center">L</th>
                    <th className="pb-3 font-semibold text-center">GF</th>
                    <th className="pb-3 font-semibold text-center">GA</th>
                    <th className="pb-3 font-semibold text-center">GD</th>
                    <th className="pb-3 font-semibold text-right font-bold text-emerald-400">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedTeams.map((team, idx) => {
                    const gd = team.stats.gf - team.stats.ga;
                    return (
                      <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-mono font-bold">
                          <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] ${
                            idx === 0 ? 'bg-emerald-500 text-slate-950 font-black' : idx === 1 ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-white flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: team.homeColor }}
                          />
                          <span>{team.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({team.shortCode})</span>
                        </td>
                        <td className="py-3 text-center font-mono">{team.stats.played}</td>
                        <td className="py-3 text-center font-mono text-emerald-400 font-semibold">{team.stats.won}</td>
                        <td className="py-3 text-center font-mono text-slate-400">{team.stats.drawn}</td>
                        <td className="py-3 text-center font-mono text-rose-400">{team.stats.lost}</td>
                        <td className="py-3 text-center font-mono">{team.stats.gf}</td>
                        <td className="py-3 text-center font-mono">{team.stats.ga}</td>
                        <td className="py-3 text-center font-mono font-bold text-slate-200">
                          {gd > 0 ? `+${gd}` : gd}
                        </td>
                        <td className="py-3 text-right font-mono font-black text-sm text-emerald-400">
                          {team.stats.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Goal Scorers Leaderboard */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-lg font-bold text-white font-display uppercase tracking-tight">
                Top Scorers Leaderboard
              </h3>
            </div>

            <div className="space-y-3">
              {topScorers.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md inline-flex items-center justify-center text-[10px] font-black ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-white/10 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>{player.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">#{player.number}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{player.teamName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-emerald-400 text-sm">
                      {player.goals} <span className="text-[10px] font-normal text-slate-400">goals</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{player.matchesPlayed} apps</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
