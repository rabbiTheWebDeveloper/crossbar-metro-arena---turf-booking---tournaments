'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CrossbarLogo } from './CrossbarLogo';
import { VENUE_INFO } from '../data/initialData';
import {
  Phone,
  Calendar,
  Trophy,
  Users,
  MapPin,
  Ticket,
  ShieldCheck,
  Menu,
  X,
  MessageSquare,
  ChevronRight,
  Train,
  ShoppingBag,
  Camera,
  Info,
  Smartphone,
  TrendingUp,
  User,
  Shield
} from 'lucide-react';
import { useArena } from '../context/ArenaContext';

interface NavbarProps {
  activeSection?: string;
  onNavigate?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const { bookings, setShowInstallModal } = useArena();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Main navigation items specified in the one-page brief
  const navItems = [
    { id: 'booking', href: '/booking', label: 'Booking', icon: Calendar },
    { id: 'results', href: '/results', label: 'Match Day Results', icon: Trophy },
    { id: 'events', href: '/events', label: 'Events & Tournaments', icon: Shield },
    { id: 'shop', href: '/shop', label: 'Shop', icon: ShoppingBag },
    { id: 'gallery', href: '/gallery', label: 'Gallery', icon: Camera },
    { id: 'about', href: '/about', label: 'About', icon: Info },
  ];

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      scrolled
        ? 'bg-[#070b0f]/95 backdrop-blur-md shadow-xl shadow-black/50 border-b border-emerald-500/20'
        : 'bg-[#080d12]/95 backdrop-blur-sm border-b border-white/10'
    }`}>
      {/* 1. TOP ANNOUNCEMENT & DASHBOARDS SWITCHER MICRO-BAR */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-950 to-emerald-950/80 border-b border-emerald-500/20 px-4 sm:px-6 h-8 flex items-center text-xs text-slate-300">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-3">
          
          {/* Location & Metro Link */}
          <Link
            href="/about"
            className="inline-flex items-center gap-2 truncate hover:opacity-90 transition-opacity"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-emerald-300 font-bold text-[11px] sm:text-xs truncate">
              Uttara Metro Center, Sec 17
            </span>
            <span className="hidden md:inline text-slate-400 text-[11px] font-normal">
              · 2 Min from MRT Line-6
            </span>
          </Link>

          {/* Three Dashboards Switcher & Install App */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[11px] sm:text-xs">
            {/* Install App Quick Prompt */}
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
            >
              <Smartphone className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Install App</span>
            </button>

            <span className="text-white/20 leading-none">|</span>

            {/* Dashboard Links */}
            <Link
              href="/player"
              className={`inline-flex items-center gap-1 transition-colors ${
                pathname.startsWith('/player') ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Player</span>
            </Link>

            <span className="text-white/20 leading-none">·</span>

            <Link
              href="/admin"
              className={`inline-flex items-center gap-1 transition-colors ${
                pathname.startsWith('/admin') ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Admin</span>
            </Link>

            <span className="text-white/20 leading-none">·</span>

            <Link
              href="/investor"
              className={`inline-flex items-center gap-1 transition-colors ${
                pathname.startsWith('/investor') ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Investor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo (Left) */}
        <Link
          href="/"
          className="inline-flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg p-0.5 group shrink-0"
          aria-label="Crossbar Metro Arena Home"
        >
          <CrossbarLogo size="responsive" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`h-9 px-3 rounded-xl text-xs xl:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 border ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* My Passes Button */}
          {bookings.length > 0 && (
            <Link
              href="/player"
              className="h-9 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 shadow-sm"
              title="View your match passes"
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline leading-none">Passes</span>
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black shrink-0 leading-none">
                {bookings.length}
              </span>
            </Link>
          )}

          {/* WhatsApp Direct Chat Button */}
          <a
            href={VENUE_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex h-9 items-center gap-1.5 px-3 rounded-xl text-xs font-bold bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] transition-all cursor-pointer shadow-sm whitespace-nowrap"
            title="Chat on WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline leading-none">WhatsApp</span>
          </a>

          {/* Primary "Book Turf" CTA */}
          <Link
            href="/booking"
            className="btn-volt h-9 sm:h-9.5 px-3.5 sm:px-4.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Calendar className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="leading-none">Book Turf</span>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-9 w-9 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 inline-flex items-center justify-center focus:outline-none transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. MOBILE DRAWER OVERLAY & PANEL */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          <div className="relative bg-[#0c131a] border-t border-emerald-500/30 rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0c131a]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <CrossbarLogo size="sm" showSubtitle={false} />
                <span className="text-xs font-bold text-slate-400">· Arena Navigation</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links List */}
            <div className="p-4 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pt-1">
                Main Pages
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-white/5 text-emerald-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                );
              })}

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pt-3">
                Three Dashboards
              </div>
              
              <Link
                href="/player"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Player Dashboard</div>
                    <div className="text-[11px] text-slate-400">My passes, teams, post scores</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Admin Dashboard</div>
                    <div className="text-[11px] text-slate-400">12-slot radar, expenses, prices</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/investor"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Investor Dashboard</div>
                    <div className="text-[11px] text-slate-400">Net profit share & live payouts</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              {/* Install App CTA in drawer */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowInstallModal(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-slate-950 font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Smartphone className="w-4 h-4 text-slate-950" />
                <span>Install Mobile App (PWA)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
