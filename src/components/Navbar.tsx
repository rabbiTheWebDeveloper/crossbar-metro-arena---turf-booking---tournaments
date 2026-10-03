'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CrossbarLogo } from './CrossbarLogo';
import { VENUE_INFO } from '../data/initialData';
import { Phone, Calendar, Trophy, Users, MapPin, Ticket, ShieldCheck, Menu, X, MessageSquare, ChevronRight, Train, Sparkles } from 'lucide-react';
import { Booking } from '../types';
import { useArena } from '../context/ArenaContext';

interface NavbarProps {
  activeSection?: string;
  onNavigate?: (sectionId: string) => void;
  userBookings?: Booking[];
  onOpenMyBookings?: () => void;
  onOpenAdmin?: () => void;
  onOpenSquadBuilder?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  userBookings: propBookings,
  onOpenMyBookings,
  onOpenAdmin,
  onOpenSquadBuilder
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // Arena context fallback
  const arena = useArena();
  const bookings = propBookings ?? arena.bookings;
  const openPasses = onOpenMyBookings ?? (() => arena.setShowPassesDrawer(true));
  const openAdmin = onOpenAdmin ?? (() => arena.setShowAdminModal(true));
  const openSquad = onOpenSquadBuilder ?? (() => arena.setShowSquadModal(true));

  // Monitor scroll for enhanced backdrop blur and border
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { id: 'booking', href: '/booking', label: 'Book Slot', icon: Calendar, description: 'Hourly pitch availability' },
    { id: 'tournaments', href: '/tournaments', label: 'Tournaments', icon: Trophy, description: '৳60K+ Prize Cups & Leagues' },
    { id: 'squad-builder', href: '/squad-builder', label: 'Tag Squad', icon: Users, isAction: true, badge: '🔥 Hot', description: 'Create lineup card & formations' },
    { id: 'matches', href: '/matches', label: 'Live Fixtures', icon: Ticket, description: 'Confirmed matches & challenges' },
    { id: 'venue', href: '/venue', label: 'Metro & Venue', icon: MapPin, description: 'Uttara Metro Center, Sec 17' },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    setMobileMenuOpen(false);
    if (onNavigate && pathname === '/') {
      onNavigate(item.id);
    } else {
      router.push(item.href);
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      scrolled
        ? 'bg-[#070b0f]/95 backdrop-blur-md shadow-xl shadow-black/40 border-b border-emerald-500/20'
        : 'bg-[#080d12]/95 backdrop-blur-sm border-b border-white/10'
    }`}>
      {/* Top Announcement & Quick Contact Micro-Bar */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-950 to-emerald-950/80 border-b border-emerald-500/20 px-3 sm:px-6 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Location / Metro Link */}
          <Link href="/venue" className="flex items-center gap-1.5 sm:gap-2 truncate hover:opacity-90 transition-opacity">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
              <span className="text-emerald-300 font-semibold truncate">Uttara Metro Center, Sec 17</span>
              <span className="hidden md:inline text-slate-400 font-normal">· MRT Line-6 Elevated Viaduct</span>
            </div>
          </Link>

          {/* Quick Hotline & Staff Access */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-[11px] sm:text-xs">
            <a
              href={`tel:${VENUE_INFO.phone}`}
              className="flex items-center gap-1 text-slate-200 hover:text-emerald-400 font-bold transition-colors"
            >
              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="tracking-wide font-mono">{VENUE_INFO.phone}</span>
            </a>

            <span className="text-white/20 hidden sm:inline">|</span>

            <Link
              href="/admin"
              className="text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
              title="Arena Staff Access"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
              <span className="hidden sm:inline">Staff</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg p-0.5 group shrink-0"
          aria-label="Crossbar Metro Arena Home"
        >
          <CrossbarLogo size="responsive" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname === '/' && activeSection === item.id);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-0.5 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500 text-black leading-tight">
                    HOT
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* My Passes Button */}
          {bookings.length > 0 && (
            <Link
              href="/passes"
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
              title="View your match passes"
            >
              <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">My Passes</span>
              <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 text-[10px] sm:text-xs font-black shadow-sm">
                {bookings.length}
              </span>
            </Link>
          )}

          {/* WhatsApp Direct Chat Button (Desktop & Tablet) */}
          <a
            href={VENUE_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] transition-all cursor-pointer shadow-sm"
            title="Chat on WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">WhatsApp</span>
          </a>

          {/* Primary "Book Turf" CTA */}
          <Link
            href="/booking"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-950" />
            <span>Book Turf</span>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none transition-colors ml-0.5 cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay & Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Drawer Menu Container */}
          <div className="relative bg-[#0c131a] border-t border-emerald-500/30 rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Drawer Top Handle & Title */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0c131a]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <CrossbarLogo size="sm" showSubtitle={false} />
                <span className="text-xs font-bold text-slate-400">· Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links List */}
            <div className="p-4 space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 transition-all text-white font-semibold text-sm"
              >
                <span className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>Arena Overview</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500 text-black">
                              HOT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                );
              })}

              {/* Passes button on mobile */}
              <Link
                href="/passes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">My Match Passes</div>
                    <div className="text-[11px] text-emerald-400/80">{bookings.length} saved booking passes</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400/60" />
              </Link>
            </div>

            {/* Mobile Footer CTAs */}
            <div className="p-4 border-t border-white/10 bg-black/40 space-y-2">
              <Link
                href="/booking"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 rounded-2xl font-black text-center text-slate-950 bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Calendar className="w-4 h-4" />
                <span>BOOK A COURT NOW</span>
              </Link>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${VENUE_INFO.phone}`}
                  className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/10"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call Desk</span>
                </a>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 hover:text-white"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Arena Staff</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
