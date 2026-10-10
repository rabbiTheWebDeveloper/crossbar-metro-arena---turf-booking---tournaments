'use client';
import React from 'react';
import { PageHero } from '../../../components/PageHero';
import { VenueLocationSection } from '../../../components/VenueLocationSection';
import { useArena } from '../../../context/ArenaContext';
import { Info, MapPin, Train, ShieldCheck, Clock, CheckCircle2, Calendar } from 'lucide-react';
import Link from 'next/link';
export default function AboutPage() {
    const { pricing } = useArena();
    return (<>
      <PageHero crumb="About Venue" eyebrow="Dhaka's Premier Sports Destination" eyebrowIcon={Info} title="Crossbar Metro" highlight="Arena & Pitches" description="Built for football lovers right next to Uttara Center Metro Station. 12 daily 90-minute slots, professional 400-lux stadium floodlights, and seamless online booking." stats={[
            { label: 'Location', value: 'Sector 17, Uttara', icon: MapPin },
            { label: 'Metro Station', value: 'Uttara Center MRT-6', icon: Train },
            { label: 'Daily Slots', value: '12 Slots (90 Min)', icon: Clock },
            { label: 'Turf Spec', value: '50mm Shock-Pad', icon: ShieldCheck }
        ]}/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              The Crossbar Vision
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white font-display">
              Elevating Dhaka’s Turf Football Experience
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Crossbar Metro Arena was established with a clear mission: to provide Dhaka’s footballers with an uncompromising, professional pitch experience. Situated adjacent to the MRT Line-6 viaduct at Sector 17 Uttara, players can step off the rapid transit train and onto FIFA-grade 50mm shock-pad grass in under two minutes.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              We operate strictly on fixed 90-minute slots to ensure every team enjoys a proper, fulfilling match. With automated digital booking, ৳500 advance lock-in, and zero double booking guarantee, Crossbar Metro Arena is your squad’s true home ground.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-emerald-400 font-bold text-sm">400-Lux Lighting</div>
                <div className="text-[11px] text-slate-400">Zero-shadow stadium floodlights</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-emerald-400 font-bold text-sm">2-Min Metro Walk</div>
                <div className="text-[11px] text-slate-400">Directly beside Uttara Center Station</div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">
              Official Facilities &amp; Specifications
            </h3>
            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
                <span><strong>Championship 7v7 Ground:</strong> 120ft x 75ft FIFA-standard artificial turf with monofilament fibers and cool rubber infill.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
                <span><strong>Player Dugouts:</strong> Covered team benches, electronic digital scoreboard, match clock, and warm-up stretching deck.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
                <span><strong>Changing Rooms &amp; Restrooms:</strong> Clean showers, lockers, and restroom facilities with regular daily sanitation.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
                <span><strong>In-House Sports Shop &amp; Hydration:</strong> On-site barista cafe, electrolyte coolers, FIFA match balls, shin guards, and anti-slip grip socks.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* FULL 12-SLOT PRICE TABLE (Section 3 requirement) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5"/>
                <span>Official Rate Card</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white font-display">
                Full 12-Slot Price Table · Weekday vs Weekend
              </h2>
              <p className="text-xs text-slate-400">
                Weekday (Sun – Thu) &amp; Weekend (Fri &amp; Sat). Lock in your slot with just ৳500 advance.
              </p>
            </div>

            <Link href="/booking" className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-500/20 self-start sm:self-auto">
              Book Any Slot Now
            </Link>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Slot #</th>
                  <th className="py-3 px-4">Match Kickoff Time</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 font-bold text-white">Weekday Rate (Sun–Thu)</th>
                  <th className="py-3 px-4 font-bold text-emerald-400">Weekend Rate (Fri–Sat)</th>
                  <th className="py-3 px-4 text-right">Online Advance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {pricing.slotPrices.map(s => (<tr key={s.slotNumber} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">#{s.slotNumber}</td>
                    <td className="py-3 px-4 font-sans font-bold text-white">{s.displayTime}</td>
                    <td className="py-3 px-4 font-sans uppercase text-[10px] font-bold text-slate-400">
                      {s.period}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-bold">
                      ৳{s.weekdayPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      ৳{s.weekendPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-sans">
                      ৳{pricing.advanceAmount || 500}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Venue Location Section */}
        <VenueLocationSection />
      </div>
    </>);
}
