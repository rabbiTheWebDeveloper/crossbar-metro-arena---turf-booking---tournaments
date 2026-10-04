'use client';

import React from 'react';
import { PageHero } from '../../../components/PageHero';
import { VENUE_INFO } from '../../../data/initialData';
import { VenueLocationSection } from '../../../components/VenueLocationSection';
import { Info, MapPin, Train, ShieldCheck, Clock, Award, Phone, Mail, Globe, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumb="About Venue"
        eyebrow="Dhaka's Premier Sports Destination"
        eyebrowIcon={Info}
        title="Crossbar Metro"
        highlight="Arena Story"
        description="Built for football lovers right next to Uttara Center Metro Station. 12 daily 90-minute slots, professional 400-lux stadium floodlights, and seamless online booking."
        stats={[
          { label: 'Location', value: 'Sector 17, Uttara', icon: MapPin },
          { label: 'Metro Station', value: 'Uttara Center MRT-6', icon: Train },
          { label: 'Daily Slots', value: '12 Slots (90 Min)', icon: Clock },
          { label: 'Turf Spec', value: '50mm Shock-Pad', icon: ShieldCheck }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              The Crossbar Vision
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white font-display">
              Elevating Dhaka’s Turf Football Experience
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Crossbar Metro Arena was established with a single mission: to provide Dhaka’s footballers with an uncompromising, professional small-sided pitch experience. Situated adjacent to the MRT Line-6 viaduct at Sector 17 Uttara, players can step off the rapid transit train and onto FIFA-grade 50mm shock-pad grass in under two minutes.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              We operate strictly on fixed 90-minute slots to ensure every team enjoys a proper, fulfilling match. With automated digital booking, ৳500 advance lock-in, and zero double booking guarantee, Crossbar Metro Arena is your squad’s true home ground.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-emerald-400 font-bold text-sm">400-Lux Lighting</div>
                <div className="text-[11px] text-slate-400">Zero-shadow floodlights for night games</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-emerald-400 font-bold text-sm">2-Min Metro Walk</div>
                <div className="text-[11px] text-slate-400">Directly beside Uttara Center Station</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white font-display">Key Arena Specifications</h3>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Pitch Alpha (7v7):</strong> 120ft x 75ft FIFA-standard small-sided artificial turf with monofilament fibers and cool rubber infill.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Pitch Bravo (5v5 Speed Cage):</strong> 90ft x 55ft high-tempo pitch with perimeter rebound boards for nonstop play.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Player Dugouts:</strong> Covered team benches, digital scoreboard, and warm-up stretching zone.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Changing Rooms:</strong> Clean showers, lockers, and restroom facilities with regular sanitation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Arena Cafe & Shop:</strong> On-site barista coffee, chilled isotonic drinks, FIFA match balls, and grip socks.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Venue Location Section */}
        <VenueLocationSection />
      </div>
    </>
  );
}
