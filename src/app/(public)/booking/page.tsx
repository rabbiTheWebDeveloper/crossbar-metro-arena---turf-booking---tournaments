'use client';

import React from 'react';
import { useArena } from '../../../context/ArenaContext';
import { BookingSection } from '../../../components/BookingSection';
import { TurfWeatherWidget } from '../../../components/TurfWeatherWidget';
import { PageHero } from '../../../components/PageHero';
import { Zap, Clock, Shield, CheckCircle2, Sun, Moon, Ticket, Footprints } from 'lucide-react';

const GUIDELINES = [
  {
    icon: Footprints,
    title: 'Footwear Guidelines',
    text: 'Turf shoes (TF) or molded rubber studs (FG/AG) recommended. Metal studs are strictly forbidden to protect the 50mm shock-pad turf.'
  },
  {
    icon: Clock,
    title: 'Slot Timing & Warm-up',
    text: 'Arrive 15 minutes before kickoff. Dugout benches and the warm-up zone are open before your slot begins.'
  },
  {
    icon: Shield,
    title: 'Payment & Cancellation',
    text: 'Pay via bKash, Nagad, card or at the counter. Reschedule up to 6 hours before kickoff from your digital pass.'
  }
];

export default function BookingPage() {
  const { bookings, handleBookingSuccess } = useArena();

  return (
    <>
      <PageHero
        crumb="Book Slot"
        eyebrow="Real-Time Slot Engine"
        eyebrowIcon={Zap}
        title="Reserve Your"
        highlight="Turf Pitch"
        description="Pick Pitch Alpha (7v7), Pitch Bravo (5v5 speed cage) or a full-arena buyout. Instant digital match pass with flexible payment options."
        stats={[
          { label: 'Open Hours', value: '6AM – 2AM', icon: Clock },
          { label: 'Day Rate', value: 'from ৳1,600', icon: Sun },
          { label: 'Night Rate', value: 'from ৳2,400', icon: Moon },
          { label: 'Your Passes', value: `${bookings.length} active`, icon: Ticket }
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
        <div className="flex items-center gap-2 mb-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-black font-display uppercase tracking-wide text-white">
            Before You Play
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {GUIDELINES.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.title} className="glass glass-hover rounded-2xl p-6">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-white font-bold text-base font-display">{g.title}</h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">{g.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
