'use client';
import React from 'react';
import Link from 'next/link';
import { CrossbarLogo } from './CrossbarLogo';
import { Phone, Mail, Train, ArrowUp, Smartphone, MessageSquare, Facebook, Instagram, Clock, MapPin } from 'lucide-react';
import { useArena, cleanPhone } from '../context/ArenaContext';

export const Footer = () => {
    const { setShowInstallModal, siteSettings, pricing, isVisitor, isAdmin, isInvestor } = useArena();
    const scrollToTop = () => {
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const telHref = siteSettings.phone ? `tel:${cleanPhone(siteSettings.phone)}` : null;
    const year = new Date().getFullYear();
    const dashboards = [
        ...(!isVisitor && !isInvestor ? [{ href: '/player', label: 'Player Dashboard (passes, teams, post scores)' }] : []),
        ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel (bookings, pricing, expenses)' }] : []),
        ...(isAdmin || isInvestor ? [{ href: '/investor', label: 'Investor Dashboard (monthly reports)' }] : [])
    ];

    return (<footer className="bg-[#05080b] border-t border-white/10 pt-12 pb-24 md:pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-white/10">
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block" aria-label="Crossbar Metro Arena home">
              <CrossbarLogo size="lg"/>
            </Link>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm leading-relaxed mt-2">
              {siteSettings.businessName || 'Crossbar Metro Arena'} is a floodlit outdoor football turf beside Uttara Metro Center, Dhaka. 12 daily 90-minute slots, bookable up to {pricing.bookingWindowDays || 60} days ahead with a ৳{Number(pricing.advanceAmount || 0).toLocaleString()} online advance.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Train className="w-3.5 h-3.5"/>
                <span>{siteSettings.metroStation || 'Uttara Center Metro Station (MRT Line-6)'}</span>
              </span>
            </div>
            <div className="pt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowInstallModal(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors cursor-pointer">
                <Smartphone className="w-3.5 h-3.5"/>
                <span>Install web app</span>
              </button>
              {siteSettings.facebookUrl && (<a href={siteSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-colors">
                  <Facebook className="w-3.5 h-3.5 text-sky-400"/>
                  <span>Facebook</span>
                </a>)}
              {siteSettings.instagramUrl && (<a href={siteSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-colors">
                  <Instagram className="w-3.5 h-3.5 text-pink-400"/>
                  <span>Instagram</span>
                </a>)}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider font-mono text-xs">Arena Pages</div>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
              <li><Link href="/booking" className="hover:text-emerald-400 transition-colors text-emerald-400 font-medium">Book a Slot (12 slots · 90 min)</Link></li>
              <li><Link href="/results" className="hover:text-emerald-400 transition-colors">Match Results &amp; Standings</Link></li>
              <li><Link href="/matches" className="hover:text-emerald-400 transition-colors">Fixtures &amp; Squad Challenges</Link></li>
              <li><Link href="/events" className="hover:text-emerald-400 transition-colors">Events &amp; Tournaments</Link></li>
              <li><Link href="/shop" className="hover:text-emerald-400 transition-colors">Shop (reserve &amp; pick up)</Link></li>
              <li><Link href="/gallery" className="hover:text-emerald-400 transition-colors">Gallery</Link></li>
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About &amp; Price Table</Link></li>
              <li><Link href="/venue" className="hover:text-emerald-400 transition-colors">Venue &amp; Metro Guide</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider font-mono text-xs">{dashboards.length ? 'Your Dashboards' : 'Your Account'}</div>
            <ul className="space-y-2">
              {dashboards.length === 0 ? (<>
                  <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Log in</Link></li>
                  <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Create a player account</Link></li>
                  <li><Link href="/booking" className="hover:text-emerald-400 transition-colors">Find my booking</Link></li>
                </>) : dashboards.map(d => (<li key={d.href}>
                  <Link href={d.href} className="hover:text-emerald-400 transition-colors">{d.label}</Link>
                </li>))}
              <li className="pt-2">
                <span className="text-[12px] text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400"/>
                  <span>{siteSettings.openingHours || 'Open daily'}</span>
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider font-mono text-xs">Turf Hotline</div>
            <ul className="space-y-2.5">
              {telHref && (<li>
                  <a href={telHref} className="flex items-center gap-2 hover:text-emerald-400 transition-colors text-white font-mono font-bold">
                    <Phone className="w-3.5 h-3.5 text-emerald-400"/>
                    <span>{siteSettings.phoneFormatted || siteSettings.phone}</span>
                  </a>
                </li>)}
              {siteSettings.whatsappUrl && (<li>
                  <a href={siteSettings.whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#25D366] hover:underline font-semibold">
                    <MessageSquare className="w-3.5 h-3.5"/>
                    <span>WhatsApp booking chat</span>
                  </a>
                </li>)}
              {siteSettings.email && (<li>
                  <a href={`mailto:${siteSettings.email}`} className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-emerald-400"/>
                    <span>{siteSettings.email}</span>
                  </a>
                </li>)}
              {siteSettings.address && (<li>
                  <a href={siteSettings.googleMapsUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-[12px] text-slate-400 leading-relaxed pt-1 hover:text-emerald-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5"/>
                    <span>{siteSettings.address}</span>
                  </a>
                </li>)}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-slate-400">
          <span>© {year} {siteSettings.businessName || 'Crossbar Metro Arena'} ({siteSettings.website || 'bookcrossbar.com'}). All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400/80">Payments via bKash, Nagad &amp; card (SSLCommerz)</span>
            <button type="button" onClick={scrollToTop} className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors p-1 cursor-pointer" title="Back to top">
              <span>Back to Top</span>
              <ArrowUp className="w-3 h-3"/>
            </button>
          </div>
        </div>
      </div>
    </footer>);
};
