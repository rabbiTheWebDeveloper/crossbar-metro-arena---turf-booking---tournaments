'use client';
import React from 'react';
import Link from 'next/link';
import { CrossbarLogo } from './CrossbarLogo';
import { VENUE_INFO } from '../data/initialData';
import { Phone, Mail, Train, ArrowUp, Smartphone, MessageSquare } from 'lucide-react';
import { useArena } from '../context/ArenaContext';
export const Footer = () => {
    const { setShowInstallModal } = useArena();
    const scrollToTop = () => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    return (<footer className="bg-[#05080b] border-t border-white/10 pt-12 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-white/10">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <CrossbarLogo size="lg"/>
            </Link>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm leading-relaxed mt-2">
              Crossbar Metro Arena is Dhaka&apos;s premier floodlit outdoor turf at <strong className="text-white">bookcrossbar.com</strong>. 12 daily 90-minute slots, 60-day advance calendar, ৳500 online advance booking, and live investor profit share.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Train className="w-3.5 h-3.5"/>
                <span>Uttara Center Metro Station (MRT Line-6)</span>
              </span>
            </div>

            {/* Install App Quick CTA */}
            <div className="pt-2">
              <button type="button" onClick={() => setShowInstallModal(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors cursor-pointer">
                <Smartphone className="w-3.5 h-3.5"/>
                <span>Install Mobile App (PWA & Android)</span>
              </button>
            </div>
          </div>

          {/* Website Pages */}
          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider font-mono text-xs">
              Arena Pages
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/booking" className="hover:text-emerald-400 transition-colors text-emerald-400 font-medium">
                  Booking (12 Slots · 90 Min)
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-emerald-400 transition-colors">
                  Match Day Results &amp; Scorers
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-emerald-400 transition-colors">
                  Events &amp; Tournaments
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-emerald-400 transition-colors">
                  Shop (Reserve &amp; Pickup)
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-emerald-400 transition-colors">
                  4K Pitch Gallery
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  About Venue &amp; Metro Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Three Dashboards */}
          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider font-mono text-xs">
              Three Dashboards
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/player" className="hover:text-emerald-400 transition-colors">
                  Player Dashboard (My Passes, Teams, Post Scores)
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors">
                  Admin Panel (12-Slot Radar, Expenses, Prices)
                </Link>
              </li>
              <li>
                <Link href="/investor" className="hover:text-emerald-400 transition-colors text-emerald-300 font-medium">
                  Investor Dashboard (Live Net Profit Share)
                </Link>
              </li>
              <li className="pt-2">
                <span className="text-[11px] text-slate-500 block">
                  Rule: Income - Expenses = Net Profit. In a loss month, nobody gets a share.
                </span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider font-mono text-xs">
              Turf Hotline
            </div>
            <ul className="space-y-2.5">
              <li>
                <a href={`tel:${VENUE_INFO.phone}`} className="flex items-center gap-2 hover:text-emerald-400 transition-colors text-white font-mono font-bold">
                  <Phone className="w-3.5 h-3.5 text-emerald-400"/>
                  <span>{VENUE_INFO.phoneFormatted}</span>
                </a>
              </li>
              <li>
                <a href={VENUE_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#25D366] hover:underline font-semibold">
                  <MessageSquare className="w-3.5 h-3.5"/>
                  <span>WhatsApp Booking Chat</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${VENUE_INFO.email}`} className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-emerald-400"/>
                  <span>{VENUE_INFO.email}</span>
                </a>
              </li>
              <li>
                <div className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Sector 17, Uttara Metro Center, Dhaka, 1230
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>© 2026 Crossbar Metro Arena ({VENUE_INFO.website}). All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-400/80">Payments via bKash, Nagad &amp; SSLCommerz</span>
            <button onClick={scrollToTop} className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors p-1" title="Back to top">
              <span>Back to Top</span>
              <ArrowUp className="w-3 h-3"/>
            </button>
          </div>
        </div>
      </div>
    </footer>);
};
