'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '../../../context/ArenaContext';
import { PageHero } from '../../../components/PageHero';
import { Trophy, Award, Calendar, Clock, Users, PlusCircle, Target, MessageSquare } from 'lucide-react';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default function ResultsPage() {
    const { matchResults, teams, challenges, currentUser, setShowAuthModal } = useArena();
    const [activeMainTab, setActiveMainTab] = useState('matches');
    // Date filter for matches: 'today' | 'yesterday' | 'custom'
    const [dateFilter, setDateFilter] = useState('all');
    const [customDate, setCustomDate] = useState('');
    // Leaderboard scorer toggle: 'all_time' | 'this_month'
    const [scorerPeriod, setScorerPeriod] = useState('all_time');
    // Today & Yesterday ISO strings
    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);
    const yesterdayStr = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);
    const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);
    // Filtered matches
    const filteredMatches = useMemo(() => {
        return matchResults.filter(m => {
            if (m.status === 'hidden')
                return false;
            if (dateFilter === 'today')
                return m.date === todayStr;
            if (dateFilter === 'yesterday')
                return m.date === yesterdayStr;
            if (dateFilter === 'custom' && customDate)
                return m.date === customDate;
            return true;
        });
    }, [matchResults, dateFilter, todayStr, yesterdayStr, customDate]);
    // Sorted teams for League Standings Table (Points, then GD, then GF)
    const sortedTeams = useMemo(() => {
        return [...teams].sort((a, b) => {
            if (b.stats.points !== a.stats.points)
                return b.stats.points - a.stats.points;
            const gdA = a.stats.gf - a.stats.ga;
            const gdB = b.stats.gf - b.stats.ga;
            if (gdB !== gdA)
                return gdB - gdA;
            return b.stats.gf - a.stats.gf;
        });
    }, [teams]);
    // Top scorers (All Time vs This Month)
    const topScorers = useMemo(() => {
        const allPlayers = teams.flatMap(t => t.players.map(p => ({
            ...p,
            teamName: t.name,
            teamColor: t.homeColor
        })));
        if (scorerPeriod === 'this_month') {
            // Calculate goals scored in matches dated this month
            const monthGoalsMap = {};
            matchResults
                .filter(m => m.date.startsWith(currentMonthStr))
                .forEach(m => {
                m.scorers?.forEach(s => {
                    monthGoalsMap[s.playerName] = (monthGoalsMap[s.playerName] || 0) + 1;
                });
            });
            return allPlayers
                .map(p => ({ ...p, monthGoals: monthGoalsMap[p.name] || 0 }))
                .filter(p => p.monthGoals > 0)
                .sort((a, b) => b.monthGoals - a.monthGoals);
        }
        // All Time
        return allPlayers
            .filter(p => (p.goals || 0) > 0)
            .sort((a, b) => (b.goals || 0) - (a.goals || 0));
    }, [teams, scorerPeriod, matchResults, currentMonthStr]);
    return (<>
      <PageHero crumb="Match Day Center" eyebrow="Certified Dhaka Turf Scores & Standings" eyebrowIcon={Trophy} title="Official Scores &" highlight="Arena Standings" description="Results filtered by date, certified goal scorers, cards, match reports, the Golden Boot leaderboard, and live opponent matchmaking." stats={[
            { label: 'Matches Recorded', value: `${matchResults.length} Games`, icon: Calendar },
            { label: 'Registered Teams', value: `${teams.length} Squads`, icon: Users },
            { label: 'Top Scorer', value: topScorers[0]?.name || 'Siam Chowdhury', icon: Award },
            { label: 'Schedule', value: '12 Slots Daily', icon: Clock }
        ]}/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Main Tabs Navigation */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-bold">
            <button type="button" onClick={() => setActiveMainTab('matches')} className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${activeMainTab === 'matches'
            ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
            : 'text-slate-400 hover:text-white'}`}>
              Match Scores ({filteredMatches.length})
            </button>
            <button type="button" onClick={() => setActiveMainTab('leaderboard')} className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${activeMainTab === 'leaderboard'
            ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
            : 'text-slate-400 hover:text-white'}`}>
              Leaderboard &amp; Tables
            </button>
            <button type="button" onClick={() => setActiveMainTab('find_opponent')} className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${activeMainTab === 'find_opponent'
            ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
            : 'text-slate-400 hover:text-white'}`}>
              Find an Opponent ({challenges.length})
            </button>
          </div>

          <Link href="/player" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-500/20">
            <PlusCircle className="w-4 h-4"/>
            <span>Post Match Result</span>
          </Link>
        </div>

        {/* TAB 1: MATCH SCORES */}
        {activeMainTab === 'matches' && (<div className="space-y-6">
            
            {/* Date Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-400 uppercase tracking-wider text-[11px] mr-1">Filter by:</span>
                {[
                { id: 'all', label: 'All Results' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'custom', label: 'Pick Date' },
            ].map(tab => (<button key={tab.id} type="button" onClick={() => setDateFilter(tab.id)} className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${dateFilter === tab.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                    {tab.label}
                  </button>))}
              </div>

              {dateFilter === 'custom' && (<input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-semibold"/>)}
            </div>

            {/* Matches List */}
            {filteredMatches.length === 0 ? (<div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-white/5 space-y-3">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto"/>
                <div className="text-base font-bold text-white">No matches found for this date</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Captains can post match scores directly from their Player Portal after full-time.
                </p>
                <Link href="/player" className="inline-block mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase">
                  Post a Score
                </Link>
              </div>) : (<div className="space-y-4">
                {filteredMatches.map(match => (<div key={match.id} className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 hover:border-emerald-500/30 transition-all">
                    {/* Header: Date, Court & Tag */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">{match.date}</span>
                        <span>·</span>
                        <span className="font-mono">{match.slotDisplay}</span>
                        <span>·</span>
                        <span>{match.courtName}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 uppercase">
                        {match.matchType}
                      </span>
                    </div>

                    {/* Main Scoreboard Display */}
                    <div className="grid grid-cols-7 items-center gap-2 py-3 border-y border-white/10">
                      <div className="col-span-3 text-right">
                        <div className="text-base sm:text-xl font-black text-white">{match.homeTeam}</div>
                      </div>
                      <div className="col-span-1 text-center">
                        <div className="text-2xl sm:text-4xl font-black font-mono text-emerald-400 bg-white/[0.03] py-2 px-1 rounded-2xl border border-white/5">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      </div>
                      <div className="col-span-3 text-left">
                        <div className="text-base sm:text-xl font-black text-white">{match.awayTeam}</div>
                      </div>
                    </div>

                    {/* Scorers & Events Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Scorers */}
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-emerald-400"/>
                          <span>Goal Scorers</span>
                        </div>
                        {match.scorers && match.scorers.length > 0 ? (<div className="space-y-1">
                            {match.scorers.map((s, idx) => (<div key={idx} className="text-slate-300 flex items-center justify-between">
                                <span>⚽ {s.playerName} <span className="text-slate-500">({s.teamName})</span></span>
                                <span className="font-mono text-emerald-400 font-bold">{s.minute}&apos;</span>
                              </div>))}
                          </div>) : (<span className="text-slate-500">No goal events logged.</span>)}
                      </div>

                      {/* Cards & MOTM */}
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        {match.playerOfTheMatch && (<div className="text-amber-300 font-bold flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-400"/>
                            <span>Player of the Match: <strong>{match.playerOfTheMatch}</strong></span>
                          </div>)}
                        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                          <span>🟨 Yellow Cards: <strong className="text-white">{match.yellowCards || 0}</strong></span>
                          <span>🟥 Red Cards: <strong className="text-white">{match.redCards || 0}</strong></span>
                        </div>
                        {match.matchReport && (<p className="text-[11px] text-slate-300 italic border-t border-white/5 pt-1.5">
                            &quot;{match.matchReport}&quot;
                          </p>)}
                      </div>
                    </div>

                    {/* Team Photo if available */}
                    {match.teamPhoto && (<div className="pt-2">
                        <img src={match.teamPhoto} alt="Match Day Squad" className="w-full max-h-56 object-cover rounded-2xl border border-white/10"/>
                      </div>)}
                  </div>))}
              </div>)}
          </div>)}

        {/* TAB 2: LEADERBOARD & TABLES */}
        {activeMainTab === 'leaderboard' && (<div className="space-y-10">
            
            {/* 1. Official League Standings Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase text-white font-display">
                    Arena League Standings
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated from certified matches between registered squads (3 pts win, 1 pt draw)
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-900/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Pos</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-3 text-center">P</th>
                      <th className="py-3 px-3 text-center">W</th>
                      <th className="py-3 px-3 text-center">D</th>
                      <th className="py-3 px-3 text-center">L</th>
                      <th className="py-3 px-3 text-center">GF</th>
                      <th className="py-3 px-3 text-center">GA</th>
                      <th className="py-3 px-3 text-center">GD</th>
                      <th className="py-3 px-4 text-center font-black text-emerald-400">PTS</th>
                      <th className="py-3 px-4 text-center">Form (Last 5)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedTeams.map((team, idx) => {
                const gd = team.stats.gf - team.stats.ga;
                const form = team.stats.form || ['W', 'D', 'W', 'W', 'L'];
                return (<tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.homeColor }}></span>
                            <span>{team.name}</span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono">{team.stats.played}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-emerald-400">{team.stats.won}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-amber-300">{team.stats.drawn}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-rose-400">{team.stats.lost}</td>
                          <td className="py-3.5 px-3 text-center font-mono">{team.stats.gf}</td>
                          <td className="py-3.5 px-3 text-center font-mono">{team.stats.ga}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-white">
                            {gd > 0 ? `+${gd}` : gd}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-black text-sm text-emerald-400">
                            {team.stats.points}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1">
                              {form.slice(0, 5).map((f, i) => (<span key={i} className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${f === 'W'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : f === 'D'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
                                  {f}
                                </span>))}
                            </div>
                          </td>
                        </tr>);
            })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Golden Boot Top Scorers Leaderboard */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black uppercase text-white font-display">
                    Golden Boot Leaderboard
                  </h3>
                  <p className="text-xs text-slate-400">
                    Top goal scorers across all registered 90-minute fixtures
                  </p>
                </div>

                {/* All Time / This Month Toggle (Section 3 requirement) */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl text-xs font-bold border border-white/10 self-start sm:self-auto">
                  <button type="button" onClick={() => setScorerPeriod('all_time')} className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${scorerPeriod === 'all_time' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                    All Time
                  </button>
                  <button type="button" onClick={() => setScorerPeriod('this_month')} className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${scorerPeriod === 'this_month' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                    This Month
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topScorers.slice(0, 9).map((scorer, idx) => {
                const goalsCount = scorerPeriod === 'this_month' ? scorer.monthGoals : scorer.goals;
                return (<div key={scorer.id} className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between hover:border-emerald-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${idx === 0
                        ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
                        : idx === 1
                            ? 'bg-slate-300 text-slate-950 font-black'
                            : idx === 2
                                ? 'bg-amber-700 text-white font-black'
                                : 'bg-white/5 text-slate-300'}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{scorer.name}</div>
                          <div className="text-xs text-slate-400">{scorer.teamName} · #{scorer.number}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-emerald-400">{goalsCount}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-medium">Goals</div>
                      </div>
                    </div>);
            })}
              </div>
            </div>

          </div>)}

        {/* TAB 3: FIND AN OPPONENT */}
        {activeMainTab === 'find_opponent' && (<div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30">
              <div>
                <h3 className="text-lg font-bold text-white uppercase font-display">
                  Looking for a Football Match at Crossbar Arena?
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Connect with squads looking for competitive friendly matches, 50/50 turf slot cost share, or guest players.
                </p>
              </div>
              <Link href="/player" className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-500/20 shrink-0">
                Post Your Challenge
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map(c => (<div key={c.id} className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        {c.lookingFor}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{c.level}</span>
                    </div>

                    <h4 className="text-base font-black text-white">{c.teamName}</h4>
                    <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                      <div>📅 Date: <strong className="text-white">{c.date}</strong></div>
                      <div>⏰ Slot: <strong className="text-emerald-400">{c.timeSlot}</strong></div>
                      <div>💰 Cost: <strong className="text-white">{c.costShare}</strong></div>
                    </div>

                    <p className="text-xs text-slate-300 italic mt-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                      &quot;{c.notes}&quot;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <div className="text-[10px] text-slate-400">Captain:</div>
                      <div className="font-bold text-white">{c.captainName}</div>
                    </div>

                    <a href={`https://wa.me/88${c.captainPhone.replace(/[^0-9]/g, '')}?text=Hi%20Captain%20${encodeURIComponent(c.captainName)}%2C%20we%20want%20to%20play%20against%20${encodeURIComponent(c.teamName)}%20at%20Crossbar%20Metro%20Arena!`} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5"/>
                      <span>WhatsApp Squad</span>
                    </a>
                  </div>
                </div>))}
            </div>
          </div>)}

      </div>
    </>);
}
