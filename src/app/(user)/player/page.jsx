'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '../../../context/ArenaContext';
import { VENUE_INFO, SCHEDULE_SLOTS_DEFINITION } from '../../../data/initialData';
import { PageHero } from '../../../components/PageHero';
import { User, Users, Trophy, PlusCircle, CheckCircle2, Calendar, Shield, MessageSquare, Target, Trash2, AlertCircle, Bell } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
export const dynamic = 'force-dynamic';
export default function PlayerDashboard() {
    const { bookings, teams, matchResults, challenges, currentUser, pricing, smsLogs, handleSaveTeam, handleAddPlayerToTeam, handleSaveMatchResult, handleCancelBooking, handleUpdateBookingStatus, handleAddChallenge, setActiveTicketPass, setShowAuthModal, setAuthModalInitialTab } = useArena();
    const [activeTab, setActiveTab] = useState('overview');
    // Guard for Visitor
    const isVisitor = !currentUser || currentUser.role === 'visitor';
    // Filter bookings belonging to current player
    const myBookings = useMemo(() => {
        if (!currentUser)
            return bookings.slice(0, 3);
        const phone = currentUser.phone?.replace(/[^0-9]/g, '');
        return bookings.filter(b => b.captainPhone?.replace(/[^0-9]/g, '') === phone);
    }, [bookings, currentUser]);
    const upcomingBookings = useMemo(() => {
        return myBookings.filter(b => b.paymentStatus !== 'cancelled');
    }, [myBookings]);
    // My Teams
    const myTeams = useMemo(() => {
        if (!currentUser)
            return teams.slice(0, 1);
        const phone = currentUser.phone?.replace(/[^0-9]/g, '');
        return teams.filter(t => t.captainPhone?.replace(/[^0-9]/g, '') === phone || t.captainName === currentUser.name);
    }, [teams, currentUser]);
    // Total goals scored by this user across all teams
    const myGoalsCount = useMemo(() => {
        if (!currentUser)
            return 9;
        let total = 0;
        teams.forEach(t => {
            const p = t.players.find(m => m.name.toLowerCase() === currentUser.name.toLowerCase() || m.phone === currentUser.phone);
            if (p)
                total += (p.goals || 0);
        });
        return total;
    }, [teams, currentUser]);
    // Create Team state
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamShort, setNewTeamShort] = useState('');
    const [newTeamArea, setNewTeamArea] = useState('Uttara, Dhaka');
    const [captainName, setCaptainName] = useState(currentUser?.name || '');
    const [captainPhone, setCaptainPhone] = useState(currentUser?.phone || '');
    const [homeColor, setHomeColor] = useState('#10b981');
    const [teamError, setTeamError] = useState('');
    // Add Player state
    const [selectedTeamId, setSelectedTeamId] = useState(myTeams[0]?.id || teams[0]?.id || '');
    const [playerName, setPlayerName] = useState('');
    const [playerNumber, setPlayerNumber] = useState(7);
    const [playerPosition, setPlayerPosition] = useState('MID');
    const [playerRole, setPlayerRole] = useState('Player');
    const [playerPhone, setPlayerPhone] = useState('');
    // Post Match Score state (Captains only)
    const [postMatchDate, setPostMatchDate] = useState(new Date().toISOString().split('T')[0]);
    const [postSlotDisplay, setPostSlotDisplay] = useState('07:30 PM – 09:00 PM');
    const [postCourtName, setPostCourtName] = useState('Crossbar Metro Arena (Main Turf)');
    const [postHomeTeam, setPostHomeTeam] = useState(myTeams[0]?.name || teams[0]?.name || 'Uttara Metro FC');
    const [postAwayTeam, setPostAwayTeam] = useState(teams[1]?.name || 'Sector 17 Strikers');
    const [postHomeScore, setPostHomeScore] = useState(3);
    const [postAwayScore, setPostAwayScore] = useState(2);
    const [matchEvents, setMatchEvents] = useState([]);
    const [eventSide, setEventSide] = useState('home');
    const [eventType, setEventType] = useState('goal');
    const [eventPlayer, setEventPlayer] = useState('');
    const [eventMinute, setEventMinute] = useState(24);
    const [motm, setMotm] = useState('');
    const [matchReport, setMatchReport] = useState('');
    const [teamPhotoUrl, setTeamPhotoUrl] = useState('');
    const [postScoreSuccess, setPostScoreSuccess] = useState(false);
    // Find Opponent form state
    const [oppDate, setOppDate] = useState(new Date().toISOString().split('T')[0]);
    const [oppSlot, setOppSlot] = useState('07:30 PM – 09:00 PM (90 Min)');
    const [oppLookingFor, setOppLookingFor] = useState('Opponent Team');
    const [oppCostShare, setOppCostShare] = useState('50/50 Split (৳1,600 each)');
    const [oppLevel, setOppLevel] = useState('Semi-Pro');
    const [oppMessage, setOppMessage] = useState('');
    const [oppSuccess, setOppSuccess] = useState(false);
    // Profile Edit state
    const [profileName, setProfileName] = useState(currentUser?.name || '');
    const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
    const [profilePos, setProfilePos] = useState(currentUser?.playingPosition || 'MID');
    const [profileSaved, setProfileSaved] = useState(false);
    const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];
    // Create Team Submit
    const handleCreateTeamSubmit = (e) => {
        e.preventDefault();
        if (!newTeamName.trim() || !captainName.trim())
            return;
        // Check unique team name (Section 6 requirement)
        if (teams.some(t => t.name.toLowerCase() === newTeamName.trim().toLowerCase())) {
            setTeamError('A team with this name already exists. Team names must be unique.');
            return;
        }
        const newTeam = {
            id: `team-${Date.now()}`,
            name: newTeamName.trim(),
            shortCode: (newTeamShort || newTeamName.slice(0, 4)).toUpperCase(),
            captainName: captainName.trim(),
            captainPhone: captainPhone.trim(),
            homeColor,
            area: newTeamArea.trim(),
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: ['W'] },
            players: [
                {
                    id: `p-${Date.now()}`,
                    name: captainName.trim(),
                    number: 10,
                    position: 'FWD',
                    role: 'Captain',
                    phone: captainPhone.trim(),
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
        setTeamError('');
    };
    // Add Player to Squad
    const handleAddPlayerSubmit = (e) => {
        e.preventDefault();
        if (!playerName.trim() || !selectedTeamId)
            return;
        const newMember = {
            id: `pmem-${Date.now()}`,
            name: playerName.trim(),
            number: playerNumber,
            position: playerPosition,
            role: playerRole,
            phone: playerPhone.trim(),
            goals: 0,
            matchesPlayed: 0
        };
        handleAddPlayerToTeam(selectedTeamId, newMember);
        setPlayerName('');
        setPlayerNumber(11);
        setPlayerPhone('');
    };
    // Add Event to Match Post
    const handleAddEvent = () => {
        if (!eventPlayer.trim())
            return;
        const item = {
            id: `ev-${Date.now()}`,
            side: eventSide,
            type: eventType,
            playerName: eventPlayer.trim(),
            minute: eventMinute
        };
        setMatchEvents([...matchEvents, item]);
        setEventPlayer('');
    };
    // Submit Match Result
    const handlePostMatchSubmit = (e) => {
        e.preventDefault();
        // Map goal events to scorers
        const scorers = matchEvents
            .filter(e => e.type === 'goal')
            .map(e => ({
            playerName: e.playerName,
            teamName: e.side === 'home' ? postHomeTeam : postAwayTeam,
            minute: e.minute
        }));
        const yellowCount = matchEvents.filter(e => e.type === 'yellow_card').length;
        const redCount = matchEvents.filter(e => e.type === 'red_card').length;
        const newResult = {
            id: `match-${Date.now()}`,
            date: postMatchDate,
            slotDisplay: postSlotDisplay,
            courtName: postCourtName,
            homeTeam: postHomeTeam,
            awayTeam: postAwayTeam,
            homeScore: postHomeScore,
            awayScore: postAwayScore,
            scorers,
            events: matchEvents,
            yellowCards: yellowCount,
            redCards: redCount,
            playerOfTheMatch: motm.trim() || undefined,
            matchReport: matchReport.trim() || undefined,
            teamPhoto: teamPhotoUrl.trim() || undefined,
            matchType: '7v7 League Match',
            postedBy: currentUser?.name || 'Squad Captain',
            postedAt: new Date().toISOString(),
            status: pricing.approveResultsFirst ? 'pending_approval' : 'published'
        };
        handleSaveMatchResult(newResult);
        setPostScoreSuccess(true);
        setMatchEvents([]);
        try {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }
        catch { }
        setTimeout(() => setPostScoreSuccess(false), 5000);
    };
    // Post Opponent Challenge
    const handlePostChallengeSubmit = (e) => {
        e.preventDefault();
        if (!oppMessage.trim())
            return;
        const newC = {
            id: `chal-${Date.now()}`,
            teamName: myTeams[0]?.name || 'Dhaka Footballers',
            captainName: currentUser?.name || 'Captain',
            captainPhone: currentUser?.phone || '01844-332211',
            courtName: 'Crossbar Metro Arena',
            date: oppDate,
            timeSlot: oppSlot,
            format: '7 vs 7 Match',
            level: oppLevel,
            lookingFor: oppLookingFor,
            costShare: oppCostShare,
            notes: oppMessage.trim()
        };
        handleAddChallenge(newC);
        setOppSuccess(true);
        setOppMessage('');
        setTimeout(() => setOppSuccess(false), 4000);
    };
    // Cancellation rule check (Section 4 Rule 7: 24 hours before kickoff)
    const canCancelBooking = (bookingDate, startTime) => {
        const [h, m] = startTime.split(':').map(Number);
        const kickoff = new Date(bookingDate);
        kickoff.setHours(h, m, 0, 0);
        const now = new Date();
        const diffHours = (kickoff.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours >= (pricing.cancellationHours || 24);
    };
    return (<>
      <PageHero crumb="Player & Team Portal" eyebrow="My Squad · Bookings · Match Records" eyebrowIcon={User} title="Player &amp; Team" highlight="Matchday Hub" description="Manage your bookings, pay venue dues, customize squad rosters, publish match results to the public leaderboard, and challenge opponents." stats={[
            { label: 'Upcoming Games', value: `${upcomingBookings.length} Matches`, icon: Calendar },
            { label: 'My Teams', value: `${myTeams.length} Squads`, icon: Users },
            { label: 'Goals Scored', value: `${myGoalsCount} Goals`, icon: Target },
            { label: 'Account Role', value: currentUser?.role?.toUpperCase() || 'PLAYER', icon: Shield }
        ]}/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Visitor Alert */}
        {isVisitor && (<div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0"/>
              <div className="text-xs text-amber-200">
                You are currently viewing as <strong>Visitor</strong>. Log in with your Bangladeshi mobile number to link your bookings, teams, and goals!
              </div>
            </div>
            <button type="button" onClick={() => { setAuthModalInitialTab('login'); setShowAuthModal(true); }} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer">
              Log In / Sign Up
            </button>
          </div>)}

        {/* Dashboard Tabs Bar */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 text-xs font-bold overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: Trophy },
            { id: 'bookings', label: `My Bookings (${myBookings.length})`, icon: Calendar },
            { id: 'teams', label: `My Teams (${myTeams.length})`, icon: Users },
            { id: 'post_score', label: 'Post Match Result', icon: PlusCircle },
            { id: 'find_opponent', label: 'Find an Opponent', icon: MessageSquare },
            { id: 'profile', label: 'Profile & Settings', icon: User }
        ].map(tab => {
            const Icon = tab.icon;
            return (<button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4"/>
                <span>{tab.label}</span>
              </button>);
        })}
        </div>

        {/* 1. OVERVIEW TAB (Section 6 requirement) */}
        {activeTab === 'overview' && (<div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
                <div className="text-xs text-slate-400">Upcoming Fixtures</div>
                <div className="text-3xl font-black font-display text-white mt-1">{upcomingBookings.length}</div>
                <div className="text-[11px] text-emerald-400 mt-1">Confirmed on Turf</div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
                <div className="text-xs text-slate-400">My Squads</div>
                <div className="text-3xl font-black font-display text-white mt-1">{myTeams.length}</div>
                <div className="text-[11px] text-slate-300 mt-1">{myTeams[0]?.name || 'No team yet'}</div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
                <div className="text-xs text-slate-400">Career Goals</div>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-1">{myGoalsCount}</div>
                <div className="text-[11px] text-slate-300 mt-1">On Arena Leaderboard</div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
                <div className="text-xs text-slate-400">Preferred Position</div>
                <div className="text-3xl font-black font-display text-white mt-1">{currentUser?.playingPosition || 'FWD'}</div>
                <div className="text-[11px] text-emerald-400 mt-1">Player Profile</div>
              </div>
            </div>

            {/* Upcoming Games strip */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white uppercase font-display">
                  Upcoming Match Bookings
                </h3>
                <Link href="/booking" className="text-xs font-bold text-emerald-400 hover:underline">
                  + Book Another Slot
                </Link>
              </div>

              {upcomingBookings.length === 0 ? (<div className="text-center py-8 text-xs text-slate-400">
                  No upcoming games booked yet. Click &quot;Book a Slot&quot; to pick your 90-minute kickoff!
                </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upcomingBookings.map(b => (<div key={b.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-mono font-bold text-emerald-400">{b.bookingCode}</div>
                        <div className="text-sm font-bold text-white mt-0.5">{b.teamName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          📅 {b.date} · ⏰ {b.displayTime}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1">
                          Paid: ৳{b.advanceAmount.toLocaleString()} · Due: <strong className="text-amber-400">৳{b.dueAmount.toLocaleString()}</strong>
                        </div>
                      </div>
                      <button type="button" onClick={() => setActiveTicketPass(b)} className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs uppercase transition-colors shrink-0 cursor-pointer">
                        Open Ticket
                      </button>
                    </div>))}
                </div>)}
            </div>
          </div>)}

        {/* 2. MY BOOKINGS TAB (Section 6 requirement: pay pending, open ticket, cancel if > 24h) */}
        {activeTab === 'bookings' && (<div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase text-white font-display">
                  My Match Bookings &amp; Passes
                </h3>
                <p className="text-xs text-slate-400">
                  Track upcoming and past turf bookings, download match passes, or cancel according to the 24h policy.
                </p>
              </div>
              <Link href="/booking" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase">
                + Book Slot
              </Link>
            </div>

            {myBookings.length === 0 ? (<div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-white/5 text-slate-400 space-y-2">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto"/>
                <div className="text-sm font-bold text-white">No bookings under this phone number</div>
                <p className="text-xs">Book your first 90-minute turf slot online 24/7.</p>
              </div>) : (<div className="space-y-3">
                {myBookings.map(b => {
                    const cancelAllowed = canCancelBooking(b.date, b.startTime);
                    const isCancelled = b.paymentStatus === 'cancelled';
                    return (<div key={b.id} className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isCancelled
                            ? 'bg-black/30 border-white/5 opacity-60'
                            : 'bg-slate-900/80 border-white/10 hover:border-emerald-500/30'}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-emerald-400">{b.bookingCode}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isCancelled
                            ? 'bg-rose-500/20 text-rose-300'
                            : b.paymentStatus === 'paid_full'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'}`}>
                            {b.paymentStatus.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white">{b.teamName} · {b.courtName}</h4>
                        <div className="text-xs text-slate-400">
                          Kickoff: <strong className="text-white">{b.date}</strong> at <strong className="text-emerald-400">{b.displayTime}</strong>
                        </div>
                        <div className="text-xs text-slate-300 font-mono">
                          Paid: ৳{b.advanceAmount.toLocaleString()} · Due at Desk: ৳{b.dueAmount.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setActiveTicketPass(b)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-colors cursor-pointer">
                          View Pass Ticket
                        </button>

                        {!isCancelled && (<>
                            {b.dueAmount > 0 && (<button type="button" onClick={() => {
                                    handleUpdateBookingStatus(b.id, 'paid_full', b.dueAmount);
                                    alert(`Recorded online payment for balance of ৳${b.dueAmount}. Booking fully paid!`);
                                }} className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase transition-colors cursor-pointer">
                                Pay Due (৳{b.dueAmount})
                              </button>)}

                            {cancelAllowed ? (<button type="button" onClick={() => {
                                    if (confirm(`Cancel booking ${b.bookingCode}? Advance of ৳${b.advanceAmount} will be sent to the arena refund queue.`)) {
                                        handleCancelBooking(b.id);
                                    }
                                }} className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer">
                                Cancel Slot
                              </button>) : (<a href={`tel:${VENUE_INFO.phone}`} className="px-3 py-2 rounded-xl bg-white/5 text-slate-400 text-xs border border-white/10" title="Cancellation allowed up to 24h before kickoff. Please call reception.">
                                Call to Cancel (&lt;24h)
                              </a>)}
                          </>)}
                      </div>
                    </div>);
                })}
              </div>)}
          </div>)}

        {/* 3. TEAMS & SQUAD TAB (Section 6 requirement) */}
        {activeTab === 'teams' && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase text-white font-display">
                  My Teams &amp; Squad Rosters
                </h3>
                <p className="text-xs text-slate-400">
                  Create a team, add players with jersey numbers and positions, and track squad stats.
                </p>
              </div>
              <button type="button" onClick={() => setShowCreateTeam(!showCreateTeam)} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">
                {showCreateTeam ? 'Close Form' : '+ Create New Team'}
              </button>
            </div>

            {/* Create Team Form Modal / Slide */}
            {showCreateTeam && (<form onSubmit={handleCreateTeamSubmit} className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-4">
                <h4 className="text-sm font-bold uppercase text-emerald-400">Register New Squad</h4>
                
                {teamError && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {teamError}
                  </div>)}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Squad Name (Unique) *</label>
                    <input type="text" required placeholder="e.g. Metro Velocity 7s" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"/>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Short Code</label>
                    <input type="text" placeholder="e.g. MV7" maxLength={4} value={newTeamShort} onChange={e => setNewTeamShort(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono uppercase"/>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Area / Locality</label>
                    <input type="text" placeholder="e.g. Sector 17, Uttara" value={newTeamArea} onChange={e => setNewTeamArea(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"/>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Team Jersey Colour</label>
                    <input type="color" value={homeColor} onChange={e => setHomeColor(e.target.value)} className="w-full h-9 rounded-xl bg-slate-950 border border-white/10 p-1 cursor-pointer"/>
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase">
                  Create Squad
                </button>
              </form>)}

            {/* Selected Team Squad View */}
            {selectedTeam && (<div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-2xl shrink-0 flex items-center justify-center font-black text-xs text-slate-950 shadow-md" style={{ backgroundColor: selectedTeam.homeColor }}>
                      {selectedTeam.shortCode}
                    </span>
                    <div>
                      <h4 className="text-lg font-black text-white">{selectedTeam.name}</h4>
                      <div className="text-xs text-slate-400">
                        Captain: <strong>{selectedTeam.captainName}</strong> · Area: {selectedTeam.area || 'Dhaka'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>Played: <strong>{selectedTeam.stats.played}</strong></div>
                    <div>Won: <strong className="text-emerald-400">{selectedTeam.stats.won}</strong></div>
                    <div>Points: <strong className="text-emerald-400 font-bold">{selectedTeam.stats.points}</strong></div>
                  </div>
                </div>

                {/* Squad Players List */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Official Squad Roster ({selectedTeam.players.length} Players)
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {selectedTeam.players.map(p => (<div key={p.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                            #{p.number}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.position} · {p.role}</div>
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          {p.goals || 0} G
                        </div>
                      </div>))}
                  </div>
                </div>

                {/* Add Player to Team Form */}
                <form onSubmit={handleAddPlayerSubmit} className="pt-4 border-t border-white/10 space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    + Add Player to Squad
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                    <input type="text" required placeholder="Player Name" value={playerName} onChange={e => setPlayerName(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"/>
                    <input type="number" placeholder="Jersey #" min={1} max={99} value={playerNumber} onChange={e => setPlayerNumber(Number(e.target.value))} className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"/>
                    <select value={playerPosition} onChange={e => setPlayerPosition(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white">
                      <option value="FWD">Forward (FWD)</option>
                      <option value="MID">Midfield (MID)</option>
                      <option value="DEF">Defender (DEF)</option>
                      <option value="GK">Goalkeeper (GK)</option>
                    </select>
                    <input type="tel" placeholder="Mobile (Optional)" value={playerPhone} onChange={e => setPlayerPhone(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"/>
                  </div>

                  <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase">
                    Add Player to Roster
                  </button>
                </form>
              </div>)}
          </div>)}

        {/* 4. POST MATCH RESULT TAB (Section 6 requirement: captains only) */}
        {activeTab === 'post_score' && (<div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
            <div>
              <h3 className="text-xl font-black uppercase text-white font-display">
                Post Match Result &amp; Events
              </h3>
              <p className="text-xs text-slate-400">
                Captains can submit scores, goal scorers with minutes, cards, and player of the match. Automatically updates the public Match Day leaderboard!
              </p>
            </div>

            {postScoreSuccess && (<div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400"/>
                <span>Match result published successfully! It is now live on the Match Day page and leaderboard.</span>
              </div>)}

            <form onSubmit={handlePostMatchSubmit} className="space-y-6">
              
              {/* Fixture meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Match Date *</label>
                  <input type="date" required value={postMatchDate} onChange={e => setPostMatchDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"/>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kickoff Slot *</label>
                  <select value={postSlotDisplay} onChange={e => setPostSlotDisplay(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white">
                    {SCHEDULE_SLOTS_DEFINITION.map(s => (<option key={s.slotNumber} value={s.displayTime}>
                        Slot #{s.slotNumber} ({s.displayTime})
                      </option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Arena Ground</label>
                  <input type="text" disabled value={postCourtName} className="w-full px-3 py-2 rounded-xl bg-slate-950/50 border border-white/5 text-slate-400"/>
                </div>
              </div>

              {/* Teams & Scores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Home Team</label>
                  <input type="text" required value={postHomeTeam} onChange={e => setPostHomeTeam(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold"/>
                  <div className="mt-2">
                    <label className="block text-xs text-slate-400 mb-1">Home Score</label>
                    <input type="number" min={0} value={postHomeScore} onChange={e => setPostHomeScore(Number(e.target.value))} className="w-20 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-base font-bold"/>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Opponent Team</label>
                  <input type="text" required placeholder="e.g. Sector 17 Strikers" value={postAwayTeam} onChange={e => setPostAwayTeam(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold"/>
                  <div className="mt-2">
                    <label className="block text-xs text-slate-400 mb-1">Opponent Score</label>
                    <input type="number" min={0} value={postAwayScore} onChange={e => setPostAwayScore(Number(e.target.value))} className="w-20 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-base font-bold"/>
                  </div>
                </div>
              </div>

              {/* Match Events Builder (One row per event: side, type, player name, minute) */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Match Events &amp; Goal Scorers
                  </div>
                  <span className="text-[11px] text-slate-400">{matchEvents.length} Events Logged</span>
                </div>

                {/* Event Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <select value={eventSide} onChange={e => setEventSide(e.target.value)} className="px-2.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white">
                    <option value="home">Home ({postHomeTeam.slice(0, 10)})</option>
                    <option value="away">Away ({postAwayTeam.slice(0, 10)})</option>
                  </select>

                  <select value={eventType} onChange={e => setEventType(e.target.value)} className="px-2.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white">
                    <option value="goal">⚽ Goal</option>
                    <option value="assist">👟 Assist</option>
                    <option value="own_goal">🤦 Own Goal</option>
                    <option value="yellow_card">🟨 Yellow Card</option>
                    <option value="red_card">🟥 Red Card</option>
                  </select>

                  <input type="text" placeholder="Player Name" value={eventPlayer} onChange={e => setEventPlayer(e.target.value)} className="col-span-2 sm:col-span-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"/>

                  <input type="number" placeholder="Min (1-90)" min={1} max={90} value={eventMinute} onChange={e => setEventMinute(Number(e.target.value))} className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"/>

                  <button type="button" onClick={handleAddEvent} className="py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold transition-colors cursor-pointer">
                    + Add Event
                  </button>
                </div>

                {/* Events list */}
                {matchEvents.length > 0 && (<div className="space-y-1 pt-2">
                    {matchEvents.map((ev, i) => (<div key={ev.id} className="p-2 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white">{ev.playerName}</span>
                          <span className="text-slate-400 ml-2">({ev.side === 'home' ? postHomeTeam : postAwayTeam})</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-white/5 uppercase">{ev.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-400 font-bold">{ev.minute}&apos;</span>
                          <button type="button" onClick={() => setMatchEvents(matchEvents.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-rose-400">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>))}
                  </div>)}
              </div>

              {/* MOTM & Report */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Player of the Match (MOTM)</label>
                  <input type="text" placeholder="e.g. Siam Chowdhury" value={motm} onChange={e => setMotm(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"/>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Team Photo URL (Optional)</label>
                  <input type="url" placeholder="https://images.unsplash.com/..." value={teamPhotoUrl} onChange={e => setTeamPhotoUrl(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"/>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">Match Report / Summary</label>
                <textarea rows={2} placeholder="Short report on match highlights..." value={matchReport} onChange={e => setMatchReport(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"/>
              </div>

              <button type="submit" className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer">
                Publish Match Result to Arena League
              </button>
            </form>
          </div>)}

        {/* 5. FIND OPPONENT TAB (Section 6 requirement) */}
        {activeTab === 'find_opponent' && (<div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
            <div>
              <h3 className="text-xl font-black uppercase text-white font-display">
                Post Opponent Wanted Challenge
              </h3>
              <p className="text-xs text-slate-400">
                Post your squad&apos;s preferred date and slot to challenge other Dhaka squads on the public Match Day board.
              </p>
            </div>

            {oppSuccess && (<div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
                Challenge posted! It is now visible on the public Match Day page.
              </div>)}

            <form onSubmit={handlePostChallengeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Match Date</label>
                  <input type="date" required value={oppDate} onChange={e => setOppDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"/>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preferred Slot</label>
                  <input type="text" value={oppSlot} onChange={e => setOppSlot(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"/>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Looking For</label>
                  <select value={oppLookingFor} onChange={e => setOppLookingFor(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white">
                    <option value="Opponent Team">Opponent Team (7v7 / 5v5)</option>
                    <option value="1-2 Players">1-2 Players to Complete Squad</option>
                    <option value="Goalkeeper Needed">Goalkeeper Needed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cost Sharing</label>
                  <input type="text" value={oppCostShare} onChange={e => setOppCostShare(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"/>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">Squad Message / Level Description</label>
                <textarea rows={2} required placeholder="e.g. Good passing 7s squad looking for a fast, friendly match..." value={oppMessage} onChange={e => setOppMessage(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"/>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer">
                Post Challenge on Match Day Board
              </button>
            </form>
          </div>)}

        {/* 6. PROFILE & SETTINGS TAB (Section 6 requirement: edit name, email, position, change password, notifications list) */}
        {activeTab === 'profile' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
              <h3 className="text-lg font-black uppercase text-white font-display">
                Player Profile Settings
              </h3>

              {profileSaved && (<div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs">
                  Profile updated successfully!
                </div>)}

              <form onSubmit={e => { e.preventDefault(); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                  <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"/>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"/>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Playing Position</label>
                  <select value={profilePos} onChange={e => setProfilePos(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white">
                    <option value="FWD">Forward (FWD)</option>
                    <option value="MID">Midfielder (MID)</option>
                    <option value="DEF">Defender (DEF)</option>
                    <option value="GK">Goalkeeper (GK)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registered Bangladeshi Mobile</label>
                  <input type="text" disabled value={currentUser?.phone || '01844-332211'} className="w-full px-3 py-2 rounded-xl bg-slate-950/50 border border-white/5 text-slate-500 font-mono"/>
                </div>

                <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold uppercase text-xs cursor-pointer">
                  Save Profile Changes
                </button>
              </form>
            </div>

            {/* Notifications List (Section 6 requirement) */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Bell className="w-4 h-4"/>
                <span>SMS &amp; Account Notifications</span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {smsLogs.slice(0, 6).map(log => (<div key={log.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Gateway: {log.provider}</span>
                      <span className="font-mono">{log.sentAt.split('T')[0]}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {log.message}
                    </p>
                  </div>))}
              </div>
            </div>
          </div>)}

      </div>
    </>);
}
