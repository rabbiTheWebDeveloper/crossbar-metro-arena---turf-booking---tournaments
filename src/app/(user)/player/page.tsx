'use client';

import React, { useState } from 'react';
import { useArena } from '../../../context/ArenaContext';
import { PlayerTeam, TeamMember, MatchDayResult, GoalScorerRecord } from '../../../types';
import { VENUE_INFO } from '../../../data/initialData';
import { PageHero } from '../../../components/PageHero';
import {
  User,
  Users,
  Trophy,
  Ticket,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Clock,
  QrCode,
  Shield,
  Phone,
  MessageSquare,
  Award,
  Plus,
  Send,
  Target,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function PlayerDashboard() {
  const {
    bookings,
    teams,
    matchResults,
    challenges,
    handleSaveTeam,
    handleAddPlayerToTeam,
    handleSaveMatchResult,
    setActiveTicketPass
  } = useArena();

  const [activeTab, setActiveTab] = useState<'passes' | 'my_team' | 'post_score' | 'find_opponent'>('passes');

  // Create Team state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShort, setNewTeamShort] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [homeColor, setHomeColor] = useState('#10b981');

  // Add Player state
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState<number>(7);
  const [playerPosition, setPlayerPosition] = useState<TeamMember['position']>('MID');
  const [playerRole, setPlayerRole] = useState<TeamMember['role']>('Player');

  // Post Match Score state
  const [postMatchDate, setPostMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [postSlotDisplay, setPostSlotDisplay] = useState('07:30 PM - 09:00 PM');
  const [postCourtName, setPostCourtName] = useState('Pitch Alpha (Main Arena)');
  const [postHomeTeam, setPostHomeTeam] = useState(teams[0]?.name || 'Uttara Metro FC');
  const [postAwayTeam, setPostAwayTeam] = useState(teams[1]?.name || 'Sector 17 Strikers');
  const [postHomeScore, setPostHomeScore] = useState<number>(3);
  const [postAwayScore, setPostAwayScore] = useState<number>(2);
  const [postScorerName, setPostScorerName] = useState('');
  const [postScorerTeam, setPostScorerTeam] = useState(postHomeTeam);
  const [postScorerMinute, setPostScorerMinute] = useState<number>(25);
  const [scorersList, setScorersList] = useState<GoalScorerRecord[]>([]);
  const [scoreSuccessMsg, setScoreSuccessMsg] = useState(false);

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !captainName.trim()) return;

    const newTeam: PlayerTeam = {
      id: `team-${Date.now()}`,
      name: newTeamName.trim(),
      shortCode: (newTeamShort || newTeamName.slice(0, 4)).toUpperCase(),
      captainName: captainName.trim(),
      captainPhone: captainPhone.trim(),
      homeColor,
      stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
      players: [
        {
          id: `p-${Date.now()}`,
          name: captainName.trim(),
          number: 10,
          position: 'FWD',
          role: 'Captain',
          goals: 0,
          matchesPlayed: 0
        }
      ]
    };

    handleSaveTeam(newTeam);
    setSelectedTeamId(newTeam.id);
    setShowCreateTeam(false);
    setNewTeamName('');
    setNewTeamShort('');
    setCaptainName('');
    setCaptainPhone('');
  };

  const handleAddPlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !selectedTeamId) return;

    const newMember: TeamMember = {
      id: `pmem-${Date.now()}`,
      name: playerName.trim(),
      number: playerNumber,
      position: playerPosition,
      role: playerRole,
      goals: 0,
      matchesPlayed: 0
    };

    handleAddPlayerToTeam(selectedTeamId, newMember);
    setPlayerName('');
    setPlayerNumber(playerNumber + 1);
  };

  const handleAddScorerToList = () => {
    if (!postScorerName.trim()) return;
    setScorersList([
      ...scorersList,
      {
        playerName: postScorerName.trim(),
        teamName: postScorerTeam,
        minute: postScorerMinute
      }
    ]);
    setPostScorerName('');
  };

  const handlePostScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newResult: MatchDayResult = {
      id: `match-${Date.now()}`,
      date: postMatchDate,
      slotDisplay: postSlotDisplay,
      courtName: postCourtName,
      homeTeam: postHomeTeam,
      awayTeam: postAwayTeam,
      homeScore: postHomeScore,
      awayScore: postAwayScore,
      scorers: scorersList,
      matchType: '7v7 League Scrimmage',
      postedBy: `Captain ${postHomeTeam}`,
      postedAt: new Date().toISOString()
    };

    handleSaveMatchResult(newResult);
    setScoreSuccessMsg(true);
    setScorersList([]);
    setTimeout(() => setScoreSuccessMsg(false), 4000);
  };

  return (
    <>
      <PageHero
        crumb="Player Portal"
        eyebrow="Crossbar Metro Arena Player Hub"
        eyebrowIcon={User}
        title="Player & Captain"
        highlight="Dashboard"
        description="Access digital match passes, create and manage your squad roster, post verified match scores & goal scorers, and find opponents."
        stats={[
          { label: 'My Bookings', value: `${bookings.length} Passes`, icon: Ticket },
          { label: 'My Teams', value: `${teams.length} Squads`, icon: Users },
          { label: 'Match Scores', value: `${matchResults.length} Logged`, icon: Trophy },
          { label: 'Opponent Board', value: `${challenges.length} Active`, icon: Target }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-white/10">
          {[
            { id: 'passes', label: 'My Bookings & Passes', icon: Ticket },
            { id: 'my_team', label: 'Team & Squad Roster', icon: Users },
            { id: 'post_score', label: 'Post Match Scores', icon: Trophy },
            { id: 'find_opponent', label: 'Find an Opponent', icon: Target }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: My Bookings & Gate Passes */}
        {activeTab === 'passes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white font-display">My Bookings & Digital Match Passes</h3>
                <p className="text-xs text-slate-400">Present this digital QR pass at the arena reception for entry.</p>
              </div>
              <Link
                href="/booking"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book New Slot</span>
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10">
                <Ticket className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white">No Active Bookings</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Book a 90-minute slot online to generate your digital gate pass.</p>
                <Link
                  href="/booking"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase inline-flex items-center gap-1.5"
                >
                  View Free Slots
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map(b => (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {b.bookingCode}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          b.paymentStatus === 'paid_full'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {b.paymentStatus === 'paid_full' ? 'Paid in Full' : '৳500 Adv Paid'}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-white font-display">{b.courtName}</h4>
                      
                      <div className="space-y-1.5 my-3 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{b.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-mono font-semibold">{b.displayTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Squad: <strong className="text-white">{b.teamName}</strong></span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Price:</span>
                          <span className="font-mono font-bold text-white">৳{b.totalPrice.toLocaleString()}</span>
                        </div>
                        {b.dueAmount > 0 && (
                          <div className="flex justify-between text-amber-400 font-semibold">
                            <span>Balance Due at Turf:</span>
                            <span className="font-mono">৳{b.dueAmount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTicketPass(b)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>View QR Gate Pass</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Team & Squad Roster */}
        {activeTab === 'my_team' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white font-display">Manage Team & Squad Roster</h3>
                <p className="text-xs text-slate-400">Build your starting 7 or 5 and track player match statistics.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTeam(!showCreateTeam)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showCreateTeam ? 'Cancel' : 'Create New Team'}</span>
              </button>
            </div>

            {/* Create Team Form Modal / Panel */}
            {showCreateTeam && (
              <form onSubmit={handleCreateTeamSubmit} className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-4">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Register New Football Squad</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Team Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Uttara Metro FC"
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Short Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UMFC"
                      value={newTeamShort}
                      onChange={e => setNewTeamShort(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs uppercase focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Captain Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Captain name"
                      value={captainName}
                      onChange={e => setCaptainName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Captain Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="01796-337133"
                      value={captainPhone}
                      onChange={e => setCaptainPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase"
                >
                  Save Team
                </button>
              </form>
            )}

            {/* Team Selector & Player Addition */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left: Squad details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-semibold">Select Team:</span>
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {teams.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTeamId(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          selectedTeamId === t.id
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-white/5 text-slate-300 border border-white/10'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTeam && (
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-white font-display">{selectedTeam.name}</h4>
                        <span className="text-xs text-slate-400">Captain: {selectedTeam.captainName} · {selectedTeam.captainPhone}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {selectedTeam.stats.played} Played · {selectedTeam.stats.points} Pts
                        </span>
                      </div>
                    </div>

                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Current Squad Roster ({selectedTeam.players.length} Players)
                    </h5>

                    <div className="divide-y divide-white/5">
                      {selectedTeam.players.map(p => (
                        <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-[11px]">
                              {p.number}
                            </span>
                            <div>
                              <span className="font-bold text-white">{p.name}</span>
                              <span className="text-slate-400 text-[10px] ml-2 font-mono">({p.position})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded bg-white/5">
                              {p.role}
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {p.goals} goals
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Add Player form */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 h-fit">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Add Player to Squad</span>
                </h4>

                <form onSubmit={handleAddPlayerSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Player Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Farhan Zahed"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Jersey # *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="99"
                        value={playerNumber}
                        onChange={e => setPlayerNumber(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Position</label>
                      <select
                        value={playerPosition}
                        onChange={e => setPlayerPosition(e.target.value as TeamMember['position'])}
                        className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="GK">Goalkeeper (GK)</option>
                        <option value="DEF">Defender (DEF)</option>
                        <option value="MID">Midfielder (MID)</option>
                        <option value="FWD">Forward (FWD)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Squad Role</label>
                    <select
                      value={playerRole}
                      onChange={e => setPlayerRole(e.target.value as TeamMember['role'])}
                      className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Player">Regular Squad Player</option>
                      <option value="Captain">Captain</option>
                      <option value="Vice Captain">Vice Captain</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase transition-colors"
                  >
                    Add Player
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Post Match Scores & Goal Scorers */}
        {activeTab === 'post_score' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white font-display">Post Match Score & Goal Scorers</h3>
              <p className="text-xs text-slate-400">Captains can post matchday scorelines and goal scorers directly to the arena board.</p>
            </div>

            {scoreSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Match score successfully logged and updated in the official standings!</span>
              </div>
            )}

            <form onSubmit={handlePostScoreSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={postMatchDate}
                    onChange={e => setPostMatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={postSlotDisplay}
                    onChange={e => setPostSlotDisplay(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pitch</label>
                  <select
                    value={postCourtName}
                    onChange={e => setPostCourtName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs"
                  >
                    <option value="Pitch Alpha (Main Arena)">Pitch Alpha (7v7)</option>
                    <option value="Pitch Bravo (Speed Cage)">Pitch Bravo (5v5)</option>
                  </select>
                </div>
              </div>

              {/* Scoreline */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 grid grid-cols-5 items-center gap-2 text-center">
                <div className="col-span-2 text-left">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Home Team</label>
                  <input
                    type="text"
                    required
                    value={postHomeTeam}
                    onChange={e => setPostHomeTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold"
                  />
                  <div className="mt-2">
                    <input
                      type="number"
                      min="0"
                      value={postHomeScore}
                      onChange={e => setPostHomeScore(parseInt(e.target.value, 10) || 0)}
                      className="w-16 mx-auto px-2 py-1 rounded bg-black/40 border border-emerald-500/40 text-emerald-400 font-mono text-center font-black text-xl"
                    />
                  </div>
                </div>

                <div className="font-bold text-slate-500 text-xl">VS</div>

                <div className="col-span-2 text-right">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Away Team</label>
                  <input
                    type="text"
                    required
                    value={postAwayTeam}
                    onChange={e => setPostAwayTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold text-right"
                  />
                  <div className="mt-2">
                    <input
                      type="number"
                      min="0"
                      value={postAwayScore}
                      onChange={e => setPostAwayScore(parseInt(e.target.value, 10) || 0)}
                      className="w-16 mx-auto px-2 py-1 rounded bg-black/40 border border-emerald-500/40 text-emerald-400 font-mono text-center font-black text-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Goal Scorers Builder */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Goal Scorers</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Player Name (e.g. Siam Chowdhury)"
                      value={postScorerName}
                      onChange={e => setPostScorerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      placeholder="Minute (e.g. 24)"
                      value={postScorerMinute}
                      onChange={e => setPostScorerMinute(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddScorerToList}
                    className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                  >
                    + Add Scorer
                  </button>
                </div>

                {scorersList.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                    {scorersList.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                        {s.playerName} ({s.minute}') · {s.teamName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>Submit Official Score</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Find an Opponent */}
        {activeTab === 'find_opponent' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white font-display">Find an Opponent & Squad Challenges</h3>
                <p className="text-xs text-slate-400">Looking for a friendly match or need 1-2 players to complete your 7s squad?</p>
              </div>
              <a
                href={VENUE_INFO.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5 transition-colors shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Post Challenge on WhatsApp</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map(c => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {c.lookingFor}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {c.level}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white font-display">{c.teamName}</h4>
                    
                    <div className="space-y-1.5 my-3 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{c.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono">{c.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{c.courtName}</span>
                      </div>
                      <div className="text-[11px] text-emerald-400/90 font-mono mt-1">
                        Cost: {c.costShare}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 italic mb-4">
                      "{c.notes}"
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/880${c.captainPhone.replace(/[^0-9]/g, '').slice(-10)}?text=Hi%20${encodeURIComponent(c.captainName)}%2C%20I%20saw%20your%20match%20challenge%20on%20Crossbar%20Metro%20Arena%20for%20${encodeURIComponent(c.teamName)}!`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Accept Challenge on WhatsApp</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
