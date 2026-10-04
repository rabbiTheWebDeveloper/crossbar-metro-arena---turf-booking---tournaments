'use client';

import React, { useState } from 'react';
import { Booking, CommunityMatchChallenge } from '../types';
import { Calendar, Clock, Users, Phone, Shield, Plus, MessageSquare, Flame, CheckCircle, Search, Filter } from 'lucide-react';
import { VENUE_INFO } from '../data/initialData';

interface MatchTrackerSectionProps {
  bookings: Booking[];
  challenges: CommunityMatchChallenge[];
  onAddChallenge: (challenge: CommunityMatchChallenge) => void;
  onBookSlotClick: () => void;
  hideHeading?: boolean;
}

export const MatchTrackerSection: React.FC<MatchTrackerSectionProps> = ({
  bookings,
  challenges,
  onAddChallenge,
  onBookSlotClick,
  hideHeading = false
}) => {
  const [activeTab, setActiveTab] = useState<'fixtures' | 'challenges'>('fixtures');
  const [showPostChallengeModal, setShowPostChallengeModal] = useState(false);

  // Form states for posting challenge
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [courtName, setCourtName] = useState('Pitch Alpha (7v7)');
  const [matchDate, setMatchDate] = useState('Tomorrow');
  const [timeSlot, setTimeSlot] = useState('08:00 PM - 09:00 PM');
  const [level, setLevel] = useState<CommunityMatchChallenge['level']>('Semi-Pro');
  const [lookingFor, setLookingFor] = useState<CommunityMatchChallenge['lookingFor']>('Opponent Team');
  const [costShare, setCostShare] = useState('50/50 Split (৳1,500 each)');
  const [notes, setNotes] = useState('');

  const handlePostChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !captainName || !captainPhone) return;

    const newChallenge: CommunityMatchChallenge = {
      id: `challenge-${Date.now()}`,
      teamName,
      captainName,
      captainPhone,
      courtName,
      date: matchDate,
      timeSlot,
      format: courtName.includes('7v7') ? '7 vs 7' : '5 vs 5',
      level,
      lookingFor,
      costShare,
      notes: notes || 'Looking for an exciting match at Crossbar Metro Arena!'
    };

    onAddChallenge(newChallenge);
    setShowPostChallengeModal(false);
    setActiveTab('challenges');
  };

  return (
    <section id="schedule" className="py-14 md:py-24 bg-[#090e13] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        {!hideHeading && (
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span>Matchday Center</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-tight">
              Upcoming Matches &amp; Squad Challenges
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Track live arena schedule, discover booked kickoffs, or challenge local Dhaka squads for an intense friendly.
            </p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              onClick={() => setActiveTab('fixtures')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'fixtures'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Confirmed Fixtures ({bookings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'challenges'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Squad Challenges ({challenges.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === 'challenges' ? (
              <button
                onClick={() => setShowPostChallengeModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post Match Challenge</span>
              </button>
            ) : (
              <button
                onClick={onBookSlotClick}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Reserve Next Open Slot</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Confirmed Fixtures */}
        {activeTab === 'fixtures' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl">
                <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <div className="text-white font-bold text-sm">No booked fixtures yet for this window</div>
                <p className="text-slate-400 text-xs mt-1">Be the first squad to book a slot at Crossbar Metro Arena!</p>
                <button
                  onClick={onBookSlotClick}
                  className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs"
                >
                  Book Playing Slot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 sm:p-5 rounded-xl bg-gradient-to-b from-slate-900/80 to-[#0c1218] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                          {b.courtName}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{b.date}</span>
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <h4 className="text-base sm:text-lg font-bold text-white font-display">
                          {b.teamName}
                        </h4>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {b.displayTime}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
                        <span>Captain: <strong className="text-slate-200">{b.captainName}</strong></span>
                        <span>·</span>
                        <span className="capitalize">{b.matchType} Match</span>
                        <span>·</span>
                        <span>{b.playerCount} Players</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">
                        Ref: {b.bookingCode}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirmed Slot</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Community Challenges */}
        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0c141d] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {c.lookingFor}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">{c.level} Level</span>
                  </div>

                  <h4 className="text-lg font-bold text-white font-display uppercase mb-1">
                    {c.teamName}
                  </h4>
                  <div className="text-xs text-emerald-400 font-semibold mb-3 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{c.courtName}</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-white/[0.03] p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-white font-mono font-medium">{c.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <span className="text-slate-400">Turf Fee Split:</span>
                      <strong className="text-emerald-300">{c.costShare}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 italic mb-4">
                    "{c.notes}"
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                  <a
                    href={`https://wa.me/88${c.captainPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(c.captainName)}%2C%20we%20saw%20your%20challenge%20for%20${encodeURIComponent(c.timeSlot)}%20at%20Crossbar%20Metro%20Arena%20and%20want%20to%20play!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Accept on WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${c.captainPhone}`}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                    title={`Call ${c.captainName}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Challenge Modal */}
      {showPostChallengeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0c131a] border border-white/15 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-display uppercase">
                  Post Squad Match Challenge
                </h3>
                <p className="text-xs text-slate-400">Find an opponent squad or players for your slot</p>
              </div>
              <button
                onClick={() => setShowPostChallengeModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostChallenge} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Squad Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uttara Strikers"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Captain Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir"
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01796-337133"
                    value={captainPhone}
                    onChange={(e) => setCaptainPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pitch</label>
                  <select
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs"
                  >
                    <option value="Pitch Alpha (7v7)">Pitch Alpha (7v7)</option>
                    <option value="Pitch Bravo (5v5)">Pitch Bravo (5v5)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Looking For</label>
                  <select
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value as CommunityMatchChallenge['lookingFor'])}
                    className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs"
                  >
                    <option value="Opponent Team">Opponent Team</option>
                    <option value="1-2 Players">1-2 Players Needed</option>
                    <option value="Goalkeeper Needed">Goalkeeper Needed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Date</label>
                  <input
                    type="text"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    placeholder="e.g. This Friday"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    placeholder="08:00 PM - 09:00 PM"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cost Split</label>
                <input
                  type="text"
                  value={costShare}
                  onChange={(e) => setCostShare(e.target.value)}
                  placeholder="50/50 Split (৳1,500 each)"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Playing Style</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Friendly passing game, looking for competitive 7s squad!"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostChallengeModal(false)}
                  className="w-1/3 py-2.5 rounded-lg border border-white/15 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Post Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
