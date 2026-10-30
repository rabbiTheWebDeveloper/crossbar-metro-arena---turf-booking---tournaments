'use client';
import React, { useMemo } from 'react';
import { CrossbarLogo } from './CrossbarLogo';
import { useArena, todayDhaka } from '../context/ArenaContext';
import { Calendar, Users, Trophy, Sparkles, Shield, Clock, Train, ChevronRight, Swords, Flag } from 'lucide-react';

const TOTAL_DAILY_SLOTS = 12;

export const HeroBanner = ({ onBookClick, onTagSquadClick, onTournamentsClick }) => {
    const { bookings, matchResults, challenges, tournaments, pricing, siteSettings, isLoadingData } = useArena();
    const today = todayDhaka();

    const stats = useMemo(() => {
        const takenToday = bookings.filter(b => b.date === today && b.paymentStatus !== 'cancelled').length;
        const slotsLeft = Math.max(0, TOTAL_DAILY_SLOTS - takenToday);
        const published = matchResults.filter(m => m.status === 'published').length;
        const openChallenges = challenges.filter(c => (c.status || 'open') === 'open').length;
        return { slotsLeft, published, openChallenges };
    }, [bookings, matchResults, challenges, today]);

    const openTournament = useMemo(() => {
        const list = tournaments.filter(t => ['open', 'fast_filling'].includes(t.status) && (!t.registrationDeadline || t.registrationDeadline >= today));
        return list.find(t => Number(t.prizePool) > 0) || list[0] || null;
    }, [tournaments, today]);
    const tournamentLabel = openTournament && Number(openTournament.prizePool) > 0
        ? `Tournaments (৳${Number(openTournament.prizePool).toLocaleString()} Prize)`
        : 'Tournaments & Cups';

    const advance = Number(pricing.advanceAmount || 0);
    const windowDays = Number(pricing.bookingWindowDays || 60);

    const liveStats = [
        { icon: Clock, label: "Today's open slots", value: isLoadingData ? '…' : `${stats.slotsLeft} / ${TOTAL_DAILY_SLOTS}`, tone: stats.slotsLeft > 0 ? 'text-emerald-400' : 'text-amber-400', onClick: onBookClick },
        { icon: Flag, label: 'Published results', value: isLoadingData ? '…' : String(stats.published), tone: 'text-white', href: '/results' },
        { icon: Swords, label: 'Open challenges', value: isLoadingData ? '…' : String(stats.openChallenges), tone: 'text-white', href: '/matches' }
    ];

    return (<section className="relative overflow-hidden pt-8 pb-14 sm:pt-12 sm:pb-20 md:pt-16 md:pb-28 bg-[#070b0e]">
      <div className="absolute -top-12 -left-20 w-[450px] sm:w-[750px] h-[500px] sm:h-[750px] pointer-events-none animate-floodlight-left z-0">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(95,216,15,0.35)_0%,rgba(76,191,2,0.12)_35%,transparent_70%)] blur-[40px] sm:blur-[60px]"/>
      </div>
      <div className="absolute -top-12 -right-20 w-[450px] sm:w-[750px] h-[500px] sm:h-[750px] pointer-events-none animate-floodlight-right z-0">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(76,191,2,0.32)_0%,rgba(76,191,2,0.10)_35%,transparent_70%)] blur-[40px] sm:blur-[60px]"/>
      </div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[850px] h-[350px] sm:h-[450px] bg-gradient-to-b from-emerald-500/20 via-emerald-400/10 to-transparent rounded-full blur-[100px] sm:blur-[140px] pointer-events-none z-0"/>
      <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[600px] sm:w-[950px] h-[250px] bg-emerald-500/15 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none z-0"/>
      <div className="absolute inset-0 pitch-grid pointer-events-none z-0"/>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-5 sm:mb-7 page-enter">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg shadow-emerald-500/10">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90"/>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#4cbf02]"/>
            </span>
            <span className="font-extrabold text-emerald-400 tracking-wider text-[12px] sm:text-xs uppercase">
              12 daily slots · 90 mins each{advance > 0 ? ` · ৳${advance.toLocaleString()} advance` : ''}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[12px] sm:text-xs font-semibold backdrop-blur-md">
            <Train className="w-3.5 h-3.5 text-emerald-400"/>
            <span>{siteSettings.metroStation || 'Uttara Center Metro Station'}</span>
          </div>
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-4 sm:mb-6 page-enter float-slow">
            <CrossbarLogo size="lg"/>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase font-display leading-[1.05] mb-4 sm:mb-6 page-enter-2">
            <span className="block text-slate-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">Dhaka’s Premier</span>
            <span className="relative inline-block mt-1 sm:mt-2">
              <span className="animate-neon-pulse inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-200 via-emerald-400 to-lime-300 animate-text-shimmer font-black">
                Floodlit Outdoor Turf
              </span>
              <span aria-hidden="true" className="absolute -inset-x-8 -inset-y-3 bg-gradient-to-r from-emerald-500/0 via-emerald-500/25 to-emerald-500/0 blur-2xl -z-10 pointer-events-none"/>
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base md:text-lg font-normal max-w-2xl mx-auto mb-7 sm:mb-9 leading-relaxed px-3 page-enter-3">
            12 fixed 90-minute slots every day, {siteSettings.openingHours ? siteSettings.openingHours.replace(/ every day$/i, '').toLowerCase() : '6 AM to 12 AM'}. Pick any date up to {windowDays} days ahead and pay online with bKash, Nagad or card{advance > 0 ? (<> with just a <strong className="text-emerald-400">৳{advance.toLocaleString()} advance</strong></>) : ''} or the full amount. One slot, one team: no double booking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 w-full max-w-md sm:max-w-none mx-auto page-enter-3">
            <button type="button" onClick={onBookClick} className="btn-volt w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 group cursor-pointer">
              <Calendar className="w-5 h-5 text-slate-950"/>
              <span>Book Playing Slot</span>
              <ChevronRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform"/>
            </button>
            <button type="button" onClick={onTagSquadClick} className="btn-ghost w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95">
              <Users className="w-5 h-5 text-emerald-400"/>
              <span>Tag Match Squad</span>
            </button>
            <button type="button" onClick={onTournamentsClick} className="w-full sm:w-auto px-5 py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg shadow-amber-500/10">
              <Trophy className="w-5 h-5 text-amber-400"/>
              <span>{tournamentLabel}</span>
            </button>
          </div>

          {/* Live arena stats (from the database, not placeholders) */}
          <div className="max-w-3xl mx-auto glass rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-75"/>
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 text-[12px] sm:text-xs">
              <span className="uppercase tracking-wider text-emerald-400 font-extrabold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"/>
                <span>Live arena status</span>
              </span>
              <span className="text-slate-400 font-mono">{today}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3">
              {liveStats.map(s => {
                const Icon = s.icon;
                const inner = (<>
                    <Icon className="w-4 h-4 text-emerald-400 mx-auto mb-1"/>
                    <div className={`text-xl sm:text-2xl font-black font-mono ${s.tone}`}>{s.value}</div>
                    <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{s.label}</div>
                  </>);
                const cls = 'block text-center px-2 py-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-500/40 transition-colors';
                return s.href
                    ? (<a key={s.label} href={s.href} className={cls}>{inner}</a>)
                    : (<button key={s.label} type="button" onClick={s.onClick} className={`${cls} w-full cursor-pointer`}>{inner}</button>);
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-10 sm:mt-14 max-w-5xl mx-auto">
          <div className="glass glass-hover p-4 sm:p-5 rounded-2xl text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2.5">
              <Sparkles className="w-5 h-5"/>
            </div>
            <div className="text-white font-bold text-sm sm:text-base font-display">Pro Artificial Turf</div>
            <div className="text-slate-400 text-xs mt-1 leading-relaxed">50mm monofilament grass with shock-pad cushioning</div>
          </div>
          <div className="glass glass-hover p-4 sm:p-5 rounded-2xl text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2.5">
              <Clock className="w-5 h-5"/>
            </div>
            <div className="text-white font-bold text-sm sm:text-base font-display">Night Floodlights</div>
            <div className="text-slate-400 text-xs mt-1 leading-relaxed">High-mast LED floodlights for evening matches</div>
          </div>
          <div className="glass glass-hover p-4 sm:p-5 rounded-2xl text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2.5">
              <Train className="w-5 h-5"/>
            </div>
            <div className="text-white font-bold text-sm sm:text-base font-display">Direct Metro Access</div>
            <div className="text-slate-400 text-xs mt-1 leading-relaxed">{siteSettings.metroDetails || 'Beside Uttara Center Metro Station'}</div>
          </div>
          <div className="glass glass-hover p-4 sm:p-5 rounded-2xl text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2.5">
              <Shield className="w-5 h-5"/>
            </div>
            <div className="text-white font-bold text-sm sm:text-base font-display">Player Amenities</div>
            <div className="text-slate-400 text-xs mt-1 leading-relaxed">Changing room, dugouts &amp; parking</div>
          </div>
        </div>
      </div>
    </section>);
};
