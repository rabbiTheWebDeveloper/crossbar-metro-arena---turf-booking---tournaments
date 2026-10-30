'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CrossbarLogo } from './CrossbarLogo';
import { Calendar, Trophy, ShieldCheck, Menu, X, ShoppingBag, Camera, Info, Smartphone, TrendingUp, User, Shield, BookOpen, LogOut, MapPin } from 'lucide-react';
import { useArena } from '../context/ArenaContext';

// ---- PWA install prompt capture -------------------------------------------------
// `beforeinstallprompt` fires once, early, on Chromium browsers. The Navbar module is
// loaded on every public page, so we capture the event here and hand it to the
// InstallAppModal (which is only mounted while open) through these helpers.
let storedInstallPrompt = null;
const installListeners = new Set();
if (typeof window !== 'undefined' && !window.__cmaInstallPromptBound) {
    window.__cmaInstallPromptBound = true;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        storedInstallPrompt = e;
        installListeners.forEach(fn => fn(e));
    });
    window.addEventListener('appinstalled', () => {
        storedInstallPrompt = null;
        installListeners.forEach(fn => fn(null));
    });
}
export const getStoredInstallPrompt = () => storedInstallPrompt;
export const subscribeInstallPrompt = (fn) => { installListeners.add(fn); return () => installListeners.delete(fn); };
export const isStandaloneDisplay = () => typeof window !== 'undefined' && ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true);
export const isIosSafari = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

export const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showInstall, setShowInstall] = useState(false);
    const pathname = usePathname() || '/';
    const { setShowInstallModal, setShowAuthModal, setAuthModalInitialTab, setShowCartDrawer, setShowHandoverGuide, currentUser, isVisitor, isAdmin, isInvestor, logout, cartItems, siteSettings } = useArena();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 15);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Offer "Install App" only when the site is not already running as an installed app
        setShowInstall(!isStandaloneDisplay());
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    // Close the drawer on navigation
    useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

    const navItems = [
        { id: 'booking', href: '/booking', label: 'Book a Slot', icon: Calendar },
        { id: 'results', href: '/results', label: 'Match Day', icon: Trophy },
        { id: 'events', href: '/events', label: 'Events', icon: Shield },
        { id: 'shop', href: '/shop', label: 'Shop', icon: ShoppingBag },
        { id: 'gallery', href: '/gallery', label: 'Gallery', icon: Camera },
        { id: 'about', href: '/about', label: 'About', icon: Info }
    ];
    const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const showPlayerLink = !isVisitor && !isInvestor;
    const showInvestorLink = isAdmin || isInvestor;
    const dashboardLinks = [
        ...(showPlayerLink ? [{ href: '/player', label: 'Player', icon: User, emoji: '⚽' }] : []),
        ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck, emoji: '🛡️' }] : []),
        ...(showInvestorLink ? [{ href: '/investor', label: 'Investor', icon: TrendingUp, emoji: '💼' }] : [])
    ];
    const openLogin = () => { setAuthModalInitialTab('login'); setShowAuthModal(true); };

    return (<header className={`sticky top-0 z-40 w-full transition-all duration-300 ${scrolled
            ? 'bg-[#070b0f]/95 backdrop-blur-md shadow-xl shadow-black/50 border-b border-emerald-500/20'
            : 'bg-[#080d12]/95 backdrop-blur-sm border-b border-white/10'}`}>
      {/* 1. TOP MICRO-BAR */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-950 to-emerald-950/80 border-b border-emerald-500/20 px-3 sm:px-6 h-8 flex items-center text-xs text-slate-300">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <Link href="/venue" className="inline-flex items-center gap-2 truncate hover:opacity-90 transition-opacity">
            <MapPin className="w-3 h-3 text-emerald-400 shrink-0"/>
            <span className="text-emerald-300 font-bold text-[12px] sm:text-xs truncate">
              {siteSettings.metroStation || 'Uttara Center Metro Station'}
            </span>
            <span className="hidden md:inline text-slate-400 text-[12px] font-normal truncate">
              · {siteSettings.openingHours || 'Open daily'}
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[12px] sm:text-xs">
            {showInstall && (<>
                <button type="button" onClick={() => setShowInstallModal(true)} className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer">
                  <Smartphone className="w-3 h-3 text-emerald-400 shrink-0"/>
                  <span className="hidden sm:inline">Install App</span>
                </button>
                {(isAdmin || dashboardLinks.length > 0) && <span className="text-white/20 leading-none">|</span>}
              </>)}

            {isAdmin && (<>
                <button type="button" onClick={() => setShowHandoverGuide(true)} className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold transition-colors cursor-pointer">
                  <BookOpen className="w-3 h-3 text-amber-400 shrink-0"/>
                  <span className="hidden sm:inline">Handover Guide</span>
                </button>
                <span className="text-white/20 leading-none">|</span>
              </>)}

            {dashboardLinks.map((d, i) => {
                const Icon = d.icon;
                const active = pathname.startsWith(d.href);
                return (<React.Fragment key={d.href}>
                  {i > 0 && <span className="text-white/20 leading-none">·</span>}
                  <Link href={d.href} className={`inline-flex items-center gap-1 transition-colors ${active ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                    <Icon className="w-3 h-3 shrink-0"/>
                    <span className="hidden sm:inline">{d.label}</span>
                  </Link>
                </React.Fragment>);
            })}
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:opacity-95 transition-opacity" aria-label="Crossbar Metro Arena home">
              <CrossbarLogo size="responsive"/>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (<Link key={item.id} href={item.href} aria-current={isActive ? 'page' : undefined} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                    <span>{item.label}</span>
                  </Link>);
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setShowCartDrawer(true)} className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer" title="Shop reservation bag" aria-label={`Shop bag, ${totalCartCount} items`}>
              <ShoppingBag className="w-4 h-4"/>
              {totalCartCount > 0 && (<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                  {totalCartCount}
                </span>)}
            </button>

            {!isVisitor ? (<div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <Link href={isAdmin ? '/admin' : isInvestor ? '/investor' : '/player'} className="font-bold text-white max-w-[90px] sm:max-w-[130px] truncate hover:text-emerald-300">
                  {currentUser.name}
                </Link>
                <span className="text-[11px] uppercase font-bold text-slate-400 px-1 rounded bg-black/40">
                  {currentUser.role}
                </span>
                <button type="button" onClick={() => logout()} className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer" title="Log out" aria-label="Log out">
                  <LogOut className="w-3.5 h-3.5"/>
                </button>
              </div>) : (<Link href="/login" className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400"/>
                <span>Log In</span>
              </Link>)}

            <Link href="/booking" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20">
              <Calendar className="w-3.5 h-3.5 stroke-[2.5]"/>
              <span>Book Slot</span>
            </Link>

            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer" aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
              {mobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
            </button>
          </div>
        </div>
      </div>

      {/* 3. MOBILE DRAWER */}
      {mobileMenuOpen && (<div className="lg:hidden bg-[#0a0f15] border-b border-white/10 px-4 pt-3 pb-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (<Link key={item.id} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors ${isActive
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5'}`}>
                  <Icon className="w-4 h-4 text-emerald-400"/>
                  <span>{item.label}</span>
                </Link>);
            })}
            <Link href="/venue" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-xl text-xs font-bold flex items-center gap-2 border bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5">
              <MapPin className="w-4 h-4 text-emerald-400"/>
              <span>Venue &amp; Metro</span>
            </Link>
            <Link href="/matches" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-xl text-xs font-bold flex items-center gap-2 border bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5">
              <Trophy className="w-4 h-4 text-emerald-400"/>
              <span>Fixtures &amp; Challenges</span>
            </Link>
          </div>

          {dashboardLinks.length > 0 && (<div className="pt-3 border-t border-white/10 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dashboards</div>
              <div className={`grid gap-2 text-xs text-center font-bold ${dashboardLinks.length === 3 ? 'grid-cols-3' : dashboardLinks.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {dashboardLinks.map(d => (<Link key={d.href} href={d.href} onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:border-emerald-500/40">
                    {d.emoji} {d.label}
                  </Link>))}
              </div>
            </div>)}

          <div className="pt-2 flex gap-2">
            {isVisitor ? (<button type="button" onClick={() => { setMobileMenuOpen(false); openLogin(); }} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer">
                Log in / Sign up
              </button>) : (<button type="button" onClick={() => { setMobileMenuOpen(false); logout(); }} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs uppercase tracking-wider cursor-pointer">
                Log out
              </button>)}
            {isAdmin && (<button type="button" onClick={() => { setMobileMenuOpen(false); setShowHandoverGuide(true); }} className="flex-1 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider cursor-pointer">
                Handover Guide
              </button>)}
            {showInstall && (<button type="button" onClick={() => { setMobileMenuOpen(false); setShowInstallModal(true); }} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-300 font-bold text-xs uppercase tracking-wider cursor-pointer">
                Install App
              </button>)}
          </div>
        </div>)}
    </header>);
};
