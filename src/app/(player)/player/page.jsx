'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useArena, cleanPhone, todayDhaka } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { PageHero } from '@/components/PageHero';
import { User, Users, Trophy, PlusCircle, Calendar, Shield, MessageSquare, Target, Trash2, AlertCircle, Bell, Pencil, Loader2, Phone, Lock } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

const INPUT = 'w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs';
const INPUT_DISABLED = 'w-full px-3 py-2 rounded-xl bg-slate-950/50 border border-white/5 text-slate-500 text-xs';
const LEVELS = ['Casual', 'Semi-Pro', 'Competitive', 'Pro'];
const POSITIONS = [['FWD', 'Forward (FWD)'], ['MID', 'Midfielder (MID)'], ['DEF', 'Defender (DEF)'], ['GK', 'Goalkeeper (GK)']];
const ROLES = ['Player', 'Captain', 'Vice-Captain', 'Goalkeeper', 'Substitute'];
const MATCH_TYPES = ['7v7 Friendly', '7v7 League Match', '5v5 Friendly', 'Tournament Match'];
const EVENT_TYPES = [['goal', 'Goal'], ['assist', 'Assist'], ['own_goal', 'Own Goal'], ['yellow', 'Yellow Card'], ['red', 'Red Card']];

const STATUS_META = {
    pending_payment: { label: 'Payment in progress', cls: 'bg-sky-500/20 text-sky-300', hint: 'Online payment has not completed yet. The slot is held briefly while you pay.' },
    confirmed_unpaid: { label: 'Confirmed · pay at arena', cls: 'bg-amber-500/20 text-amber-300', hint: 'No payment collected yet. Settle the fee at the arena desk before kick-off.' },
    paid_advance: { label: 'Advance paid', cls: 'bg-emerald-500/20 text-emerald-300', hint: 'Advance received. Pay the balance at the arena desk on match day.' },
    paid_full: { label: 'Paid in full', cls: 'bg-emerald-500/20 text-emerald-300', hint: '' },
    needs_refund: { label: 'Refund pending', cls: 'bg-violet-500/20 text-violet-300', hint: 'This slot was released. The arena desk will process your refund.' },
    cancelled: { label: 'Cancelled', cls: 'bg-rose-500/20 text-rose-300', hint: '' }
};
const statusMeta = (s) => STATUS_META[s] || { label: String(s || 'unknown').replaceAll('_', ' '), cls: 'bg-white/10 text-slate-300', hint: '' };
const RESULT_STATUS = {
    published: 'bg-emerald-500/20 text-emerald-300',
    pending_approval: 'bg-amber-500/20 text-amber-300',
    rejected: 'bg-rose-500/20 text-rose-300'
};
const CHALLENGE_STATUS = {
    open: 'bg-emerald-500/20 text-emerald-300',
    matched: 'bg-sky-500/20 text-sky-300',
    closed: 'bg-white/10 text-slate-300'
};
const money = (n) => `৳${(Number(n) || 0).toLocaleString()}`;

const Skeleton = () => (<div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading your data">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => (<div key={i} className="h-24 rounded-3xl bg-slate-900/80 border border-white/10"/>))}
    </div>
    <div className="h-48 rounded-3xl bg-slate-900/80 border border-white/10"/>
    <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-4 h-4 animate-spin"/> Loading your bookings, teams and results…</div>
  </div>);

export default function PlayerDashboard() {
    const {
        myBookings, teams, myMatchResults, myChallenges, currentUser, authChecked, isVisitor, pricing, smsLogs, siteSettings, isLoadingData,
        handleSaveTeam, handleUpdateTeam, handleAddPlayerToTeam, handleRemovePlayerFromTeam,
        handleSaveMatchResult, handleDeleteMatchResult, handleCancelBooking,
        handleAddChallenge, handleUpdateChallenge, handleDeleteChallenge,
        handleUpdateProfile, handleChangePassword,
        setActiveTicketPass, setShowAuthModal, setAuthModalInitialTab
    } = useArena();
    const [activeTab, setActiveTab] = useState('overview');
    const openLogin = () => { setAuthModalInitialTab('login'); setShowAuthModal(true); };
    const slotOptions = Array.isArray(pricing?.slotPrices) && pricing.slotPrices.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
    const today = todayDhaka();

    // ---- Bookings: upcoming vs past (Dhaka time) ----
    const kickoffOf = (b) => {
        const start = b?.startTime || slotOptions.find(s => s.slotNumber === b?.slotNumber)?.startTime || '00:00';
        return new Date(`${b?.date}T${start}:00+06:00`);
    };
    const canCancelBooking = (b) => {
        const diffHours = (kickoffOf(b).getTime() - Date.now()) / (1000 * 60 * 60);
        return diffHours >= (Number(pricing?.cancellationHours) || 24);
    };
    const { upcomingBookings, pastBookings } = useMemo(() => {
        const now = Date.now();
        const upcoming = [], past = [];
        (myBookings || []).forEach(b => {
            const k = kickoffOf(b).getTime();
            if (!Number.isNaN(k) && k >= now && b.paymentStatus !== 'cancelled') upcoming.push(b);
            else past.push(b);
        });
        upcoming.sort((a, b) => kickoffOf(a) - kickoffOf(b));
        past.sort((a, b) => kickoffOf(b) - kickoffOf(a));
        return { upcomingBookings: upcoming, pastBookings: past };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myBookings, pricing]);
    const [cancellingId, setCancellingId] = useState('');
    const onCancelBooking = async (b) => {
        const paid = Number(b.advanceAmount) || 0;
        const msg = paid > 0
            ? `Cancel booking ${b.bookingCode}? ${money(paid)} already paid will go to the arena refund queue.`
            : `Cancel booking ${b.bookingCode}?`;
        if (!confirm(msg)) return;
        setCancellingId(b.id);
        await handleCancelBooking(b.id); // the context shows the server message (window check, refund)
        setCancellingId('');
    };

    // ---- My teams: seeded from the profile, extended by teams created in this session ----
    const [myTeamIds, setMyTeamIds] = useState([]);
    useEffect(() => {
        setMyTeamIds(currentUser?.teamId ? [String(currentUser.teamId)] : []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.id]);
    useEffect(() => {
        if (!currentUser?.teamId) return;
        const id = String(currentUser.teamId);
        setMyTeamIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    }, [currentUser?.teamId]);
    const myTeams = useMemo(() => {
        if (isVisitor) return [];
        const phone = cleanPhone(currentUser?.phone);
        return (teams || []).filter(t => myTeamIds.includes(String(t.id)) || (phone && t.captainPhone && cleanPhone(t.captainPhone) === phone));
    }, [teams, myTeamIds, currentUser, isVisitor]);
    const otherTeams = useMemo(() => (teams || []).filter(t => !myTeams.some(m => m.id === t.id)), [teams, myTeams]);
    const hasTeam = myTeams.length > 0;

    // Goals credited to this user on any roster (0 for visitors)
    const myGoalsCount = useMemo(() => {
        if (isVisitor) return 0;
        const name = String(currentUser?.name || '').trim().toLowerCase();
        const phone = cleanPhone(currentUser?.phone);
        let total = 0;
        (teams || []).forEach(t => (t?.players || []).forEach(p => {
            const sameName = name && String(p?.name || '').trim().toLowerCase() === name;
            const samePhone = phone && p?.phone && cleanPhone(p.phone) === phone;
            if (sameName || samePhone) total += Number(p?.goals) || 0;
        }));
        return total;
    }, [teams, currentUser, isVisitor]);

    // ---- Team forms ----
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamShort, setNewTeamShort] = useState('');
    const [newTeamArea, setNewTeamArea] = useState('Uttara, Dhaka');
    const [homeColor, setHomeColor] = useState('#4cbf02');
    const [teamError, setTeamError] = useState('');
    const [teamSubmitting, setTeamSubmitting] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    useEffect(() => {
        if (!myTeams.some(t => t.id === selectedTeamId)) setSelectedTeamId(myTeams[0]?.id || '');
    }, [myTeams, selectedTeamId]);
    const selectedTeam = myTeams.find(t => t.id === selectedTeamId) || myTeams[0] || null;

    const [editingTeam, setEditingTeam] = useState(false);
    const [editName, setEditName] = useState('');
    const [editShort, setEditShort] = useState('');
    const [editArea, setEditArea] = useState('');
    const [editColor, setEditColor] = useState('#4cbf02');
    const [editError, setEditError] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);
    useEffect(() => {
        setEditingTeam(false);
        setEditName(selectedTeam?.name || '');
        setEditShort(selectedTeam?.shortCode || '');
        setEditArea(selectedTeam?.area || '');
        setEditColor(selectedTeam?.homeColor || '#4cbf02');
        setEditError('');
    }, [selectedTeam?.id, selectedTeam?.name, selectedTeam?.shortCode, selectedTeam?.area, selectedTeam?.homeColor]);

    const [playerName, setPlayerName] = useState('');
    const [playerNumber, setPlayerNumber] = useState(7);
    const [playerPosition, setPlayerPosition] = useState('MID');
    const [playerRole, setPlayerRole] = useState('Player');
    const [playerPhone, setPlayerPhone] = useState('');
    const [playerError, setPlayerError] = useState('');
    const [playerSubmitting, setPlayerSubmitting] = useState(false);
    const [removingPlayerId, setRemovingPlayerId] = useState('');

    const handleCreateTeamSubmit = async (e) => {
        e.preventDefault();
        if (isVisitor) { openLogin(); return; }
        setTeamError('');
        const name = newTeamName.trim();
        if (name.length < 3) { setTeamError('Team name must be at least 3 characters.'); return; }
        if ((teams || []).some(t => String(t.name || '').toLowerCase() === name.toLowerCase())) {
            setTeamError('A team with this name already exists. Team names must be unique.');
            return;
        }
        setTeamSubmitting(true);
        const r = await handleSaveTeam({ name, shortCode: (newTeamShort || name.slice(0, 4)).toUpperCase(), area: newTeamArea.trim() || 'Uttara, Dhaka', homeColor });
        setTeamSubmitting(false);
        if (!r?.ok) { setTeamError(r?.error || 'Could not register the team.'); return; }
        setMyTeamIds(prev => (prev.includes(String(r.team.id)) ? prev : [...prev, String(r.team.id)]));
        setSelectedTeamId(r.team.id);
        setShowCreateTeam(false);
        setNewTeamName(''); setNewTeamShort(''); setNewTeamArea('Uttara, Dhaka'); setHomeColor('#4cbf02');
    };

    const handleEditTeamSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTeam) return;
        setEditError('');
        const name = editName.trim();
        if (name.length < 3) { setEditError('Team name must be at least 3 characters.'); return; }
        if ((teams || []).some(t => t.id !== selectedTeam.id && String(t.name || '').toLowerCase() === name.toLowerCase())) {
            setEditError('Another team already uses this name.'); return;
        }
        setEditSubmitting(true);
        const r = await handleUpdateTeam(selectedTeam.id, { name, shortCode: (editShort || name.slice(0, 4)).toUpperCase(), area: editArea.trim(), homeColor: editColor });
        setEditSubmitting(false);
        if (!r?.ok) { setEditError(r?.error || 'Could not update the team.'); return; }
        setEditingTeam(false);
    };

    const handleAddPlayerSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTeam) return;
        setPlayerError('');
        const name = playerName.trim();
        if (name.length < 2) { setPlayerError('Player name must be at least 2 characters.'); return; }
        const roster = selectedTeam.players || [];
        if (roster.some(p => String(p?.name || '').trim().toLowerCase() === name.toLowerCase())) { setPlayerError(`${name} is already in the squad.`); return; }
        const num = Number(playerNumber);
        if (num && roster.some(p => Number(p?.number) === num)) { setPlayerError(`Jersey #${num} is already taken in this squad.`); return; }
        if (roster.length >= 20) { setPlayerError('A squad can have at most 20 players.'); return; }
        setPlayerSubmitting(true);
        const r = await handleAddPlayerToTeam(selectedTeam.id, { name, number: num, position: playerPosition, role: playerRole, phone: playerPhone.trim() || undefined });
        setPlayerSubmitting(false);
        if (!r?.ok) { setPlayerError(r?.error || 'Could not add the player.'); return; }
        setPlayerName(''); setPlayerPhone(''); setPlayerRole('Player');
        const used = new Set((r.team?.players || []).map(p => Number(p?.number)));
        let next = num + 1; while (used.has(next) && next < 99) next += 1;
        setPlayerNumber(next);
    };

    const onRemovePlayer = async (p) => {
        if (!selectedTeam || !p?.id) return;
        if (!confirm(`Remove ${p.name} from ${selectedTeam.name}?`)) return;
        setRemovingPlayerId(p.id);
        await handleRemovePlayerFromTeam(selectedTeam.id, p.id); // error (if any) is shown by the context
        setRemovingPlayerId('');
    };

    // ---- Post match result ----
    const [postMatchDate, setPostMatchDate] = useState(today);
    const [postSlotDisplay, setPostSlotDisplay] = useState(SCHEDULE_SLOTS_DEFINITION[9].displayTime);
    const [postHomeTeamId, setPostHomeTeamId] = useState('');
    const [postAwayTeamId, setPostAwayTeamId] = useState('');
    const [postAwayFreeText, setPostAwayFreeText] = useState('');
    const [postHomeScore, setPostHomeScore] = useState(0);
    const [postAwayScore, setPostAwayScore] = useState(0);
    const [matchType, setMatchType] = useState(MATCH_TYPES[0]);
    const [matchEvents, setMatchEvents] = useState([]);
    const [eventSide, setEventSide] = useState('home');
    const [eventType, setEventType] = useState('goal');
    const [eventPlayer, setEventPlayer] = useState('');
    const [eventMinute, setEventMinute] = useState(1);
    const [motm, setMotm] = useState('');
    const [matchReport, setMatchReport] = useState('');
    const [postScoreMsg, setPostScoreMsg] = useState(null); // { type, text }
    const [postSubmitting, setPostSubmitting] = useState(false);
    const [withdrawingId, setWithdrawingId] = useState('');
    useEffect(() => {
        if (!myTeams.some(t => t.id === postHomeTeamId)) setPostHomeTeamId(myTeams[0]?.id || '');
    }, [myTeams, postHomeTeamId]);
    useEffect(() => {
        if (!hasTeam && (activeTab === 'post_score')) setActiveTab('overview');
    }, [hasTeam, activeTab]);
    const postHomeTeam = myTeams.find(t => t.id === postHomeTeamId) || null;
    const postHomeName = postHomeTeam?.name || '';
    const postAwayName = postAwayTeamId === '__other__' ? postAwayFreeText.trim() : (otherTeams.find(t => t.id === postAwayTeamId)?.name || '');

    const handleAddEvent = () => {
        const name = eventPlayer.trim();
        if (!name) return;
        setMatchEvents(prev => [...prev, { id: `ev-${Date.now()}`, side: eventSide, type: eventType, playerName: name, minute: Math.max(0, Math.min(120, Number(eventMinute) || 0)) }]);
        setEventPlayer('');
    };

    const handlePostMatchSubmit = async (e) => {
        e.preventDefault();
        if (isVisitor) { openLogin(); return; }
        setPostScoreMsg(null);
        if (!postHomeName) { setPostScoreMsg({ type: 'error', text: 'Select one of your teams as the home side.' }); return; }
        if (!postAwayName) { setPostScoreMsg({ type: 'error', text: 'Select or type the opponent team.' }); return; }
        if (postAwayName.toLowerCase() === postHomeName.toLowerCase()) { setPostScoreMsg({ type: 'error', text: 'Home and away team must be different.' }); return; }
        if (!postMatchDate || postMatchDate > today) { setPostScoreMsg({ type: 'error', text: 'The match date cannot be in the future.' }); return; }
        const hs = Number(postHomeScore), as = Number(postAwayScore);
        if (Number.isNaN(hs) || Number.isNaN(as) || hs < 0 || as < 0 || hs > 50 || as > 50) { setPostScoreMsg({ type: 'error', text: 'Scores must be between 0 and 50.' }); return; }
        setPostSubmitting(true);
        const r = await handleSaveMatchResult({
            date: postMatchDate,
            slotDisplay: postSlotDisplay,
            homeTeam: postHomeName,
            awayTeam: postAwayName,
            homeTeamId: postHomeTeam?.id || undefined,
            awayTeamId: postAwayTeamId && postAwayTeamId !== '__other__' ? postAwayTeamId : undefined,
            homeScore: hs,
            awayScore: as,
            events: matchEvents.map(({ side, type, playerName, minute }) => ({ side, type, playerName, minute })),
            playerOfTheMatch: motm.trim(),
            matchReport: matchReport.trim(),
            matchType
        });
        setPostSubmitting(false);
        if (!r?.ok) { setPostScoreMsg({ type: 'error', text: r?.error || 'Could not submit the result.' }); return; }
        const published = r.matchResult?.status === 'published';
        setPostScoreMsg({
            type: 'success',
            text: published
                ? 'Match result published. It is now live on the Match Day page and the league table has been updated.'
                : 'Result submitted and waiting for the arena desk to approve it. It will appear on the Match Day page once approved.'
        });
        setMatchEvents([]); setMotm(''); setMatchReport(''); setPostHomeScore(0); setPostAwayScore(0);
        if (published) { try { confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } }); } catch { /* ignore */ } }
    };

    const onWithdrawResult = async (m) => {
        if (!confirm(`Withdraw the submitted result ${m.homeTeam} ${m.homeScore}–${m.awayScore} ${m.awayTeam}?`)) return;
        setWithdrawingId(m.id);
        await handleDeleteMatchResult(m.id);
        setWithdrawingId('');
    };

    // ---- Challenges ----
    const [oppTeamId, setOppTeamId] = useState('');
    const [oppDate, setOppDate] = useState(today);
    const [oppSlot, setOppSlot] = useState(SCHEDULE_SLOTS_DEFINITION[9].displayTime);
    const [oppFormat, setOppFormat] = useState('7 vs 7 Friendly Match');
    const [oppLookingFor, setOppLookingFor] = useState('Opponent Team');
    const [oppCostShare, setOppCostShare] = useState('50/50 Split');
    const [oppLevel, setOppLevel] = useState('Semi-Pro');
    const [oppMessage, setOppMessage] = useState('');
    const [oppMsg, setOppMsg] = useState(null);
    const [oppSubmitting, setOppSubmitting] = useState(false);
    const [challengeBusyId, setChallengeBusyId] = useState('');
    useEffect(() => {
        if (!myTeams.some(t => t.id === oppTeamId)) setOppTeamId(myTeams[0]?.id || '');
    }, [myTeams, oppTeamId]);

    const handlePostChallengeSubmit = async (e) => {
        e.preventDefault();
        if (isVisitor) { openLogin(); return; }
        setOppMsg(null);
        const team = myTeams.find(t => t.id === oppTeamId);
        if (!team) { setOppMsg({ type: 'error', text: 'Register a team first, then post a challenge for it.' }); return; }
        if (!oppDate || oppDate < today) { setOppMsg({ type: 'error', text: 'Pick a date from today onwards.' }); return; }
        setOppSubmitting(true);
        const r = await handleAddChallenge({ teamName: team.name, date: oppDate, timeSlot: oppSlot, format: oppFormat, level: oppLevel, lookingFor: oppLookingFor, costShare: oppCostShare, notes: oppMessage.trim() });
        setOppSubmitting(false);
        if (!r?.ok) { setOppMsg({ type: 'error', text: r?.error || 'Could not post the challenge.' }); return; }
        setOppMsg({ type: 'success', text: 'Challenge posted. It is now visible on the public Match Day board.' });
        setOppMessage('');
    };
    const onCloseChallenge = async (c) => {
        setChallengeBusyId(c.id);
        await handleUpdateChallenge(c.id, { status: 'closed' });
        setChallengeBusyId('');
    };
    const onDeleteChallenge = async (c) => {
        if (!confirm(`Delete the challenge for ${c.teamName} on ${c.date}?`)) return;
        setChallengeBusyId(c.id);
        await handleDeleteChallenge(c.id);
        setChallengeBusyId('');
    };

    // ---- Profile ----
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profilePos, setProfilePos] = useState('MID');
    const [profileMsg, setProfileMsg] = useState(null);
    const [profileSubmitting, setProfileSubmitting] = useState(false);
    useEffect(() => {
        setProfileName(currentUser?.name || '');
        setProfileEmail(currentUser?.email || '');
        setProfilePos(currentUser?.playingPosition || 'MID');
        setProfileMsg(null);
    }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.playingPosition]);
    const [pwCurrent, setPwCurrent] = useState('');
    const [pwNew, setPwNew] = useState('');
    const [pwConfirm, setPwConfirm] = useState('');
    const [pwMsg, setPwMsg] = useState(null);
    const [pwSubmitting, setPwSubmitting] = useState(false);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (isVisitor) { openLogin(); return; }
        setProfileMsg(null);
        const name = profileName.trim();
        if (name.length < 2) { setProfileMsg({ type: 'error', text: 'Please enter your full name.' }); return; }
        setProfileSubmitting(true);
        const r = await handleUpdateProfile({ name, email: profileEmail.trim(), playingPosition: profilePos });
        setProfileSubmitting(false);
        setProfileMsg(r?.ok ? { type: 'success', text: 'Profile updated.' } : { type: 'error', text: r?.error || 'Could not update your profile.' });
    };
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (isVisitor) { openLogin(); return; }
        setPwMsg(null);
        if (!pwCurrent) { setPwMsg({ type: 'error', text: 'Enter your current password.' }); return; }
        if (pwNew.length < 6) { setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' }); return; }
        if (pwNew !== pwConfirm) { setPwMsg({ type: 'error', text: 'New password and confirmation do not match.' }); return; }
        setPwSubmitting(true);
        const r = await handleChangePassword(pwCurrent, pwNew);
        setPwSubmitting(false);
        if (!r?.ok) { setPwMsg({ type: 'error', text: r?.error || 'Could not change the password.' }); return; }
        setPwMsg({ type: 'success', text: 'Password changed.' });
        setPwCurrent(''); setPwNew(''); setPwConfirm('');
    };

    // ---- Notification log (local record, this phone only) ----
    const myNotifications = useMemo(() => {
        if (isVisitor) return [];
        const phone = cleanPhone(currentUser?.phone);
        if (!phone) return [];
        return (smsLogs || []).filter(l => cleanPhone(l?.recipientPhone) === phone);
    }, [smsLogs, currentUser, isVisitor]);

    const deskPhone = siteSettings?.phone || '';
    const deskPhoneLabel = siteSettings?.phoneFormatted || siteSettings?.phone || 'the arena desk';
    const renderMsg = (m) => (m ? (<div className={`p-3 rounded-xl text-xs border ${m.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>{m.text}</div>) : null);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Trophy },
        { id: 'bookings', label: `My Bookings (${(myBookings || []).length})`, icon: Calendar },
        { id: 'teams', label: `My Teams (${myTeams.length})`, icon: Users },
        ...(hasTeam ? [{ id: 'post_score', label: 'Post Match Result', icon: PlusCircle }] : []),
        { id: 'find_opponent', label: 'Find an Opponent', icon: MessageSquare },
        { id: 'profile', label: 'Profile & Settings', icon: User }
    ];

    const renderBookingCard = (b, past) => {
        const meta = statusMeta(b?.paymentStatus);
        const isCancelled = b?.paymentStatus === 'cancelled';
        const paid = Number(b?.advanceAmount) || 0;
        const due = Number(b?.dueAmount) || 0;
        const cancelAllowed = !past && !isCancelled && b?.paymentStatus !== 'pending_payment' && canCancelBooking(b);
        return (<div key={b.id} className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isCancelled || past ? 'bg-black/30 border-white/5 opacity-75' : 'bg-slate-900/80 border-white/10 hover:border-emerald-500/30'}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black text-emerald-400">{b?.bookingCode}</span>
                <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
                {b?.played && <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300">Played</span>}
              </div>
              <h4 className="text-base font-bold text-white">{b?.teamName || 'My squad'}{b?.courtName ? ` · ${b.courtName}` : ''}</h4>
              <div className="text-xs text-slate-400">
                Kickoff: <strong className="text-white">{b?.date}</strong> at <strong className="text-emerald-400">{b?.displayTime}</strong>
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Paid: {money(paid)} · Due: <strong className={due > 0 ? 'text-amber-400' : 'text-emerald-400'}>{money(due)}</strong>
              </div>
              {meta.hint && !past && <div className="text-[11px] text-slate-500">{meta.hint}</div>}
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button type="button" onClick={() => setActiveTicketPass(b)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-colors cursor-pointer">
                View Pass
              </button>
              {!past && !isCancelled && due > 0 && (
                <span className="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold" title="Online balance payment is not available. Pay the remaining amount at the arena desk.">
                  Pay {money(due)} at arena
                </span>)}
              {!past && !isCancelled && (cancelAllowed ? (
                <button type="button" disabled={cancellingId === b.id} onClick={() => onCancelBooking(b)} className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50">
                  {cancellingId === b.id ? 'Cancelling…' : 'Cancel Slot'}
                </button>) : (b?.paymentStatus !== 'pending_payment' && (
                <a href={deskPhone ? `tel:${deskPhone}` : undefined} className="px-3 py-2 rounded-xl bg-white/5 text-slate-400 text-xs border border-white/10 inline-flex items-center gap-1" title={`Online cancellation closes ${pricing?.cancellationHours || 24}h before kick-off. Call ${deskPhoneLabel}.`}>
                  <Phone className="w-3 h-3"/> Call to cancel (&lt;{pricing?.cancellationHours || 24}h)
                </a>)))}
            </div>
          </div>);
    };

    return (<>
      <PageHero crumb="Player & Team Portal" eyebrow="My Squad · Bookings · Match Records" eyebrowIcon={User} title="Player &amp; Team" highlight="Matchday Hub" description="Manage your bookings and passes, build your squad roster, submit match results to the public leaderboard, and challenge other teams." stats={[
            { label: 'Upcoming Games', value: `${upcomingBookings.length} Matches`, icon: Calendar },
            { label: 'My Teams', value: `${myTeams.length} Squads`, icon: Users },
            { label: 'Goals Scored', value: `${myGoalsCount} Goals`, icon: Target },
            { label: 'Account Role', value: (currentUser?.role || 'visitor').toUpperCase(), icon: Shield }
        ]}/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {authChecked && isVisitor && (<div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0"/>
              <div className="text-xs text-amber-200">
                You are browsing as a <strong>Visitor</strong>. Log in with your mobile number to see your bookings, teams and results.
              </div>
            </div>
            <button type="button" onClick={openLogin} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer">
              Log In / Sign Up
            </button>
          </div>)}

        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 text-xs font-bold overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (<button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === tab.id ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4"/>
                <span>{tab.label}</span>
              </button>);
          })}
        </div>

        {isLoadingData ? (<Skeleton/>) : (<>

        {/* 1. OVERVIEW */}
        {activeTab === 'overview' && (<div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
                <div className="text-xs text-slate-400">Upcoming Fixtures</div>
                <div className="text-3xl font-black font-display text-white mt-1">{upcomingBookings.length}</div>
                <div className="text-[12px] text-emerald-400 mt-1">Booked on the turf</div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
                <div className="text-xs text-slate-400">My Squads</div>
                <div className="text-3xl font-black font-display text-white mt-1">{myTeams.length}</div>
                <div className="text-[12px] text-slate-300 mt-1 truncate">{myTeams[0]?.name || 'No team yet'}</div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
                <div className="text-xs text-slate-400">Career Goals</div>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-1">{myGoalsCount}</div>
                <div className="text-[12px] text-slate-300 mt-1">From published results</div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
                <div className="text-xs text-slate-400">Preferred Position</div>
                <div className="text-3xl font-black font-display text-white mt-1">{currentUser?.playingPosition || '—'}</div>
                <div className="text-[12px] text-emerald-400 mt-1">Player Profile</div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white uppercase font-display">Upcoming Match Bookings</h3>
                <Link href="/booking" className="text-xs font-bold text-emerald-400 hover:underline">+ Book Another Slot</Link>
              </div>
              {upcomingBookings.length === 0 ? (<div className="text-center py-8 text-xs text-slate-400">
                  {isVisitor ? 'Log in to see your upcoming games.' : 'No upcoming games booked yet. Book a slot to pick your 90-minute kickoff.'}
                </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upcomingBookings.slice(0, 6).map(b => (<div key={b.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-emerald-400">{b.bookingCode}</div>
                        <div className="text-sm font-bold text-white mt-0.5 truncate">{b.teamName || 'My squad'}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{b.date} · {b.displayTime}</div>
                        <div className="text-[12px] text-slate-300 mt-1">
                          Paid: {money(b.advanceAmount)} · Due: <strong className="text-amber-400">{money(b.dueAmount)}</strong>
                        </div>
                      </div>
                      <button type="button" onClick={() => setActiveTicketPass(b)} className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs uppercase transition-colors shrink-0 cursor-pointer">
                        Open Pass
                      </button>
                    </div>))}
                </div>)}
            </div>
          </div>)}

        {/* 2. MY BOOKINGS */}
        {activeTab === 'bookings' && (<div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black uppercase text-white font-display">My Match Bookings &amp; Passes</h3>
                <p className="text-xs text-slate-400">
                  Upcoming and past turf bookings. Online cancellation is open until {pricing?.cancellationHours || 24} hours before kick-off; any amount paid goes to the refund queue.
                </p>
              </div>
              <Link href="/booking" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase shrink-0">+ Book Slot</Link>
            </div>

            {(myBookings || []).length === 0 ? (<div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-white/5 text-slate-400 space-y-2">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto"/>
                <div className="text-sm font-bold text-white">{isVisitor ? 'Log in to see your bookings' : 'No bookings under your account yet'}</div>
                <p className="text-xs">{isVisitor ? 'Bookings are linked to the mobile number you booked with.' : 'Book your first 90-minute turf slot online, any time.'}</p>
                {isVisitor && <button type="button" onClick={openLogin} className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase cursor-pointer">Log In</button>}
              </div>) : (<>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Upcoming ({upcomingBookings.length})</h4>
                  {upcomingBookings.length === 0 ? (<div className="text-xs text-slate-400 p-4 rounded-2xl bg-slate-900/40 border border-white/5">No upcoming bookings.</div>)
                    : upcomingBookings.map(b => renderBookingCard(b, false))}
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Past &amp; cancelled ({pastBookings.length})</h4>
                  {pastBookings.length === 0 ? (<div className="text-xs text-slate-400 p-4 rounded-2xl bg-slate-900/40 border border-white/5">Nothing here yet.</div>)
                    : pastBookings.map(b => renderBookingCard(b, true))}
                </div>
              </>)}
          </div>)}

        {/* 3. TEAMS & SQUAD */}
        {activeTab === 'teams' && (<div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black uppercase text-white font-display">My Teams &amp; Squad Rosters</h3>
                <p className="text-xs text-slate-400">Create a team, add players with jersey numbers and positions, and track squad stats. You can captain up to 3 teams.</p>
              </div>
              <button type="button" onClick={() => { if (isVisitor) { openLogin(); return; } setShowCreateTeam(v => !v); setTeamError(''); }} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0">
                {showCreateTeam ? 'Close Form' : '+ Create New Team'}
              </button>
            </div>

            {showCreateTeam && !isVisitor && (<form onSubmit={handleCreateTeamSubmit} className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-4">
                <h4 className="text-sm font-bold uppercase text-emerald-400">Register New Squad</h4>
                {teamError && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{teamError}</div>)}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Squad Name (unique) *</label>
                    <input type="text" required minLength={3} maxLength={60} placeholder="e.g. Metro Velocity 7s" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} className={INPUT}/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Short Code</label>
                    <input type="text" placeholder="e.g. MV7" maxLength={5} value={newTeamShort} onChange={e => setNewTeamShort(e.target.value)} className={`${INPUT} font-mono uppercase`}/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Area / Locality</label>
                    <input type="text" maxLength={60} placeholder="e.g. Sector 17, Uttara" value={newTeamArea} onChange={e => setNewTeamArea(e.target.value)} className={INPUT}/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Team Jersey Colour</label>
                    <input type="color" value={homeColor} onChange={e => setHomeColor(e.target.value)} className="w-full h-9 rounded-xl bg-slate-950 border border-white/10 p-1 cursor-pointer"/>
                  </div>
                  <div className="sm:col-span-2 text-xs text-slate-400">
                    Captain: <strong className="text-white">{currentUser?.name}</strong> · <span className="font-mono">{currentUser?.phone}</span> (taken from your account)
                  </div>
                </div>
                <button type="submit" disabled={teamSubmitting} className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase disabled:opacity-60 cursor-pointer">
                  {teamSubmitting ? 'Registering…' : 'Create Squad'}
                </button>
              </form>)}

            {!hasTeam && !showCreateTeam && (<div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-white/5 text-slate-400 space-y-2">
                <Users className="w-10 h-10 text-slate-600 mx-auto"/>
                <div className="text-sm font-bold text-white">{isVisitor ? 'Log in to manage your teams' : 'Create your first team'}</div>
                <p className="text-xs">Register a squad to post match results and challenge other teams.</p>
                <button type="button" onClick={() => (isVisitor ? openLogin() : setShowCreateTeam(true))} className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase cursor-pointer">
                  {isVisitor ? 'Log In' : '+ Create Team'}
                </button>
              </div>)}

            {myTeams.length > 1 && (<div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Team:</span>
                {myTeams.map(t => (<button key={t.id} type="button" onClick={() => setSelectedTeamId(t.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${selectedTeam?.id === t.id ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}>
                    {t.name}
                  </button>))}
              </div>)}

            {selectedTeam && (<div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-2xl shrink-0 flex items-center justify-center font-black text-xs text-slate-950 shadow-md" style={{ backgroundColor: selectedTeam.homeColor || '#4cbf02' }}>
                      {selectedTeam.shortCode}
                    </span>
                    <div>
                      <h4 className="text-lg font-black text-white">{selectedTeam.name}</h4>
                      <div className="text-xs text-slate-400">Captain: <strong>{selectedTeam.captainName}</strong> · Area: {selectedTeam.area || 'Dhaka'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>Played: <strong>{selectedTeam.stats?.played ?? 0}</strong></div>
                    <div>Won: <strong className="text-emerald-400">{selectedTeam.stats?.won ?? 0}</strong></div>
                    <div>Points: <strong className="text-emerald-400 font-bold">{selectedTeam.stats?.points ?? 0}</strong></div>
                    <button type="button" onClick={() => { setEditingTeam(v => !v); setEditError(''); }} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-sans font-bold inline-flex items-center gap-1 cursor-pointer">
                      <Pencil className="w-3 h-3"/> {editingTeam ? 'Close' : 'Edit'}
                    </button>
                  </div>
                </div>

                {editingTeam && (<form onSubmit={handleEditTeamSubmit} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Edit team details</div>
                    {editError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{editError}</div>}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <input type="text" required minLength={3} maxLength={60} placeholder="Team name" value={editName} onChange={e => setEditName(e.target.value)} className={INPUT}/>
                      <input type="text" maxLength={5} placeholder="Code" value={editShort} onChange={e => setEditShort(e.target.value)} className={`${INPUT} font-mono uppercase`}/>
                      <input type="text" maxLength={60} placeholder="Area" value={editArea} onChange={e => setEditArea(e.target.value)} className={INPUT}/>
                      <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-full h-9 rounded-xl bg-slate-950 border border-white/10 p-1 cursor-pointer"/>
                    </div>
                    <button type="submit" disabled={editSubmitting} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase disabled:opacity-60 cursor-pointer">
                      {editSubmitting ? 'Saving…' : 'Save Changes'}
                    </button>
                  </form>)}

                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Squad Roster ({(selectedTeam.players || []).length} players)</h5>
                  {(selectedTeam.players || []).length === 0 ? (<div className="text-xs text-slate-400">No players yet. Add your first player below.</div>) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {(selectedTeam.players || []).map(p => (<div key={p.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 shrink-0">#{p.number}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{p.name}</div>
                            <div className="text-[11px] text-slate-400">{p.position} · {p.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-400">{p.goals || 0} G</span>
                          <button type="button" disabled={removingPlayerId === p.id} onClick={() => onRemovePlayer(p)} title="Remove from squad" className="text-slate-500 hover:text-rose-400 disabled:opacity-40 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>))}
                  </div>)}
                </div>

                <form onSubmit={handleAddPlayerSubmit} className="pt-4 border-t border-white/10 space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">+ Add Player to Squad</div>
                  {playerError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{playerError}</div>}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <input type="text" required minLength={2} maxLength={40} placeholder="Player name" value={playerName} onChange={e => setPlayerName(e.target.value)} className={`${INPUT} col-span-2 sm:col-span-1`}/>
                    <input type="number" placeholder="Jersey #" min={0} max={99} value={playerNumber} onChange={e => setPlayerNumber(Number(e.target.value))} className={`${INPUT} font-mono`}/>
                    <select value={playerPosition} onChange={e => setPlayerPosition(e.target.value)} className={INPUT}>
                      {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <select value={playerRole} onChange={e => setPlayerRole(e.target.value)} className={INPUT}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <input type="tel" placeholder="Mobile (optional)" value={playerPhone} onChange={e => setPlayerPhone(e.target.value)} className={`${INPUT} font-mono`}/>
                  </div>
                  <button type="submit" disabled={playerSubmitting} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase disabled:opacity-60 cursor-pointer">
                    {playerSubmitting ? 'Adding…' : 'Add Player to Roster'}
                  </button>
                </form>
              </div>)}
          </div>)}

        {/* 4. POST MATCH RESULT (captains only) */}
        {activeTab === 'post_score' && hasTeam && (<div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
              <div>
                <h3 className="text-xl font-black uppercase text-white font-display">Post Match Result &amp; Events</h3>
                <p className="text-xs text-slate-400">
                  Captains submit scores, scorers with minutes, cards and player of the match. {pricing?.approveResultsFirst ? 'Results are checked by the arena desk before they go live.' : 'Published results update the Match Day leaderboard immediately.'}
                </p>
              </div>
              {renderMsg(postScoreMsg)}
              <form onSubmit={handlePostMatchSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Match Date *</label>
                    <input type="date" required max={today} value={postMatchDate} onChange={e => setPostMatchDate(e.target.value)} className={INPUT}/>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kickoff Slot *</label>
                    <select value={postSlotDisplay} onChange={e => setPostSlotDisplay(e.target.value)} className={INPUT}>
                      {slotOptions.map(s => (<option key={s.slotNumber} value={s.displayTime}>Slot #{s.slotNumber} ({s.displayTime})</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Match Type</label>
                    <select value={matchType} onChange={e => setMatchType(e.target.value)} className={INPUT}>
                      {MATCH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Home Team (your team) *</label>
                    <select required value={postHomeTeamId} onChange={e => setPostHomeTeamId(e.target.value)} className={`${INPUT} font-bold`}>
                      {myTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <div className="mt-2">
                      <label className="block text-xs text-slate-400 mb-1">Home Score</label>
                      <input type="number" min={0} max={50} value={postHomeScore} onChange={e => setPostHomeScore(Number(e.target.value))} className="w-20 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-base font-bold"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Opponent Team *</label>
                    <select required value={postAwayTeamId} onChange={e => setPostAwayTeamId(e.target.value)} className={`${INPUT} font-bold`}>
                      <option value="">Select opponent…</option>
                      {otherTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      <option value="__other__">Other (not registered yet)</option>
                    </select>
                    {postAwayTeamId === '__other__' && (<input type="text" required maxLength={60} placeholder="Opponent team name" value={postAwayFreeText} onChange={e => setPostAwayFreeText(e.target.value)} className={`${INPUT} mt-2`}/>)}
                    <div className="mt-2">
                      <label className="block text-xs text-slate-400 mb-1">Opponent Score</label>
                      <input type="number" min={0} max={50} value={postAwayScore} onChange={e => setPostAwayScore(Number(e.target.value))} className="w-20 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-base font-bold"/>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Match Events &amp; Goal Scorers</div>
                    <span className="text-[12px] text-slate-400">{matchEvents.length} events logged</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <select value={eventSide} onChange={e => setEventSide(e.target.value)} className={INPUT}>
                      <option value="home">Home ({(postHomeName || 'Home').slice(0, 12)})</option>
                      <option value="away">Away ({(postAwayName || 'Away').slice(0, 12)})</option>
                    </select>
                    <select value={eventType} onChange={e => setEventType(e.target.value)} className={INPUT}>
                      {EVENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <input type="text" maxLength={40} placeholder="Player name" value={eventPlayer} onChange={e => setEventPlayer(e.target.value)} className={`${INPUT} col-span-2 sm:col-span-1`}/>
                    <input type="number" placeholder="Minute" min={0} max={120} value={eventMinute} onChange={e => setEventMinute(Number(e.target.value))} className={`${INPUT} font-mono`}/>
                    <button type="button" onClick={handleAddEvent} className="py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold transition-colors cursor-pointer">+ Add Event</button>
                  </div>
                  {matchEvents.length > 0 && (<div className="space-y-1 pt-2">
                      {matchEvents.map((ev, i) => (<div key={ev.id} className="p-2 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{ev.playerName}</span>
                            <span className="text-slate-400 ml-2">({ev.side === 'home' ? postHomeName : postAwayName})</span>
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] bg-white/5 uppercase">{String(ev.type).replaceAll('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-400 font-bold">{ev.minute}&apos;</span>
                            <button type="button" onClick={() => setMatchEvents(matchEvents.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>))}
                    </div>)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Player of the Match</label>
                    <input type="text" maxLength={60} placeholder="e.g. Siam Chowdhury" value={motm} onChange={e => setMotm(e.target.value)} className={INPUT}/>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Match Report / Summary</label>
                    <textarea rows={2} maxLength={2000} placeholder="Short report on match highlights..." value={matchReport} onChange={e => setMatchReport(e.target.value)} className={INPUT}/>
                  </div>
                </div>

                <button type="submit" disabled={postSubmitting} className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-60 cursor-pointer">
                  {postSubmitting ? 'Submitting…' : (pricing?.approveResultsFirst ? 'Submit Result for Approval' : 'Publish Match Result')}
                </button>
              </form>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
              <h4 className="text-sm font-bold uppercase text-white font-display">My Submitted Results ({(myMatchResults || []).length})</h4>
              {(myMatchResults || []).length === 0 ? (<div className="text-xs text-slate-400">You have not submitted any results yet.</div>) : (
              <div className="space-y-2">
                {(myMatchResults || []).map(m => (<div key={m.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${RESULT_STATUS[m.status] || 'bg-white/10 text-slate-300'}`}>{String(m.status || '').replaceAll('_', ' ')}</span>
                        <span className="text-xs text-slate-400">{m.date} · {m.slotDisplay}</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">{m.homeTeam} <span className="font-mono text-emerald-400">{m.homeScore}–{m.awayScore}</span> {m.awayTeam}</div>
                      {m.playerOfTheMatch && <div className="text-[11px] text-slate-400">MOTM: {m.playerOfTheMatch}</div>}
                    </div>
                    {m.status === 'pending_approval' && (<button type="button" disabled={withdrawingId === m.id} onClick={() => onWithdrawResult(m)} className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold disabled:opacity-50 cursor-pointer shrink-0">
                        {withdrawingId === m.id ? 'Withdrawing…' : 'Withdraw'}
                      </button>)}
                  </div>))}
              </div>)}
            </div>
          </div>)}

        {/* 5. FIND OPPONENT */}
        {activeTab === 'find_opponent' && (<div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
              <div>
                <h3 className="text-xl font-black uppercase text-white font-display">Post an Opponent-Wanted Challenge</h3>
                <p className="text-xs text-slate-400">Post your squad&apos;s preferred date and slot to challenge other squads on the public Match Day board.</p>
              </div>

              {isVisitor ? (<div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span>Log in to post a challenge for your team.</span>
                  <button type="button" onClick={openLogin} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase cursor-pointer shrink-0">Log In</button>
                </div>) : !hasTeam ? (<div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span>You need a registered team before you can post a challenge.</span>
                  <button type="button" onClick={() => { setActiveTab('teams'); setShowCreateTeam(true); }} className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase cursor-pointer shrink-0">Create a Team</button>
                </div>) : (<>
                {renderMsg(oppMsg)}
                <form onSubmit={handlePostChallengeSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Your Team *</label>
                      <select required value={oppTeamId} onChange={e => setOppTeamId(e.target.value)} className={`${INPUT} font-bold`}>
                        {myTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Match Date *</label>
                      <input type="date" required min={today} value={oppDate} onChange={e => setOppDate(e.target.value)} className={INPUT}/>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Preferred Slot *</label>
                      <select value={oppSlot} onChange={e => setOppSlot(e.target.value)} className={INPUT}>
                        {slotOptions.map(s => (<option key={s.slotNumber} value={s.displayTime}>Slot #{s.slotNumber} ({s.displayTime})</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Level</label>
                      <select value={oppLevel} onChange={e => setOppLevel(e.target.value)} className={INPUT}>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Format</label>
                      <select value={oppFormat} onChange={e => setOppFormat(e.target.value)} className={INPUT}>
                        <option>7 vs 7 Friendly Match</option>
                        <option>7 vs 7 League Match</option>
                        <option>5 vs 5 Friendly Match</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Looking For</label>
                      <select value={oppLookingFor} onChange={e => setOppLookingFor(e.target.value)} className={INPUT}>
                        <option value="Opponent Team">Opponent Team</option>
                        <option value="1-2 Players">1-2 Players to complete squad</option>
                        <option value="Goalkeeper Needed">Goalkeeper needed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Cost Sharing</label>
                      <select value={oppCostShare} onChange={e => setOppCostShare(e.target.value)} className={INPUT}>
                        <option value="50/50 Split">50/50 split of the slot fee</option>
                        <option value="We pay the slot">We pay the slot</option>
                        <option value="Opponent pays the slot">Opponent pays the slot</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">Squad Message</label>
                    <textarea rows={2} maxLength={300} placeholder="e.g. Good passing 7s squad looking for a fast, friendly match..." value={oppMessage} onChange={e => setOppMessage(e.target.value)} className={INPUT}/>
                  </div>
                  <button type="submit" disabled={oppSubmitting} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-60 cursor-pointer">
                    {oppSubmitting ? 'Posting…' : 'Post Challenge on Match Day Board'}
                  </button>
                </form>
              </>)}
            </div>

            {!isVisitor && (<div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
                <h4 className="text-sm font-bold uppercase text-white font-display">My Challenges ({(myChallenges || []).length})</h4>
                {(myChallenges || []).length === 0 ? (<div className="text-xs text-slate-400">You have not posted any challenges yet.</div>) : (
                <div className="space-y-2">
                  {(myChallenges || []).map(c => (<div key={c.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${CHALLENGE_STATUS[c.status] || 'bg-white/10 text-slate-300'}`}>{String(c.status || '').replaceAll('_', ' ')}</span>
                          <span className="text-xs text-slate-400">{c.date} · {c.timeSlot}</span>
                        </div>
                        <div className="text-sm font-bold text-white mt-1">{c.teamName} <span className="text-slate-400 font-normal">· {c.format} · {c.level}</span></div>
                        {c.status === 'matched' && (c.matchedTeamName || c.matchedCaptainName) && (<div className="text-[11px] text-sky-300">
                            Accepted by {c.matchedTeamName || c.matchedCaptainName}{c.matchedCaptainName && c.matchedTeamName ? ` (${c.matchedCaptainName})` : ''}{c.matchedPhone ? ` · ${c.matchedPhone}` : ''}
                          </div>)}
                        {c.notes && <div className="text-[11px] text-slate-400 truncate">{c.notes}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.status === 'open' && (<button type="button" disabled={challengeBusyId === c.id} onClick={() => onCloseChallenge(c)} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold disabled:opacity-50 cursor-pointer">Close</button>)}
                        <button type="button" disabled={challengeBusyId === c.id} onClick={() => onDeleteChallenge(c)} className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold disabled:opacity-50 cursor-pointer">Delete</button>
                      </div>
                    </div>))}
                </div>)}
              </div>)}
          </div>)}

        {/* 6. PROFILE & SETTINGS */}
        {activeTab === 'profile' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
                <h3 className="text-lg font-black uppercase text-white font-display">Player Profile</h3>
                {isVisitor ? (<div className="text-xs text-slate-400">
                    Log in to edit your profile. <button type="button" onClick={openLogin} className="text-emerald-400 font-bold hover:underline cursor-pointer">Log in</button>
                  </div>) : (<>
                  {renderMsg(profileMsg)}
                  <form onSubmit={handleProfileSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                      <input type="text" required minLength={2} maxLength={60} value={profileName} onChange={e => setProfileName(e.target.value)} className={INPUT}/>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                      <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className={INPUT}/>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Playing Position</label>
                      <select value={profilePos} onChange={e => setProfilePos(e.target.value)} className={INPUT}>
                        {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Registered Mobile</label>
                      <input type="text" disabled value={currentUser?.phone || ''} className={`${INPUT_DISABLED} font-mono`}/>
                      <div className="text-[11px] text-slate-500 mt-1">Your mobile number is your login and links your bookings. Contact the arena desk{deskPhone ? ` (${deskPhoneLabel})` : ''} to change it.</div>
                    </div>
                    <button type="submit" disabled={profileSubmitting} className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold uppercase text-xs disabled:opacity-60 cursor-pointer">
                      {profileSubmitting ? 'Saving…' : 'Save Profile Changes'}
                    </button>
                  </form>
                </>)}
              </div>

              {!isVisitor && (<div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <Lock className="w-4 h-4"/><span>Change Password</span>
                  </div>
                  {renderMsg(pwMsg)}
                  <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
                      <input type="password" required autoComplete="current-password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} className={INPUT}/>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                        <input type="password" required minLength={6} autoComplete="new-password" value={pwNew} onChange={e => setPwNew(e.target.value)} className={INPUT}/>
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                        <input type="password" required minLength={6} autoComplete="new-password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} className={INPUT}/>
                      </div>
                    </div>
                    <button type="submit" disabled={pwSubmitting} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold uppercase text-xs disabled:opacity-60 cursor-pointer">
                      {pwSubmitting ? 'Updating…' : 'Update Password'}
                    </button>
                  </form>
                </div>)}
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Bell className="w-4 h-4"/><span>Notification log</span>
              </div>
              <p className="text-[11px] text-slate-500">Confirmations recorded for your number on this device.</p>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {myNotifications.length === 0 ? (<div className="text-xs text-slate-400 py-6 text-center">{isVisitor ? 'Log in to see your notifications.' : 'No notifications recorded yet.'}</div>)
                : myNotifications.slice(0, 10).map(log => (<div key={log.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="uppercase">{String(log.event || 'notification').replaceAll('_', ' ')}</span>
                      <span className="font-mono">{String(log.sentAt || '').split('T')[0]}</span>
                    </div>
                    <p className="text-slate-300 text-[12px] leading-relaxed">{log.message}</p>
                  </div>))}
              </div>
            </div>
          </div>)}

        </>)}
      </div>
    </>);
}
