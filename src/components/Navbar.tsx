import React, { useState, useEffect } from 'react';
import { CrossbarLogo } from './CrossbarLogo';
import { VENUE_INFO } from '../data/initialData';
import { Phone, Calendar, Trophy, Users, MapPin, Ticket, ShieldCheck, Menu, X, MessageSquare, ChevronRight, Train, Sparkles } from 'lucide-react';
import { Booking } from '../types';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  userBookings: Booking[];
  onOpenMyBookings: () => void;
  onOpenAdmin: () => void;
  onOpenSquadBuilder: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  userBookings,
  onOpenMyBookings,
  onOpenAdmin,
  onOpenSquadBuilder
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    { id: 'booking', label: 'Book Slot', icon: Calendar, description: 'Hourly pitch availability' },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy, description: '৳60K+ Prize Cups & Leagues' },
    { id: 'squad-builder', label: 'Tag Squad', icon: Users, isAction: true, badge: '🔥 Hot', description: 'Create lineup card & formations' },
    { id: 'schedule', label: 'Live Fixtures', icon: Ticket, description: 'Confirmed matches & challenges' },
    { id: 'location', label: 'Metro & Venue', icon: MapPin, description: 'Uttara Metro Center, Sec 17' },
  ];

  const handleNavClick = (id: string, isAction?: boolean) => {
    if (isAction && id === 'squad-builder') {
      onOpenSquadBuilder();
    } else {
      onNavigate(id);
    }
    setMobileMenuOpen(false);
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
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
              <span className="text-emerald-300 font-semibold truncate">Uttara Metro Center, Sec 17</span>
              <span className="hidden md:inline text-slate-400 font-normal">· MRT Line-6 Elevated Viaduct</span>
            </div>
          </div>

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

            <button
              onClick={onOpenAdmin}
              className="text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
              title="Arena Staff Access"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
              <span className="hidden sm:inline">Staff</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick('hero')}
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg p-0.5 group shrink-0"
          aria-label="Crossbar Metro Arena Home"
        >
          <CrossbarLogo size="responsive" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.isAction)}
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
              </button>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* My Passes Button */}
          {userBookings.length > 0 && (
            <button
              onClick={onOpenMyBookings}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
              title="View your match passes"
            >
              <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">My Passes</span>
              <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 text-[10px] sm:text-xs font-black shadow-sm">
                {userBookings.length}
              </span>
            </button>
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
          <button
            onClick={() => handleNavClick('booking')}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-950" />
            <span>Book Turf</span>
          </button>

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

            {/* Nav Items List */}
            <div className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id, item.isAction)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 border border-emerald-500/50 text-white'
                        : 'bg-white/[0.03] border border-white/5 text-slate-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-emerald-500 text-black font-bold' : 'bg-white/5 text-emerald-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500 text-black">
                              HOT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                );
              })}

              {/* My Passes in Drawer if any */}
              {userBookings.length > 0 && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenMyBookings();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>My Match Passes</span>
                        <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                          {userBookings.length}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">View ticket QR codes & squad passes</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>
              )}
            </div>

            {/* Quick Action Buttons in Drawer */}
            <div className="p-4 border-t border-white/10 bg-black/40 space-y-2.5">
              <a
                href={VENUE_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-[#25D366] hover:bg-[#20ba59] text-black shadow-lg shadow-green-500/20 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={`tel:${VENUE_INFO.phone}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-200 hover:text-white border border-white/10 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Hotline: {VENUE_INFO.phone}</span>
              </a>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Uttara Metro Center · Sector 17</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Staff Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
