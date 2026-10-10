'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CrossbarLogo } from './CrossbarLogo';
import { Calendar, Trophy, ShieldCheck, Menu, X, ShoppingBag, Camera, Info, Smartphone, TrendingUp, User, Shield, BookOpen, LogOut } from 'lucide-react';
import { useArena } from '../context/ArenaContext';
export const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { bookings, setShowInstallModal, setShowAuthModal, setAuthModalInitialTab, setShowCartDrawer, setShowHandoverGuide, currentUser, logout, cartItems } = useArena();
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
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);
    // Main navigation items specified in Section 3 of requirements
    const navItems = [
        { id: 'booking', href: '/booking', label: 'Book a Slot', icon: Calendar },
        { id: 'results', href: '/results', label: 'Match Day', icon: Trophy },
        { id: 'events', href: '/events', label: 'Events', icon: Shield },
        { id: 'shop', href: '/shop', label: 'Shop', icon: ShoppingBag },
        { id: 'gallery', href: '/gallery', label: 'Gallery', icon: Camera },
        { id: 'about', href: '/about', label: 'About', icon: Info },
    ];
    const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return (<header className={`sticky top-0 z-40 w-full transition-all duration-300 ${scrolled
            ? 'bg-[#070b0f]/95 backdrop-blur-md shadow-xl shadow-black/50 border-b border-emerald-500/20'
            : 'bg-[#080d12]/95 backdrop-blur-sm border-b border-white/10'}`}>
      {/* 1. TOP ANNOUNCEMENT & DASHBOARDS SWITCHER MICRO-BAR */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-950 to-emerald-950/80 border-b border-emerald-500/20 px-3 sm:px-6 h-8 flex items-center text-xs text-slate-300">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Location & Metro Link */}
          <Link href="/about" className="inline-flex items-center gap-2 truncate hover:opacity-90 transition-opacity">
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

          {/* Three Dashboards Switcher & Quick Demo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[11px] sm:text-xs">
            {/* Install App Quick Prompt */}
            <button type="button" onClick={() => setShowInstallModal(true)} className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer">
              <Smartphone className="w-3 h-3 text-emerald-400 shrink-0"/>
              <span className="hidden xs:inline">Install App</span>
            </button>

            <span className="text-white/20 leading-none">|</span>

            {/* Handover Guide link */}
            <button type="button" onClick={() => setShowHandoverGuide(true)} className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold transition-colors cursor-pointer">
              <BookOpen className="w-3 h-3 text-amber-400 shrink-0"/>
              <span className="hidden sm:inline">Handover Guide</span>
            </button>

            <span className="text-white/20 leading-none">|</span>

            {/* Dashboard Links */}
            <Link href="/player" className={`inline-flex items-center gap-1 transition-colors ${pathname.startsWith('/player') ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
              <User className="w-3 h-3 shrink-0"/>
              <span className="hidden sm:inline">Player</span>
            </Link>

            <span className="text-white/20 leading-none">·</span>

            <Link href="/admin" className={`inline-flex items-center gap-1 transition-colors ${pathname.startsWith('/admin') ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
              <ShieldCheck className="w-3 h-3 shrink-0"/>
              <span className="hidden sm:inline">Admin</span>
            </Link>

            <span className="text-white/20 leading-none">·</span>

            <Link href="/investor" className={`inline-flex items-center gap-1 transition-colors ${pathname.startsWith('/investor') ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
              <TrendingUp className="w-3 h-3 shrink-0 text-sky-400"/>
              <span className="hidden sm:inline">Investor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:opacity-95 transition-opacity">
              <CrossbarLogo size="responsive"/>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (<Link key={item.id} href={item.href} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                    <span>{item.label}</span>
                  </Link>);
        })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button */}
            <button type="button" onClick={() => setShowCartDrawer(true)} className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer" title="Arena Gear Bag">
              <ShoppingBag className="w-4 h-4"/>
              {totalCartCount > 0 && (<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {totalCartCount}
                </span>)}
            </button>

            {/* Current User Badge / Auth Trigger */}
            {currentUser && currentUser.role !== 'visitor' ? (<div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-bold text-white max-w-[90px] sm:max-w-[130px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 px-1 py-0.2 rounded bg-black/40">
                  {currentUser.role}
                </span>
                <button type="button" onClick={logout} className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer" title="Log out">
                  <LogOut className="w-3.5 h-3.5"/>
                </button>
              </div>) : (<Link href="/login" className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400"/>
                <span>Log In</span>
              </Link>)}

            {/* Book Now Primary Button */}
            <Link href="/booking" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20">
              <Calendar className="w-3.5 h-3.5 stroke-[2.5]"/>
              <span>Book Slot</span>
            </Link>

            {/* Mobile Hamburger Menu Toggle */}
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer">
              {mobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
            </button>
          </div>
        </div>
      </div>

      {/* 3. MOBILE SLIDE-DOWN DRAWER */}
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
          </div>

          {/* Quick Dashboards in Drawer */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dashboards</div>
            <div className="grid grid-cols-3 gap-2 text-xs text-center font-bold">
              <Link href="/player" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:border-emerald-500/40">
                ⚽ Player
              </Link>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:border-emerald-500/40">
                🛡️ Admin
              </Link>
              <Link href="/investor" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:border-emerald-500/40">
                💼 Investor
              </Link>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button type="button" onClick={() => { setMobileMenuOpen(false); setShowAuthModal(true); }} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs uppercase tracking-wider">
              Account / Roles
            </button>
            <button type="button" onClick={() => { setMobileMenuOpen(false); setShowHandoverGuide(true); }} className="flex-1 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider">
              Handover Guide
            </button>
          </div>
        </div>)}
    </header>);
};
