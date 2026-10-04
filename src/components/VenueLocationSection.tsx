'use client';

import React, { useState } from 'react';
import { VENUE_INFO } from '../data/initialData';
import { MapPin, Phone, Mail, Globe, Train, Car, Shield, Sparkles, Coffee, Clock, CheckCircle2, MessageSquare, CloudSun } from 'lucide-react';
import { TurfWeatherWidget } from './TurfWeatherWidget';

interface VenueLocationSectionProps {
  onBookSlotClick?: () => void;
  hideHeading?: boolean;
}

export const VenueLocationSection: React.FC<VenueLocationSectionProps> = ({ onBookSlotClick, hideHeading = false }) => {
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone) return;
    setSent(true);
    setTimeout(() => {
      setInquiryName('');
      setInquiryPhone('');
      setInquiryMsg('');
    }, 1500);
  };

  const amenities = [
    {
      title: 'Direct Metro Rail Connectivity',
      desc: 'Located adjacent to Uttara Center Metro Station (MRT Line-6). Exit the concourse and walk 2 minutes to the arena entrance.',
      icon: Train,
      badge: '2 Min Walk'
    },
    {
      title: '400-Lux High-Mast Floodlights',
      desc: 'Even, glare-free stadium illumination tested for nighttime competitive matches and 4K video recording.',
      icon: Sparkles,
      badge: 'Night Vision'
    },
    {
      title: 'Players Locker & Showers',
      desc: 'Clean, sanitized changing cabins, private lockers, and fresh shower facilities for both squads.',
      icon: Shield,
      badge: 'Sanitized'
    },
    {
      title: 'Refreshment Lounge & Cafe',
      desc: 'Chilled energy drinks, electrolytes, fresh juices, and hot coffee available trackside.',
      icon: Coffee,
      badge: 'Lounge'
    },
    {
      title: 'Dedicated Prayer Area',
      desc: 'Spacious, clean, dedicated prayer hall (Namaz space) with ablution (Wudu) facility.',
      icon: CheckCircle2,
      badge: 'Ablution Ready'
    },
    {
      title: 'Guarded Vehicle Parking',
      desc: 'Spacious on-site secure parking for cars and motorbikes with CCTV surveillance.',
      icon: Car,
      badge: 'Free Parking'
    }
  ];

  return (
    <section id="location" className="py-10 sm:py-16 md:py-24 bg-[#070b0e] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        {!hideHeading && (
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2.5 sm:mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>Prime Uttara Location</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display uppercase tracking-tight">
              How to Reach &amp; Venue Amenities
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm md:text-base mt-2 px-2">
              Uttara Metro Center, Sector 17, Dhaka-1230. The most easily accessible football turf in Dhaka via Metro Rail.
            </p>
          </div>
        )}

        {/* Metro Highlight Banner */}
        <div className="mb-8 sm:mb-12 p-4 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-[#0e1620] border border-emerald-500/30 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6 relative z-10">
            <div className="space-y-2.5 sm:space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <Train className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                <span>Dhaka Metro Rail (MRT Line-6)</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white font-display uppercase">
                Beat the Dhaka Traffic. Ride the Metro Straight to the Turf.
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Take the Metro to <strong className="text-emerald-400">Uttara Center Station</strong>. Hop off, descend the escalator, and you are right at the Crossbar Metro Arena gates at Sector 17. No gridlocks, no stress—just pristine turf football under the sky.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <a
                href="https://maps.google.com/?q=Uttara+Metro+Center+Sector+17+Dhaka"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm text-center shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Open in Google Maps</span>
              </a>

              <a
                href={VENUE_INFO.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-white border border-[#1877F2]/40 font-semibold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2"
              >
                <span>Follow on Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Real-time Turf Weather Widget */}
        <div className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <CloudSun className="w-4 h-4 text-emerald-400" />
              <span>Matchday Weather & Turf Playability Telemetry</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">Uttara, Dhaka (23.8762°N, 90.3792°E)</span>
          </div>

          <TurfWeatherWidget onBookSlotClick={onBookSlotClick} />
        </div>

        {/* Venue Amenities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {amenities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 font-mono">
                      {item.badge}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-display mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact & Arena Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details Card */}
          <div className="lg:col-span-6 bg-gradient-to-b from-slate-900 to-[#0b1016] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono mb-1">
                Official Contacts
              </div>
              <h3 className="text-2xl font-black text-white font-display uppercase">
                Crossbar Metro Arena
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                For regular slot bookings, corporate leagues, sponsorship, and private turf rentals.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-400 text-[11px] uppercase font-semibold">Location & Address</div>
                  <div className="text-white font-medium mt-0.5">{VENUE_INFO.address}</div>
                  <div className="text-emerald-400 text-xs mt-0.5 font-medium">{VENUE_INFO.metroDetails}</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-400 text-[11px] uppercase font-semibold">Hotline & Bookings</div>
                  <a href={`tel:${VENUE_INFO.phone}`} className="text-white font-bold text-base hover:text-emerald-400 transition-colors">
                    {VENUE_INFO.phone}
                  </a>
                  <div className="text-slate-400 text-xs mt-0.5">Available 24/7 on Call & WhatsApp</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-400 text-[11px] uppercase font-semibold">Email Enquiries</div>
                  <a href={`mailto:${VENUE_INFO.email}`} className="text-white font-medium hover:text-emerald-400 transition-colors">
                    {VENUE_INFO.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-400 text-[11px] uppercase font-semibold">Web & Social</div>
                  <div className="text-white font-medium flex items-center gap-3 mt-1">
                    <span className="text-emerald-300 font-mono">{VENUE_INFO.website}</span>
                    <span>·</span>
                    <a
                      href={VENUE_INFO.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      facebook.com/crossbarmetroarena
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={VENUE_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Instant WhatsApp Inquiry</span>
              </a>

              <a
                href={`tel:${VENUE_INFO.phone}`}
                className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/10 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call Hotline</span>
              </a>
            </div>
          </div>

          {/* Quick Message / Feedback Form */}
          <div className="lg:col-span-6 bg-gradient-to-b from-slate-900 to-[#0b1016] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono mb-1">
                Fast Message
              </div>
              <h3 className="text-2xl font-black text-white font-display uppercase mb-2">
                Need a Custom Slot or Tournament?
              </h3>
              <p className="text-slate-400 text-xs mb-6">
                Leave your number and requirements. The Crossbar Metro Arena team will get back to you within 30 minutes.
              </p>

              {sent ? (
                <div className="p-6 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-center text-emerald-300 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="font-bold text-white text-base">Inquiry Received!</div>
                  <p className="text-xs text-slate-300">Our arena desk is reviewing your request and will call you back shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shakib Ahmed"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Contact Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="01796-337133"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Inquiry / Booking Requirements</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Want to book 2 hours on Friday night for corporate match with referee..."
                      value={inquiryMsg}
                      onChange={(e) => setInquiryMsg(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    Send Fast Inquiry
                  </button>
                </form>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-[11px] text-slate-400">
              <span>Operating Hours: 06:00 AM - 02:00 AM Daily</span>
              <span className="text-emerald-400 font-medium">24/7 Power Backup</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
