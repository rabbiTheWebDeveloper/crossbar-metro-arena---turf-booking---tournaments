'use client';
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, Shield, Plus, Flame, CheckCircle, Swords, AlertCircle, X, Phone } from 'lucide-react';
import { useArena, todayDhaka } from '../context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '../data/initialData';

const CONFIRMED_STATES = ['confirmed_unpaid', 'paid_advance', 'paid_full'];

/** Upcoming confirmed fixtures (today onwards, ascending). Only team name and time are shown publicly. */
export const upcomingFixtures = (bookings, today = todayDhaka()) => (bookings || [])
    .filter(b => CONFIRMED_STATES.includes(b.paymentStatus) && b.date >= today)
    .sort((a, b) => (a.date === b.date ? (Number(a.slotNumber) || 0) - (Number(b.slotNumber) || 0) : a.date.localeCompare(b.date)));

const LEVELS = ['Casual', 'Semi-Pro', 'Competitive', 'Pro'];
const FORMATS = ['7 vs 7 Friendly Match', '5 vs 5 Friendly Match', '6 vs 6 Friendly Match'];
const LOOKING_FOR = ['Opponent Team', '1-2 Players Needed', 'Goalkeeper Needed'];
const COST_SHARES = ['50/50 Split', 'We pay the slot', 'Opponent pays the slot'];

export const MatchTrackerSection = ({ bookings, challenges, onBookSlotClick, hideHeading = false }) => {
    const arena = useArena();
    const { isVisitor, setShowAuthModal, setAuthModalInitialTab, handleAddChallenge, handleUpdateChallenge, myChallenges, showNotice, currentUser, pricing } = arena;
    const bookingList = bookings || arena.bookings;
    const challengeList = challenges || arena.challenges;
    const today = todayDhaka();

    const [activeTab, setActiveTab] = useState('fixtures');
    const [showPostChallengeModal, setShowPostChallengeModal] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [matchDate, setMatchDate] = useState(today);
    const [timeSlot, setTimeSlot] = useState(SCHEDULE_SLOTS_DEFINITION[9]?.displayTime || SCHEDULE_SLOTS_DEFINITION[0].displayTime);
    const [format, setFormat] = useState(FORMATS[0]);
    const [level, setLevel] = useState('Casual');
    const [lookingFor, setLookingFor] = useState(LOOKING_FOR[0]);
    const [costShare, setCostShare] = useState(COST_SHARES[0]);
    const [notes, setNotes] = useState('');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [acceptingId, setAcceptingId] = useState(null);
    const [acceptResult, setAcceptResult] = useState(null); // { id, message }

    const fixtures = useMemo(() => upcomingFixtures(bookingList, today), [bookingList, today]);
    const openChallenges = useMemo(() => (challengeList || []).filter(c => (c.status || 'open') === 'open'), [challengeList]);
    const slotOptions = (pricing?.slotPrices?.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION).map(s => s.displayTime);
    const myIds = useMemo(() => new Set((myChallenges || []).map(c => c.id)), [myChallenges]);

    const requireLogin = () => {
        if (!isVisitor) return true;
        setAuthModalInitialTab('login');
        setShowAuthModal(true);
        showNotice('info', 'Please log in to post or accept a squad challenge.');
        return false;
    };

    const openPostModal = () => {
        if (!requireLogin()) return;
        setFormError('');
        setShowPostChallengeModal(true);
    };

    const handlePostChallenge = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!requireLogin()) return;
        if (!teamName.trim()) { setFormError('Please enter your squad name.'); return; }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(matchDate) || matchDate < today) { setFormError('Pick a match date from today onwards.'); return; }
        if (!timeSlot) { setFormError('Pick a time slot.'); return; }
        setFormError('');
        setIsSubmitting(true);
        const res = await handleAddChallenge({ teamName: teamName.trim(), date: matchDate, timeSlot, format, level, lookingFor, costShare, notes: notes.trim() });
        setIsSubmitting(false);
        if (res.ok) {
            setShowPostChallengeModal(false);
            setTeamName(''); setNotes('');
            setActiveTab('challenges');
            showNotice('success', 'Your challenge is live. Other captains can now accept it.');
        }
        else {
            setFormError(res.error || 'Could not post the challenge. Please try again.');
        }
    };

    const handleAccept = async (c) => {
        if (!requireLogin()) return;
        setAcceptingId(c.id);
        const res = await handleUpdateChallenge(c.id, { action: 'accept' });
        setAcceptingId(null);
        if (res.ok) setAcceptResult({ id: c.id, message: res.message, teamName: c.teamName });
    };

    const handleCloseOwn = async (c) => {
        setAcceptingId(c.id);
        await handleUpdateChallenge(c.id, { status: 'closed' });
        setAcceptingId(null);
    };

    return (<section id="schedule" className="py-14 md:py-24 bg-[#090e13] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (<div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Flame className="w-3.5 h-3.5 text-emerald-400"/>
              <span>Matchday Center</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-tight">
              Upcoming Matches &amp; Squad Challenges
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              See which slots are booked, or challenge other Dhaka squads to a friendly on the Crossbar turf.
            </p>
          </div>)}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl" role="tablist">
            <button type="button" role="tab" aria-selected={activeTab === 'fixtures'} onClick={() => setActiveTab('fixtures')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'fixtures' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}>
              <Calendar className="w-4 h-4"/>
              <span>Confirmed Fixtures ({fixtures.length})</span>
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'challenges'} onClick={() => setActiveTab('challenges')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'challenges' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}>
              <Users className="w-4 h-4"/>
              <span>Squad Challenges ({openChallenges.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === 'challenges' ? (<button type="button" onClick={openPostModal} className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer">
                <Plus className="w-4 h-4"/>
                <span>Post Match Challenge</span>
              </button>) : (<button type="button" onClick={onBookSlotClick} className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer">
                <Clock className="w-4 h-4 text-emerald-400"/>
                <span>Book a Slot</span>
              </button>)}
          </div>
        </div>

        {activeTab === 'fixtures' && (<div className="space-y-3">
            {fixtures.length === 0 ? (<div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl">
                <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2"/>
                <div className="text-white font-bold text-sm">No confirmed fixtures in the booking window yet</div>
                <p className="text-slate-400 text-xs mt-1">Be the first squad to book a slot at Crossbar Metro Arena.</p>
                <button type="button" onClick={onBookSlotClick} className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs cursor-pointer">Book Playing Slot</button>
              </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {fixtures.slice(0, 12).map((b) => (<div key={b.id} className="p-4 sm:p-5 rounded-xl bg-gradient-to-b from-slate-900/80 to-[#0c1218] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">Slot #{b.slotNumber}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400"/>
                          <span>{b.date === today ? 'Today' : b.date}</span>
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-base sm:text-lg font-bold text-white font-display truncate">{b.teamName || 'Reserved'}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">{b.displayTime}</span>
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-end text-xs">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[12px]">
                        <CheckCircle className="w-3.5 h-3.5"/>
                        <span>Confirmed</span>
                      </span>
                    </div>
                  </div>))}
              </div>)}
            {fixtures.length > 12 && (<p className="text-center text-xs text-slate-400">Showing the next 12 of {fixtures.length} confirmed fixtures. Open the booking calendar for the full schedule.</p>)}
          </div>)}

        {activeTab === 'challenges' && (openChallenges.length === 0 ? (<div className="p-12 text-center bg-white/[0.02] border border-white/10 rounded-2xl max-w-lg mx-auto space-y-2">
              <Users className="w-8 h-8 text-slate-500 mx-auto mb-2"/>
              <div className="text-white font-bold text-sm">No open challenges right now</div>
              <p className="text-slate-400 text-xs">Post your squad&apos;s challenge or ask for guest players and other Dhaka captains can accept it.</p>
              <button type="button" onClick={openPostModal} className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer">Post a Match Challenge</button>
            </div>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {openChallenges.map((c) => {
                const own = myIds.has(c.id);
                const accepted = acceptResult && acceptResult.id === c.id;
                return (<div key={c.id} className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0c141d] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">{c.lookingFor}</span>
                      <span className="text-[12px] font-medium text-slate-400">{c.level} level</span>
                    </div>
                    <h4 className="text-lg font-bold text-white font-display uppercase mb-1">{c.teamName}</h4>
                    <div className="text-xs text-emerald-400 font-semibold mb-3 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5"/>
                      <span>{c.format}</span>
                      {own && <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Your challenge</span>}
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-white/[0.03] p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400"/><span>{c.date}</span></div>
                      <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400"/><span className="text-white font-mono font-medium">{c.timeSlot}</span></div>
                      <div className="flex items-center gap-2 pt-1 border-t border-white/5"><span className="text-slate-400">Turf fee:</span><strong className="text-emerald-300">{c.costShare}</strong></div>
                      <div className="flex items-center gap-2"><span className="text-slate-400">Captain:</span><span className="text-white">{c.captainName}</span>{c.captainPhone && <span className="font-mono text-slate-400 ml-auto">{c.captainPhone}</span>}</div>
                    </div>
                    {c.notes && (<p className="text-xs text-slate-400 italic mb-4">&quot;{c.notes}&quot;</p>)}
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    {accepted ? (<div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2">
                        <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
                        <span>{acceptResult.message || 'Challenge accepted. The captain will be in touch.'}</span>
                      </div>) : own ? (<button type="button" disabled={acceptingId === c.id} onClick={() => handleCloseOwn(c)} className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50">
                        <X className="w-3.5 h-3.5"/>
                        <span>{acceptingId === c.id ? 'Closing...' : 'Close my challenge'}</span>
                      </button>) : (<button type="button" disabled={acceptingId === c.id} onClick={() => handleAccept(c)} className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50">
                        <Swords className="w-3.5 h-3.5"/>
                        <span>{acceptingId === c.id ? 'Accepting...' : 'Accept challenge'}</span>
                      </button>)}
                    {!own && !accepted && <p className="text-[11px] text-slate-500 mt-1.5 text-center">Accepting shares your name and number with the poster and reveals theirs to you.</p>}
                  </div>
                </div>);
              })}
            </div>))}
      </div>

      {showPostChallengeModal && (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="post-challenge-title">
          <div className="bg-[#0c131a] border border-white/15 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 id="post-challenge-title" className="text-lg font-bold text-white font-display uppercase">Post Squad Match Challenge</h3>
                <p className="text-xs text-slate-400">Posting as <strong className="text-white">{currentUser?.name}</strong>. Your number is shared only with the captain who accepts.</p>
              </div>
              <button type="button" onClick={() => setShowPostChallengeModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer" aria-label="Close"><X className="w-4 h-4"/></button>
            </div>

            <form onSubmit={handlePostChallenge} className="space-y-3.5 text-xs">
              {formError && (<div role="alert" className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0"/>
                  <span>{formError}</span>
                </div>)}

              <div>
                <label htmlFor="ch-team" className="block text-slate-300 font-semibold mb-1">Squad Name *</label>
                <input id="ch-team" type="text" required maxLength={60} placeholder="e.g. Uttara Strikers" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ch-date" className="block text-slate-300 font-semibold mb-1">Match Date *</label>
                  <input id="ch-date" type="date" required min={today} value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"/>
                </div>
                <div>
                  <label htmlFor="ch-slot" className="block text-slate-300 font-semibold mb-1">Time Slot *</label>
                  <select id="ch-slot" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs">
                    {slotOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ch-format" className="block text-slate-300 font-semibold mb-1">Format</label>
                  <select id="ch-format" value={format} onChange={(e) => setFormat(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs">
                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="ch-level" className="block text-slate-300 font-semibold mb-1">Level</label>
                  <select id="ch-level" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ch-looking" className="block text-slate-300 font-semibold mb-1">Looking For</label>
                  <select id="ch-looking" value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs">
                    {LOOKING_FOR.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="ch-cost" className="block text-slate-300 font-semibold mb-1">Turf Fee</label>
                  <select id="ch-cost" value={costShare} onChange={(e) => setCostShare(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs">
                    {COST_SHARES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="ch-notes" className="block text-slate-300 font-semibold mb-1">Notes / Playing Style</label>
                <input id="ch-notes" type="text" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Friendly passing game, looking for a competitive 7s squad" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"/>
              </div>

              <div className="pt-3 flex gap-2">
                <button type="button" onClick={() => setShowPostChallengeModal(false)} disabled={isSubmitting} className="w-1/3 py-2.5 rounded-lg border border-white/15 text-slate-300 font-semibold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-2/3 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Posting...' : 'Post Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </section>);
};
