'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useArena } from '../../context/ArenaContext';
import { HeroBanner } from '../../components/HeroBanner';
import { BookingSection } from '../../components/BookingSection';
import { TournamentSection } from '../../components/TournamentSection';
import { MatchTrackerSection } from '../../components/MatchTrackerSection';
import { VenueLocationSection } from '../../components/VenueLocationSection';
import { SCHEDULE_SLOTS_DEFINITION, VENUE_INFO } from '../../data/initialData';
import {
  Calendar,
  Clock,
  Sparkles,
  Trophy,
  Award,
  ShoppingBag,
  Camera,
  ArrowRight,
  CheckCircle2,
  Phone,
  Flame,
  Radio,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function ArenaHomePage() {
  const router = useRouter();
  const {
    bookings,
    tournaments,
    challenges,
    teams,
    matchResults,
    shopProducts,
    pricing,
    slotHolds,
    handleBookingSuccess,
    handleRegistrationSuccess,
    handleAddChallenge,
    setShowSquadModal,
    addToCart
  } = useArena();

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Today's 12 slots mapping
  const todaySlots = useMemo(() => {
    const now = Date.now();
    const curDate = new Date();
    const curHour = curDate.getHours();
    const curMin = curDate.getMinutes();

    return SCHEDULE_SLOTS_DEFINITION.map(slotDef => {
      const booked = bookings.find(
        b => b.date === todayStr && b.slotNumber === slotDef.slotNumber && b.paymentStatus !== 'cancelled'
      );
      const slotKey = `${todayStr}_${slotDef.slotNumber}`;
      const holding = slotHolds.find(h => h.slotKey === slotKey && h.expiresAt > now);

      const [startH, startM] = slotDef.startTime.split(':').map(Number);
      const isPast = curHour > startH || (curHour === startH && curMin >= startM);

      let status: 'available' | 'booked' | 'holding' | 'past' = 'available';
      if (booked) status = 'booked';
      else if (holding) status = 'holding';
      else if (isPast) status = 'past';

      const adminSlot = pricing.slotPrices.find(s => s.slotNumber === slotDef.slotNumber);
      const isWeekend = curDate.getDay() === 5 || curDate.getDay() === 6;
      const price = adminSlot ? (isWeekend ? adminSlot.weekendPrice : adminSlot.weekdayPrice) : slotDef.weekdayPrice;

      return {
        ...slotDef,
        status,
        bookedTeam: booked?.teamName,
        price
      };
    });
  }, [bookings, todayStr, slotHolds, pricing.slotPrices]);

  // Next free slot today
  const nextFreeSlot = useMemo(() => {
    return todaySlots.find(s => s.status === 'available');
  }, [todaySlots]);

  // Latest results
  const latestResult = matchResults[0];

  // Top 5 Scorers
  const top5Scorers = useMemo(() => {
    const allPlayers = teams.flatMap(t =>
      t.players.map(p => ({
        ...p,
        teamName: t.name,
        teamColor: t.homeColor
      }))
    );
    return allPlayers
      .filter(p => (p.goals || 0) > 0)
      .sort((a, b) => (b.goals || 0) - (a.goals || 0))
      .slice(0, 5);
  }, [teams]);

  // Featured shop items
  const featuredShopItems = useMemo(() => {
    return shopProducts.filter(p => p.featured || p.inStock).slice(0, 4);
  }, [shopProducts]);

  return (
    <>
      {/* 1. Hero Banner with "Book Now" CTA */}
      <HeroBanner
        onBookClick={() => router.push('/booking')}
        onTagSquadClick={() => setShowSquadModal(true)}
        onTournamentsClick={() => router.push('/tournaments')}
      />

      {/* 2. LIVE STRIP OF TODAY'S 12 SLOTS & NEXT FREE SLOT CALLOUT (Section 3 requirement) */}
      <section className="bg-[#080d12] border-y border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Pitch Status · Today&apos;s 12 Slots</span>
              <span className="text-slate-400 font-normal">({todayStr})</span>
            </div>

            {nextFreeSlot ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <span className="text-slate-300">Next Free Slot:</span>
                <strong className="text-emerald-400 font-bold">{nextFreeSlot.displayTime}</strong>
                <span className="text-white/30">·</span>
                <span className="text-emerald-300 font-mono font-bold">৳{nextFreeSlot.price.toLocaleString()}</span>
                <Link
                  href="/booking"
                  className="ml-1 text-[11px] font-bold text-emerald-400 hover:underline flex items-center"
                >
                  Book <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            ) : (
              <span className="text-xs text-amber-400 font-bold">All slots booked today! Check tomorrow.</span>
            )}
          </div>

          {/* 12 Slots Horizontal Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {todaySlots.map(s => {
              const isAvail = s.status === 'available';
              const isBooked = s.status === 'booked';
              const isHold = s.status === 'holding';
              const isPast = s.status === 'past';

              if (isAvail) {
                return (
                  <Link
                    key={s.slotNumber}
                    href="/booking"
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-center transition-all group cursor-pointer"
                    title={`Slot #${s.slotNumber} (${s.displayTime}) - ৳${s.price.toLocaleString()}`}
                  >
                    <div className="text-[10px] font-bold text-slate-400 font-mono">#{s.slotNumber}</div>
                    <div className="text-[11px] font-bold text-emerald-300 truncate">{s.startTime}</div>
                    <div className="text-[10px] font-mono text-emerald-400 font-extrabold">৳{s.price}</div>
                    <div className="text-[9px] font-bold text-emerald-400 uppercase mt-0.5">Free</div>
                  </Link>
                );
              }

              return (
                <div
                  key={s.slotNumber}
                  className={`p-2 rounded-xl border text-center transition-opacity ${
                    isBooked
                      ? 'bg-slate-900/60 border-white/10 opacity-70'
                      : isHold
                      ? 'bg-amber-500/10 border-amber-500/30 opacity-90'
                      : 'bg-black/30 border-white/5 opacity-40'
                  }`}
                  title={`Slot #${s.slotNumber} (${s.displayTime})`}
                >
                  <div className="text-[10px] font-mono text-slate-500">#{s.slotNumber}</div>
                  <div className="text-[11px] font-semibold text-slate-300 truncate">{s.startTime}</div>
                  <div className="text-[9px] font-bold uppercase mt-1 truncate">
                    {isBooked ? (s.bookedTeam ? s.bookedTeam.slice(0, 7) : 'Booked') : isHold ? 'Hold' : 'Passed'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Real-time Court Slot Booking Engine */}
      <BookingSection
        bookings={bookings}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* 4. TODAY'S LATEST RESULTS & TOP 5 SCORERS (Section 3 requirement) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Latest Match Result */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Trophy className="w-4 h-4" />
                <span>Latest Match Day Result</span>
              </div>
              <Link
                href="/results"
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Full Leaderboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {latestResult ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>{latestResult.courtName} · {latestResult.date}</span>
                  <span className="font-mono">{latestResult.slotDisplay}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-white/10">
                  <div className="text-base sm:text-lg font-black text-white">{latestResult.homeTeam}</div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 px-4">
                    {latestResult.homeScore} - {latestResult.awayScore}
                  </div>
                  <div className="text-base sm:text-lg font-black text-white text-right">{latestResult.awayTeam}</div>
                </div>

                {latestResult.scorers && latestResult.scorers.length > 0 && (
                  <div className="text-xs text-slate-300">
                    <span className="text-slate-400 font-semibold">Goal Scorers: </span>
                    {latestResult.scorers.map((s, idx) => (
                      <span key={idx} className="mr-2">
                        ⚽ {s.playerName} ({s.minute}&apos;)
                      </span>
                    ))}
                  </div>
                )}

                {latestResult.playerOfTheMatch && (
                  <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5 pt-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Player of the Match: {latestResult.playerOfTheMatch}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400">No match scores posted today yet.</div>
            )}
          </div>

          {/* Right Col: Top 5 Scorers */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Award className="w-4 h-4" />
                <span>Golden Boot · Top 5 Scorers</span>
              </div>
              <Link href="/results" className="text-[11px] text-slate-400 hover:text-white underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {top5Scorers.map((scorer, idx) => (
                <div
                  key={scorer.id}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-white/10 text-slate-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white">{scorer.name}</div>
                      <div className="text-[10px] text-slate-400">{scorer.teamName}</div>
                    </div>
                  </div>
                  <div className="font-mono font-black text-emerald-400 text-sm">
                    {scorer.goals} Goals
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 5. Tournaments & Championships Hub */}
      <TournamentSection
        tournaments={tournaments}
        onRegistrationSuccess={handleRegistrationSuccess}
      />

      {/* 6. FEATURED SHOP ITEMS (Section 3 requirement) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>In-House Sports Shop</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white font-display">
              Featured Turf Gear &amp; Merchandise
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Visit Full Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredShopItems.map(prod => (
            <div
              key={prod.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                {prod.badge && (
                  <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 mb-2">
                    {prod.badge}
                  </span>
                )}
                <h4 className="text-sm font-bold text-white line-clamp-2">{prod.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prod.description}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Counter Price</div>
                  <div className="text-base font-black text-emerald-400 font-mono">
                    ৳{(prod.salePrice || prod.price).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(prod, prod.sizes?.[0])}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Reserve
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. GALLERY PREVIEW (Section 3 requirement) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Camera className="w-3.5 h-3.5" />
              <span>Pitch Visuals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white font-display">
              Arena Highlights &amp; Night Atmosphere
            </h2>
          </div>
          <Link
            href="/gallery"
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Full Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { title: 'Championship Turf', tag: '7v7 Ground', url: 'https://images.unsplash.com/photo-1529900240041-22f1ff5d8793?auto=format&fit=crop&w=600&q=80' },
            { title: '400-Lux Stadium Lights', tag: 'Night Arena', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80' },
            { title: 'MRT Line-6 Viaduct', tag: 'Metro Skyline', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80' },
            { title: 'Player Dugouts', tag: 'Facilities', url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80' },
          ].map((item, idx) => (
            <Link
              key={idx}
              href="/gallery"
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/10"
            >
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">{item.tag}</span>
                <span className="text-xs font-bold text-white">{item.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. Matchday Center: Squad Match Challenges */}
      <MatchTrackerSection
        bookings={bookings}
        challenges={challenges}
        onAddChallenge={handleAddChallenge}
        onBookSlotClick={() => router.push('/booking')}
      />

      {/* 9. Location, Metro Connection & Amenities */}
      <VenueLocationSection onBookSlotClick={() => router.push('/booking')} />
    </>
  );
}
