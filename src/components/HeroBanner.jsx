'use client';
import React, { useState, useEffect } from 'react';
import { CrossbarLogo } from './CrossbarLogo';
import { Calendar, Users, Trophy, Sparkles, Shield, Clock, Flame, Train, ChevronRight, Zap } from 'lucide-react';
export const HeroBanner = ({ onBookClick, onTagSquadClick, onTournamentsClick }) => {
    // Opening Launch Countdown
    const [timeLeft, setTimeLeft] = useState({ days: 18, hours: 14, minutes: 35, seconds: 20 });
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0)
                    return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0)
                    return { ...prev, minutes: 59, seconds: 59 };
                if (prev.hours > 0)
                    return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                if (prev.days > 0)
                    return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    return (<section className="relative overflow-hidden pt-8 pb-14 sm:pt-12 sm:pb-20 md:pt-16 md:pb-28 bg-[#070b0e]">
      {/* 1. DYNAMIC ANIMATED STADIUM FLOODLIGHT BEAMS */}
      {/* Top-Left High-Mast Floodlight Beam */}
      <div className="absolute -top-12 -left-20 w-[450px] sm:w-[750px] h-[500px] sm:h-[750px] pointer-events-none animate-floodlight-left z-0">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(52,211,153,0.35)_0%,rgba(16,185,129,0.12)_35%,transparent_70%)] blur-[40px] sm:blur-[60px]"/>
      </div>

      {/* Top-Right High-Mast Floodlight Beam */}
      <div className="absolute -top-12 -right-20 w-[450px] sm:w-[750px] h-[500px] sm:h-[750px] pointer-events-none animate-floodlight-right z-0">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.32)_0%,rgba(16,185,129,0.10)_35%,transparent_70%)] blur-[40px] sm:blur-[60px]"/>
      </div>

      {/* Center Stadium Floodlight Halo & Volumetric Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[850px] h-[350px] sm:h-[450px] bg-gradient-to-b from-emerald-500/20 via-emerald-400/10 to-transparent rounded-full blur-[100px] sm:blur-[140px] pointer-events-none z-0"/>
      <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[600px] sm:w-[950px] h-[250px] bg-emerald-500/15 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none z-0"/>

      {/* Floating Stadium Motes / Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <span className="absolute top-20 left-[18%] w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-ping" style={{ animationDuration: '3s' }}/>
        <span className="absolute top-36 right-[22%] w-2 h-2 rounded-full bg-green-300/70 animate-ping" style={{ animationDuration: '4s' }}/>
        <span className="absolute top-1/2 left-[12%] w-1 h-1 rounded-full bg-emerald-300/80 animate-ping" style={{ animationDuration: '2.5s' }}/>
        <span className="absolute top-2/3 right-[15%] w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-ping" style={{ animationDuration: '3.5s' }}/>
      </div>

      {/* Pitch Grid Overlay */}
      <div className="absolute inset-0 pitch-grid pointer-events-none z-0"/>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Animated Status Pill */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-5 sm:mb-7 page-enter">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg shadow-emerald-500/10">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90"/>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#34d399]"/>
            </span>
            <span className="font-extrabold text-emerald-400 tracking-wider text-[11px] sm:text-xs uppercase">
              12 DAILY SLOTS · 90 MINS EACH · ৳500 ADVANCE
            </span>
            <span className="text-slate-500 hidden xs:inline">·</span>
            <span className="text-slate-200 hidden sm:inline">bookcrossbar.com ⚽ 🏗️</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] sm:text-xs font-semibold backdrop-blur-md">
            <Train className="w-3.5 h-3.5 text-emerald-400"/>
            <span>Uttara Metro Center · MRT Line-6</span>
          </div>
        </div>

        {/* Hero Title & Identity */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo with Subtle Float */}
          <div className="flex justify-center mb-4 sm:mb-6 page-enter float-slow">
            <CrossbarLogo size="lg"/>
          </div>

          {/* MAIN ANIMATED HEADLINE: "Dhaka’s Premier Floodlit Outdoor Turf" */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase font-display leading-[1.05] mb-4 sm:mb-6 page-enter-2">
            <span className="block text-slate-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              Dhaka’s Premier
            </span>
            <span className="relative inline-block mt-1 sm:mt-2">
              {/* Shimmering Animated Text with Neon Bloom */}
              <span className="animate-neon-pulse inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-200 via-emerald-400 to-lime-300 animate-text-shimmer font-black">
                Floodlit Outdoor Turf
              </span>
              {/* Ambient volumetric backlight glow */}
              <span aria-hidden="true" className="absolute -inset-x-8 -inset-y-3 bg-gradient-to-r from-emerald-500/0 via-emerald-500/25 to-emerald-500/0 blur-2xl -z-10 pointer-events-none"/>
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base md:text-lg font-normal max-w-2xl mx-auto mb-7 sm:mb-9 leading-relaxed px-3 page-enter-3">
            12 fixed 90-minute slots daily from 6 AM to 12 AM. Pick any date up to 60 days ahead. Pay online with bKash, Nagad or card with just a <strong className="text-emerald-400">৳500 advance</strong> or full clearance. Strict no double-booking guarantee.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 w-full max-w-md sm:max-w-none mx-auto page-enter-3">
            <button onClick={onBookClick} className="btn-volt w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 group cursor-pointer">
              <Calendar className="w-5 h-5 text-slate-950"/>
              <span>Book Playing Slot</span>
              <ChevronRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform"/>
            </button>

            <button onClick={onTagSquadClick} className="btn-ghost w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95">
              <Users className="w-5 h-5 text-emerald-400"/>
              <span>Tag Match Squad</span>
            </button>

            <button onClick={onTournamentsClick} className="w-full sm:w-auto px-5 py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg shadow-amber-500/10">
              <Trophy className="w-5 h-5 text-amber-400"/>
              <span>Tournaments (৳60K+ Prize)</span>
            </button>
          </div>

          {/* Launch Countdown & Construction Tracker Card */}
          <div className="max-w-3xl mx-auto glass glass-hover rounded-2xl p-4 sm:p-6 md:p-7 shadow-2xl relative overflow-hidden">
            {/* Top ambient line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-75"/>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-white/10">
              <div className="text-center sm:text-left flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Flame className="w-5 h-5 text-emerald-400 animate-pulse"/>
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs uppercase tracking-wider text-emerald-400 font-extrabold flex items-center gap-1.5 justify-center sm:justify-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"/>
                    <span>Launch Phase 1</span>
                  </div>
                  <div className="text-white font-bold text-xs sm:text-base">Inaugural Kickoff & Early Slot Access</div>
                </div>
              </div>

              {/* Countdown Digits */}
              <div className="flex items-center gap-1 sm:gap-1.5 font-mono">
                <div className="text-center px-2 sm:px-3 py-1.5 sm:py-2 bg-black/60 rounded-xl border border-white/10 min-w-[42px] sm:min-w-[52px] shadow-inner">
                  <span className="text-base sm:text-xl md:text-2xl font-black text-emerald-400">{timeLeft.days}</span>
                  <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-sans font-bold">Days</span>
                </div>
                <span className="text-emerald-400 font-bold text-sm sm:text-base">:</span>
                <div className="text-center px-2 sm:px-3 py-1.5 sm:py-2 bg-black/60 rounded-xl border border-white/10 min-w-[42px] sm:min-w-[52px] shadow-inner">
                  <span className="text-base sm:text-xl md:text-2xl font-black text-emerald-400">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-sans font-bold">Hours</span>
                </div>
                <span className="text-emerald-400 font-bold text-sm sm:text-base">:</span>
                <div className="text-center px-2 sm:px-3 py-1.5 sm:py-2 bg-black/60 rounded-xl border border-white/10 min-w-[42px] sm:min-w-[52px] shadow-inner">
                  <span className="text-base sm:text-xl md:text-2xl font-black text-emerald-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-sans font-bold">Mins</span>
                </div>
                <span className="text-emerald-400 font-bold text-sm sm:text-base">:</span>
                <div className="text-center px-2 sm:px-3 py-1.5 sm:py-2 bg-black/60 rounded-xl border border-white/10 min-w-[42px] sm:min-w-[52px] shadow-inner">
                  <span className="text-base sm:text-xl md:text-2xl font-black text-emerald-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-sans font-bold">Secs</span>
                </div>
              </div>
            </div>

            {/* Construction Progress Bar */}
            <div className="pt-4">
              <div className="flex justify-between items-center text-xs text-slate-300 mb-2">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="text-amber-400">🏗️</span>
                  <span className="truncate">Foundation Poured: <strong className="text-emerald-300">85% Complete</strong></span>
                </span>
                <span className="text-emerald-400 font-bold shrink-0 ml-2 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5"/>
                  <span>Turf Laying Next</span>
                </span>
              </div>
              <div className="w-full h-2.5 sm:h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-lime-300 rounded-full w-[85%] transition-all duration-500 relative shadow-[0_0_12px_rgba(16,185,129,0.8)]">
                  <div className="absolute top-0 right-0 bottom-0 w-2.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_#fff]"/>
                </div>
              </div>
              <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 mt-2 font-medium">
                <span>Site Prep</span>
                <span className="text-emerald-300 font-semibold">Fence &amp; LED Masts</span>
                <span className="hidden sm:inline">FIFA Turf Carpet</span>
                <span>Grand Opening</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Badges Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-10 sm:mt-14 max-w-5xl mx-auto">
          <div className="glass glass-hover p-4 sm:p-5 rounded-2xl text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2.5">
              <Sparkles className="w-5 h-5"/>
            </div>
            <div className="text-white font-bold text-sm sm:text-base font-display">FIFA Quality Pro Turf</div>
            <div className="text-slate-400 text-xs mt-1 leading-relaxed">50mm monofilament with shock-pad cushioning</div>
          </div>

          <div className="glass glass-hover p-4 sm:p-5 rounded-2xl text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2.5">
              <Clock className="w-5 h-5"/>
            </div>
            <div className="text-white font-bold text-sm sm:text-base font-display">400-Lux Night Match</div>
            <div className="text-slate-400 text-xs mt-1 leading-relaxed">Pro stadium high-mast floodlights for day-like vision</div>
          </div>

          <div className="glass glass-hover p-4 sm:p-5 rounded-2xl text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2.5">
              <Train className="w-5 h-5"/>
            </div>
            <div className="text-white font-bold text-sm sm:text-base font-display">Direct Metro Access</div>
            <div className="text-slate-400 text-xs mt-1 leading-relaxed">Uttara Metro Center, Sec 17, 2 min walk from station</div>
          </div>

          <div className="glass glass-hover p-4 sm:p-5 rounded-2xl text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2.5">
              <Shield className="w-5 h-5"/>
            </div>
            <div className="text-white font-bold text-sm sm:text-base font-display">Full Amenities</div>
            <div className="text-slate-400 text-xs mt-1 leading-relaxed">Changing rooms, prayer zone, dugouts &amp; parking</div>
          </div>
        </div>
      </div>
    </section>);
};
