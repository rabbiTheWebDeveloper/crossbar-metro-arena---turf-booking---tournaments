'use client';
import React, { useState } from 'react';
import { useArena, cleanPhone } from '../context/ArenaContext';
import { MapPin, Phone, Mail, Globe, Train, Car, Shield, Sparkles, CheckCircle2, MessageSquare, CloudSun, Layers } from 'lucide-react';
import { TurfWeatherWidget } from './TurfWeatherWidget';

/** Digits for a wa.me link from a settings WhatsApp URL or phone number. */
const whatsappDigits = (settings) => {
    const fromUrl = String(settings.whatsappUrl || '').match(/wa\.me\/(\d+)/);
    if (fromUrl) return fromUrl[1];
    const p = cleanPhone(settings.phone);
    return p ? `88${p}` : '';
};

export const VenueLocationSection = ({ onBookSlotClick, hideHeading = false }) => {
    const { siteSettings, showNotice } = useArena();
    const [inquiryName, setInquiryName] = useState('');
    const [inquiryPhone, setInquiryPhone] = useState('');
    const [inquiryMsg, setInquiryMsg] = useState('');
    const telHref = siteSettings.phone ? `tel:${cleanPhone(siteSettings.phone)}` : null;
    const waDigits = whatsappDigits(siteSettings);
    const mapsUrl = siteSettings.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(siteSettings.address || 'Crossbar Metro Arena, Uttara, Dhaka')}`;

    // The "fast message" form hands the text to WhatsApp; nothing is stored or "sent" from here.
    const handleSendInquiry = (e) => {
        e.preventDefault();
        if (!inquiryName.trim() || !inquiryPhone.trim()) return;
        if (!waDigits) { showNotice('error', 'WhatsApp contact is not configured yet. Please call the arena instead.'); return; }
        const text = `Hi Crossbar Metro Arena, this is ${inquiryName.trim()} (${inquiryPhone.trim()}).\n${inquiryMsg.trim() || 'I would like to ask about booking a slot.'}`;
        window.open(`https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
        showNotice('info', 'WhatsApp opened with your message. Tap send to deliver it to the arena desk.');
    };

    const amenities = [
        { title: 'Direct Metro Rail Connectivity', desc: siteSettings.metroDetails || 'Beside Uttara Center Metro Station (MRT Line-6).', icon: Train, badge: 'Metro' },
        { title: 'High-Mast LED Floodlights', desc: 'Even, glare-free illumination for evening and night matches.', icon: Sparkles, badge: 'Night play' },
        { title: 'Shock-Pad Artificial Turf', desc: '50mm monofilament artificial grass with shock-pad cushioning and fast drainage.', icon: Layers, badge: 'Pro turf' },
        { title: 'Changing Room', desc: 'A changing room for both squads to get kitted up before kickoff.', icon: Shield, badge: 'Players' },
        { title: 'Vehicle Parking', desc: 'On-site parking for cars and motorbikes next to the arena entrance.', icon: Car, badge: 'Parking' },
        { title: 'Online Booking & Payments', desc: 'Pick a slot online and pay the advance with bKash, Nagad or card. No double booking.', icon: CheckCircle2, badge: 'Instant' }
    ];

    return (<section id="location" className="py-10 sm:py-16 md:py-24 bg-[#070b0e] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {!hideHeading && (<div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[12px] sm:text-xs font-semibold uppercase tracking-wider mb-2.5 sm:mb-3">
              <MapPin className="w-3.5 h-3.5"/>
              <span>Prime Uttara Location</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display uppercase tracking-tight">How to Reach &amp; Venue Amenities</h2>
            <p className="text-slate-400 text-xs sm:text-sm md:text-base mt-2 px-2">{siteSettings.address}. The easiest football turf in Dhaka to reach by Metro Rail.</p>
          </div>)}

        <div className="mb-8 sm:mb-12 p-4 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-[#0e1620] border border-emerald-500/30 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6 relative z-10">
            <div className="space-y-2.5 sm:space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                <Train className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400"/>
                <span>Dhaka Metro Rail (MRT Line-6)</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white font-display uppercase">Beat the Dhaka traffic. Ride the Metro straight to the turf.</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Take the Metro to <strong className="text-emerald-400">{siteSettings.metroStation || 'Uttara Center Station'}</strong>. {siteSettings.metroDetails || 'The arena is a short walk from the station exit.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm text-center shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4"/>
                <span>Open in Google Maps</span>
              </a>
              {siteSettings.facebookUrl && (<a href={siteSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-white border border-[#1877F2]/40 font-semibold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2">
                  <span>Follow on Facebook</span>
                </a>)}
            </div>
          </div>
        </div>

        <div className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <CloudSun className="w-4 h-4 text-emerald-400"/>
              <span>Matchday Weather · Uttara</span>
            </div>
            <span className="text-[12px] text-slate-500 font-mono hidden sm:inline">Source: Open-Meteo</span>
          </div>
          <TurfWeatherWidget onBookSlotClick={onBookSlotClick}/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {amenities.map((item) => {
            const Icon = item.icon;
            return (<div key={item.title} className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><Icon className="w-5 h-5"/></div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 font-mono">{item.badge}</span>
                  </div>
                  <h4 className="text-base font-bold text-white font-display mb-1.5">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>);
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-gradient-to-b from-slate-900 to-[#0b1016] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono mb-1">Official Contacts</div>
              <h3 className="text-2xl font-black text-white font-display uppercase">{siteSettings.businessName || 'Crossbar Metro Arena'}</h3>
              <p className="text-slate-400 text-xs mt-1">For slot bookings, corporate leagues, sponsorship and private turf rentals.</p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"/>
                <div>
                  <div className="text-slate-400 text-[12px] uppercase font-semibold">Location &amp; Address</div>
                  <div className="text-white font-medium mt-0.5">{siteSettings.address}</div>
                  <div className="text-emerald-400 text-xs mt-0.5 font-medium">{siteSettings.metroDetails}</div>
                </div>
              </div>
              {telHref && (<div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"/>
                  <div>
                    <div className="text-slate-400 text-[12px] uppercase font-semibold">Hotline &amp; Bookings</div>
                    <a href={telHref} className="text-white font-bold text-base hover:text-emerald-400 transition-colors">{siteSettings.phoneFormatted || siteSettings.phone}</a>
                    <div className="text-slate-400 text-xs mt-0.5">Call or WhatsApp during opening hours</div>
                  </div>
                </div>)}
              {siteSettings.email && (<div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"/>
                  <div>
                    <div className="text-slate-400 text-[12px] uppercase font-semibold">Email Enquiries</div>
                    <a href={`mailto:${siteSettings.email}`} className="text-white font-medium hover:text-emerald-400 transition-colors">{siteSettings.email}</a>
                  </div>
                </div>)}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"/>
                <div>
                  <div className="text-slate-400 text-[12px] uppercase font-semibold">Web &amp; Social</div>
                  <div className="text-white font-medium flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-emerald-300 font-mono">{siteSettings.website || 'bookcrossbar.com'}</span>
                    {siteSettings.facebookUrl && (<a href={siteSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Facebook</a>)}
                    {siteSettings.instagramUrl && (<a href={siteSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">Instagram</a>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {siteSettings.whatsappUrl && (<a href={siteSettings.whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all">
                  <MessageSquare className="w-4 h-4"/>
                  <span>WhatsApp the arena</span>
                </a>)}
              {telHref && (<a href={telHref} className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/10 transition-colors">
                  <Phone className="w-4 h-4 text-emerald-400"/>
                  <span>Call Hotline</span>
                </a>)}
            </div>
          </div>

          <div className="lg:col-span-6 bg-gradient-to-b from-slate-900 to-[#0b1016] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono mb-1">Fast Message</div>
              <h3 className="text-2xl font-black text-white font-display uppercase mb-2">Need a custom slot or tournament?</h3>
              <p className="text-slate-400 text-xs mb-6">Fill this in and we will open WhatsApp with your message ready to send to the arena desk.</p>

              <form onSubmit={handleSendInquiry} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="inq-name" className="block text-slate-300 font-semibold mb-1">Your Name *</label>
                  <input id="inq-name" type="text" required maxLength={60} placeholder="Your name" value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"/>
                </div>
                <div>
                  <label htmlFor="inq-phone" className="block text-slate-300 font-semibold mb-1">Your Phone / WhatsApp *</label>
                  <input id="inq-phone" type="tel" inputMode="numeric" required placeholder="01XXXXXXXXX" value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"/>
                </div>
                <div>
                  <label htmlFor="inq-msg" className="block text-slate-300 font-semibold mb-1">Inquiry / Booking Requirements</label>
                  <textarea id="inq-msg" rows={3} maxLength={500} placeholder="e.g. Want to book two consecutive slots on Friday night for a corporate match with a referee" value={inquiryMsg} onChange={(e) => setInquiryMsg(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"></textarea>
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold text-sm shadow-lg shadow-green-500/20 transition-all cursor-pointer flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4"/>
                  <span>Open in WhatsApp</span>
                </button>
              </form>
            </div>

            <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-[12px] text-slate-400">
              <span>Opening hours: {siteSettings.openingHours || 'see booking calendar'}</span>
              <button type="button" onClick={onBookSlotClick} className="text-emerald-400 font-medium hover:underline cursor-pointer">Book a slot →</button>
            </div>
          </div>
        </div>
      </div>
    </section>);
};
