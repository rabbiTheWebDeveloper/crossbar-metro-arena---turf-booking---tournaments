import React, { useState, useEffect } from 'react';
import { VENUE_INFO } from '../data/initialData';
import { CrossbarLogo } from './CrossbarLogo';
import { Calendar, Users, Trophy, Sparkles, Shield, Clock, Flame, Train, ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  onBookClick: () => void;
  onTagSquadClick: () => void;
  onTournamentsClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onBookClick,
  onTagSquadClick,
  onTournamentsClick
}) => {
  // Opening Launch Countdown
  const [timeLeft, setTimeLeft] = useState({ days: 18, hours: 14, minutes: 35, seconds: 20 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16 md:pt-14 md:pb-24 bg-[#070b0e]">
      {/* Stadium Floodlight Visual Effects */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[300px] sm:w-[500px] h-[250px] sm:h-[350px] bg-emerald-500/10 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 translate-x-1/2 w-[300px] sm:w-[500px] h-[250px] sm:h-[350px] bg-green-500/10 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] h-[200px] sm:h-[250px] bg-emerald-500/15 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none"></div>

      {/* Grid line overlay representing sports turf pitch markings */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Teaser Announcement Pill */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs md:text-sm font-medium backdrop-blur-sm">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-400">FOUNDATIONS GOING DOWN</span>
            <span className="text-slate-500 hidden xs:inline">·</span>
            <span className="text-slate-200">Game Day Coming Up! 🏗️ ⚽ 🔥</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] sm:text-xs font-medium">
            <Train className="w-3 h-3 text-emerald-400" />
            <span>Uttara Metro Center · MRT Line-6</span>
          </div>
        </div>

        {/* Hero Title & Identity */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-3 sm:mb-5">
            <CrossbarLogo size="lg" />
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight uppercase font-display leading-[1.1] mb-3 sm:mb-5">
            Dhaka’s Premier <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500">Floodlit Outdoor Turf</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-base md:text-lg font-normal max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
            FIFA-grade shock-pad football turf with panoramic views of the Dhaka Metro Rail. Reserve your match slots, tag your squad, and battle in high-stakes tournaments.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 mb-8 sm:mb-10 w-full max-w-md sm:max-w-none mx-auto">
            <button
              onClick={onBookClick}
              className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-extrabold text-xs sm:text-sm md:text-base bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              <span>Book Playing Slot</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onTagSquadClick}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm md:text-base bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span>Tag Match Squad</span>
            </button>

            <button
              onClick={onTournamentsClick}
              className="w-full sm:w-auto px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm md:text-base bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span>Tournaments (৳60K+ Prize)</span>
            </button>
          </div>

          {/* Launch Countdown & Construction Tracker Card */}
          <div className="max-w-3xl mx-auto bg-gradient-to-b from-slate-900/90 to-[#0d161d]/90 border border-white/10 rounded-2xl p-4 sm:p-5 md:p-6 backdrop-blur-md shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-white/10">
              <div className="text-center sm:text-left flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-400 font-bold">Launch Phase 1</div>
                  <div className="text-white font-bold text-xs sm:text-base">Inaugural Kickoff & Early Slot Access</div>
                </div>
              </div>

              {/* Countdown Digits */}
              <div className="flex items-center gap-1 sm:gap-1.5 font-mono">
                <div className="text-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-black/40 rounded-lg border border-white/5 min-w-[38px] sm:min-w-[48px]">
                  <span className="text-sm sm:text-lg md:text-xl font-black text-emerald-400">{timeLeft.days}</span>
                  <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-sans">Days</span>
                </div>
                <span className="text-emerald-400 font-bold text-xs sm:text-base">:</span>
                <div className="text-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-black/40 rounded-lg border border-white/5 min-w-[38px] sm:min-w-[48px]">
                  <span className="text-sm sm:text-lg md:text-xl font-black text-emerald-400">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-sans">Hours</span>
                </div>
                <span className="text-emerald-400 font-bold text-xs sm:text-base">:</span>
                <div className="text-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-black/40 rounded-lg border border-white/5 min-w-[38px] sm:min-w-[48px]">
                  <span className="text-sm sm:text-lg md:text-xl font-black text-emerald-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-sans">Mins</span>
                </div>
                <span className="text-emerald-400 font-bold text-xs sm:text-base">:</span>
                <div className="text-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-black/40 rounded-lg border border-white/5 min-w-[38px] sm:min-w-[48px]">
                  <span className="text-sm sm:text-lg md:text-xl font-black text-emerald-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase font-sans">Secs</span>
                </div>
              </div>
            </div>

            {/* Construction Progress Bar */}
            <div className="pt-3 sm:pt-4">
              <div className="flex justify-between items-center text-[11px] sm:text-xs text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="text-amber-400">🏗️</span>
                  <span className="truncate">Foundation Poured: <strong>85% Complete</strong></span>
                </span>
                <span className="text-emerald-400 font-semibold shrink-0 ml-2">Turf Laying Next</span>
              </div>
              <div className="w-full h-2 sm:h-2.5 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 rounded-full w-[85%] transition-all duration-500 relative">
                  <div className="absolute top-0 right-0 bottom-0 w-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-[9px] sm:text-[11px] text-slate-400 mt-1.5">
                <span>Site Prep</span>
                <span className="text-emerald-300 font-medium">Fence & LED Masts</span>
                <span className="hidden sm:inline">FIFA Turf Carpet</span>
                <span>Grand Opening</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Badges Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-8 sm:mt-12 max-w-5xl mx-auto">
          <div className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all text-left">
            <div className="text-emerald-400 mb-1.5 sm:mb-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-white font-bold text-xs sm:text-sm md:text-base">FIFA Quality Pro Turf</div>
            <div className="text-slate-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">50mm monofilament with shock-pad cushioning</div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all text-left">
            <div className="text-emerald-400 mb-1.5 sm:mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-white font-bold text-xs sm:text-sm md:text-base">400-Lux Night Match</div>
            <div className="text-slate-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Pro stadium high-mast floodlights for day-like vision</div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all text-left">
            <div className="text-emerald-400 mb-1.5 sm:mb-2">
              <Train className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-white font-bold text-xs sm:text-sm md:text-base">Direct Metro Access</div>
            <div className="text-slate-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Uttara Metro Center, Sec 17, 2 min walk from station</div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all text-left">
            <div className="text-emerald-400 mb-1.5 sm:mb-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-white font-bold text-xs sm:text-sm md:text-base">Full Amenities</div>
            <div className="text-slate-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Changing rooms, prayer zone, dugouts & parking</div>
          </div>
        </div>
      </div>
    </section>
  );
};
