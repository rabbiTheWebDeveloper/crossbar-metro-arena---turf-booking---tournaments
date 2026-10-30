'use client';
import React, { useState, useMemo } from 'react';
import { Trophy, Calendar, Users, DollarSign, ChevronRight, CheckCircle2, Shield, Lock } from 'lucide-react';
import { TournamentModal } from './TournamentModal';
import { useArena, todayDhaka, cleanPhone } from '../context/ArenaContext';

const isRegistrationOpen = (t, today) => ['open', 'fast_filling'].includes(t.status) && (!t.registrationDeadline || t.registrationDeadline >= today);

/** Tournament availability for a card: 'open' | 'full' | 'closed' */
export const tournamentAvailability = (t, today = todayDhaka()) => {
    const max = Number(t.maxTeams) || 0;
    const registered = Number(t.registeredCount) || 0;
    if (!isRegistrationOpen(t, today)) return 'closed';
    if (max > 0 && registered >= max) return 'full';
    return 'open';
};

export const TournamentSection = ({ tournaments, onRegistrationSuccess, hideHeading = false }) => {
    const { siteSettings } = useArena();
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [justRegistered, setJustRegistered] = useState(null);
    const today = todayDhaka();
    const telHref = siteSettings.phone ? `tel:${cleanPhone(siteSettings.phone)}` : null;
    const phoneLabel = siteSettings.phoneFormatted || siteSettings.phone || '';

    // Open tournaments first, then full / closed ones (kept visible with a badge)
    const ordered = useMemo(() => {
        const list = (tournaments || []).map(t => ({ t, availability: tournamentAvailability(t, today) }));
        const rank = { open: 0, full: 1, closed: 2 };
        return list.sort((a, b) => rank[a.availability] - rank[b.availability]);
    }, [tournaments, today]);
    const hasOpen = ordered.some(x => x.availability === 'open');

    const handleRegister = async (payload) => {
        const result = await onRegistrationSuccess(payload);
        if (result && result.ok) {
            setSelectedTournament(null);
            setJustRegistered({ teamName: payload.teamName, tournamentTitle: payload.tournamentTitle, message: result.message });
        }
        return result;
    };

    return (<section id="tournaments" className="py-14 md:py-24 bg-[#070b0e] border-t border-white/5 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (<div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Trophy className="w-3.5 h-3.5 text-amber-400"/>
              <span>Tournaments &amp; Cups</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-tight">
              Championship Tournaments &amp; Leagues
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Bring your squad to compete for trophies, medals and cash prizes at Crossbar Metro Arena.
            </p>
          </div>)}

        {justRegistered && (<div role="status" className="mb-8 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-start justify-between gap-3 text-emerald-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0"/>
              <div>
                <strong className="text-white">Registration received. </strong>
                <span>{justRegistered.message || `Team ${justRegistered.teamName} has been entered into ${justRegistered.tournamentTitle}. The match committee will confirm your spot after checking the entry fee.`}</span>
              </div>
            </div>
            <button type="button" onClick={() => setJustRegistered(null)} className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer">Dismiss</button>
          </div>)}

        {ordered.length === 0 ? (<div className="text-center py-16 px-4 rounded-2xl bg-white/[0.02] border border-white/5 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Trophy className="w-8 h-8"/>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-display uppercase">No tournaments announced</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              There are no tournament registrations open right now. Check back soon, or contact the arena to host a private cup.
            </p>
            {telHref && (<a href={telHref} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors">
                Call the arena ({phoneLabel})
              </a>)}
          </div>) : (<>
            {!hasOpen && (<p className="text-center text-xs text-slate-400 mb-6">Registration is currently closed for all listed tournaments.</p>)}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {ordered.map(({ t, availability }) => {
                const max = Number(t.maxTeams) || 0;
                const registered = Number(t.registeredCount) || 0;
                const fillPercentage = max > 0 ? Math.min(100, Math.round((registered / max) * 100)) : 0;
                const spotsLeft = Math.max(0, max - registered);
                const isOpen = availability === 'open';
                const badge = availability === 'full'
                    ? { text: 'Full', cls: 'bg-rose-500/20 text-rose-300 border border-rose-500/40' }
                    : availability === 'closed'
                        ? { text: 'Closed', cls: 'bg-slate-500/20 text-slate-300 border border-slate-500/40' }
                        : t.status === 'fast_filling'
                            ? { text: 'Filling Fast', cls: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' }
                            : { text: 'Registration Open', cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' };
                return (<div key={t.id} className={`bg-gradient-to-b from-slate-900/90 to-[#0b1117] border border-white/10 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group ${isOpen ? 'hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5' : 'opacity-80'}`}>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-amber-400 font-mono">{t.category}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${badge.cls}`}>{badge.text}</span>
                    </div>

                    <h3 className="text-2xl font-black text-white font-display mb-1 uppercase">{t.title}</h3>
                    <div className="text-xs text-slate-400 mb-4">{t.edition}</div>

                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300 uppercase tracking-wider text-[12px] font-medium">Total Prize Pool</span>
                        <span className="text-lg font-black font-mono text-amber-400">৳{Number(t.prizePool || 0).toLocaleString()}</span>
                      </div>
                      {(t.firstPrize || t.runnerUpPrize) && (<div className="text-[12px] text-slate-300 pt-1 border-t border-amber-500/20 flex flex-col gap-0.5">
                          {t.firstPrize && <span><strong>1st Place:</strong> {t.firstPrize}</span>}
                          {t.runnerUpPrize && <span><strong>Runners Up:</strong> {t.runnerUpPrize}</span>}
                        </div>)}
                    </div>

                    <div className="space-y-2 text-xs text-slate-300 mb-5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400 shrink-0"/>
                        <span>{t.dates}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400 shrink-0"/>
                        <span>{t.format}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400 shrink-0"/>
                        <span>Entry Fee: <strong className="text-white font-mono">৳{Number(t.entryFee || 0).toLocaleString()}</strong> per team</span>
                      </div>
                      {t.registrationDeadline && (<div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-400 shrink-0"/>
                          <span>Register by <strong className="text-white">{t.registrationDeadline}</strong></span>
                        </div>)}
                    </div>

                    <div className="mb-5">
                      <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                        <span>Roster: <strong>{registered}{max > 0 ? ` / ${max}` : ''} Teams</strong></span>
                        {max > 0 && <span className={`font-bold ${spotsLeft > 0 ? 'text-amber-400' : 'text-rose-400'}`}>{spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'No spots left'}</span>}
                      </div>
                      <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500" style={{ width: `${fillPercentage}%` }}></div>
                      </div>
                    </div>

                    {Array.isArray(t.highlights) && t.highlights.length > 0 && (<div className="pt-3 border-t border-white/10 mb-6">
                        <div className="text-[12px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Tournament Highlights:</div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {t.highlights.map((h, i) => (<li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                              <span>{h}</span>
                            </li>))}
                        </ul>
                      </div>)}
                  </div>

                  <button type="button" disabled={!isOpen} onClick={() => isOpen && setSelectedTournament(t)} className={`w-full py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isOpen
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/15 cursor-pointer group-hover:scale-[1.02]'
                        : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'}`}>
                    <Trophy className="w-4 h-4"/>
                    <span>{isOpen ? 'Register Team Squad' : availability === 'full' ? 'Tournament Full' : 'Registration Closed'}</span>
                    {isOpen && <ChevronRight className="w-4 h-4"/>}
                  </button>
                </div>);
              })}
            </div>
          </>)}

        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-[#0e1620] border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-emerald-400"/>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display uppercase">Host a Corporate Cup or Private Tournament</h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Need an all-day booking, referees and a custom format for your company, university or friends&apos; league? Talk to the arena desk and we will put a package together.
              </p>
            </div>
          </div>
          {telHref ? (<a href={telHref} className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all">
              <span>Call the arena ({phoneLabel})</span>
            </a>) : siteSettings.whatsappUrl ? (<a href={siteSettings.whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shrink-0 flex items-center justify-center gap-2">
              <span>Message on WhatsApp</span>
            </a>) : null}
        </div>
      </div>

      {selectedTournament && (<TournamentModal tournament={selectedTournament} onClose={() => setSelectedTournament(null)} onRegisterSuccess={handleRegister}/>)}
    </section>);
};
