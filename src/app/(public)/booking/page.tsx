'use client';

import React from 'react';
import { useArena } from '../../../context/ArenaContext';
import { BookingSection } from '../../../components/BookingSection';
import { TurfWeatherWidget } from '../../../components/TurfWeatherWidget';
import { COURTS } from '../../../data/initialData';
import { Calendar, Shield, Sparkles, Clock, CheckCircle2, Zap } from 'lucide-react';

export default function BookingPage() {
  const { bookings, handleBookingSuccess } = useArena();

  return (
    <div className="py-8 md:py-12">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Real-Time Slot Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight text-white">
              Reserve Your Turf Pitch
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-2xl">
              Select between Pitch Alpha (7v7), Pitch Bravo (5v5 speed cage), or Full Arena buyout. Instant digital match pass generation with flexible payment options.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3 px-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-mono">Operating Hours</div>
                <div className="text-sm font-bold text-white">06:00 AM - 02:00 AM (Daily)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Weather & Turf Condition Widget */}
        <div className="mt-6">
          <TurfWeatherWidget />
        </div>
      </div>

      {/* Main Booking Engine */}
      <BookingSection
        bookings={bookings}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Turf Guidelines & Policies */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-white font-bold text-base font-display">Footwear Guidelines</h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              Turf shoes (TF) or molded rubber studs (FG/AG) are recommended. Metal studs are strictly forbidden to preserve the FIFA-grade 50mm monofilament shock-pad turf.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-white font-bold text-base font-display">Slot Timing &amp; Warmup</h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              Arrive at the arena at least 15 minutes before your scheduled kickoff time. Dugout benches and warmup stretch areas are accessible before your match starts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-white font-bold text-base font-display">Payment &amp; Cancellation</h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              Secure your slot via bKash, Nagad, card, or pay at counter. Rescheduling requests can be made up to 6 hours before kickoff through your digital match pass.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
