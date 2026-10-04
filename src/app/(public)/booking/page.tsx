'use client';

import React from 'react';
import { useArena } from '../../../context/ArenaContext';
import { BookingSection } from '../../../components/BookingSection';
import { TurfWeatherWidget } from '../../../components/TurfWeatherWidget';
import { PageHero } from '../../../components/PageHero';
import { Zap, Clock, Shield, CheckCircle2, Sun, Moon, Ticket, Footprints, Calendar } from 'lucide-react';

const GUIDELINES = [
  {
    icon: Clock,
    title: '12 Slots Daily (90 Mins Each)',
    text: 'Fixed 90-minute matches from 06:00 AM to 12:00 AM Midnight. No overlapping games. One slot, one team.'
  },
  {
    icon: Shield,
    title: '৳500 Advance or Full Payment',
    text: 'Secure your slot online with bKash, Nagad, or Card. Choose between a ৳500 advance (pay rest at counter) or 100% full online clearance.'
  },
  {
    icon: Calendar,
    title: '60-Day Advance Booking Window',
    text: 'Pick any match date up to 60 days in advance. Weekend rates (Friday & Saturday) apply automatically.'
  },
  {
    icon: Footprints,
    title: 'Turf Footwear Guidelines',
    text: 'Turf shoes (TF) or rubber molded studs (AG) required. Metal studs strictly forbidden on 50mm shock-pad turf.'
  }
];

export default function BookingPage() {
  const { bookings, handleBookingSuccess } = useArena();

  return (
    <>
      <PageHero
        crumb="Book Slot"
        eyebrow="Official Crossbar Booking Engine"
        eyebrowIcon={Zap}
        title="Reserve Your"
        highlight="90-Min Turf Slot"
        description="12 slots daily, 90 minutes each, from 6 AM to 12 AM. Pick any date up to 60 days ahead. Pay online with bKash, Nagad, or Card (৳500 advance or full)."
        stats={[
          { label: 'Schedule', value: '12 Slots / Day', icon: Clock },
          { label: 'Match Time', value: '90 Mins', icon: Zap },
          { label: 'Advance Window', value: 'Up to 60 Days', icon: Calendar },
          { label: 'Online Advance', value: '৳500 or Full', icon: Shield }
        ]}
      />

      {/* Live weather */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <TurfWeatherWidget />
      </div>

      <BookingSection
        bookings={bookings}
        onBookingSuccess={handleBookingSuccess}
        hideHeading
      />

      {/* Guidelines */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
            <Shield className="w-4 h-4" />
            <span>Crossbar Arena Match Day Regulations</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 font-display">
            Official Booking Policies & Turf Ground Rules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {GUIDELINES.map((g, idx) => {
              const Icon = g.icon;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5">{g.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{g.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
