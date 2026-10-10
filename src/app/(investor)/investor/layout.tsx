'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useArena } from '@/context/ArenaContext';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import {
  BarChart3,
  Calendar,
  Receipt,
  CreditCard,
  Globe,
  RotateCcw,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

export default function InvestorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { investors, currentUser, switchDemoUser, logout } = useArena();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Active investor partner account
  const defaultInvestorId = useMemo(() => {
    if (currentUser?.role === 'investor') {
      const match = investors.find(i =>
        i.name.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]) ||
        (currentUser.phone && i.phone.replace(/[^0-9]/g, '').includes(currentUser.phone.replace(/[^0-9]/g, '')))
      );
      if (match) return match.id;
    }
    return investors[0]?.id || 'inv-02';
  }, [currentUser, investors]);

  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(defaultInvestorId);

  const activeInvestor = useMemo(() => {
    return investors.find(i => i.id === selectedInvestorId) || investors[0] || {
      id: 'inv-01',
      name: 'Investor One',
      sharePercentage: 12,
    };
  }, [investors, selectedInvestorId]);

  // Dynamic header title matching exact screenshot titles
  const headerTitle = useMemo(() => {
    if (pathname.includes('/bookings')) return 'BOOKINGS';
    if (pathname.includes('/expenses')) return 'EXPENSES';
    if (pathname.includes('/payouts') || pathname.includes('/my-payouts')) return 'MY PAYOUTS';
    return `INVESTOR OVERVIEW · ${activeInvestor.name || 'Investor One'}`;
  }, [pathname, activeInvestor.name]);

  const isOverview = pathname === '/investor' || pathname === '/investor/';
  const isBookings = pathname.includes('/bookings');
  const isExpenses = pathname.includes('/expenses');
  const isPayouts = pathname.includes('/payouts') || pathname.includes('/my-payouts');

  const handleResetData = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#080d12]/95 backdrop-blur-md border-b border-emerald-500/20 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 group">
          <CrossbarLogo size="sm" showSubtitle={false} />
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            INVESTOR
          </span>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* LEFT SIDEBAR WITH OFFICIAL CROSSBAR LOGO & MAIN THEME */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#080d12] border-r border-emerald-500/20 flex flex-col justify-between p-5 transition-transform duration-200 ease-out shadow-2xl md:shadow-none
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:static md:w-64 md:shrink-0
      `}>
        {/* Top Logo & Brand */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex flex-col group">
              <CrossbarLogo size="sm" showSubtitle={false} />
              <div className="pl-10 -mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[9px] font-mono tracking-[0.22em] text-emerald-400 uppercase font-black">
                  INVESTOR PORTAL
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items (Main Website Emerald & Volt Color Tokens) */}
          <nav className="space-y-1.5 font-sans">
            {/* 1. Overview */}
            <Link
              href="/investor"
              onClick={() => setMobileSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                isOverview
                  ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${isOverview ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>Overview</span>
            </Link>

            {/* 2. Bookings */}
            <Link
              href="/investor/bookings"
              onClick={() => setMobileSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                isBookings
                  ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Calendar className={`w-4 h-4 ${isBookings ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>Bookings</span>
            </Link>

            {/* 3. Expenses */}
            <Link
              href="/investor/expenses"
              onClick={() => setMobileSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                isExpenses
                  ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Receipt className={`w-4 h-4 ${isExpenses ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>Expenses</span>
            </Link>

            {/* 4. My payouts */}
            <Link
              href="/investor/payouts"
              onClick={() => setMobileSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                isPayouts
                  ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${isPayouts ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>My payouts</span>
            </Link>
          </nav>
        </div>

        {/* Bottom utility links with emerald hover transitions */}
        <div className="pt-6 border-t border-emerald-500/15 space-y-1 text-xs">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors"
          >
            <Globe className="w-4 h-4 text-emerald-400/70" />
            <span>View website</span>
          </Link>

          <button
            onClick={() => { switchDemoUser('player'); router.push('/player'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400/70" />
            <span>Switch to Player demo</span>
          </button>

          <button
            onClick={() => { switchDemoUser('admin'); router.push('/admin'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400/70" />
            <span>Switch to Admin demo</span>
          </button>

          <button
            onClick={handleResetData}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400/70" />
            <span>Reset demo data</span>
          </button>

          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400/80" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#070b0e] bg-[radial-gradient(900px_500px_at_15%_-5%,rgba(16,185,129,0.08),transparent_60%)] overflow-y-auto">
        
        {/* TOP BAR WITH BRAND COLOR SYSTEM */}
        <header className="px-4 sm:px-8 lg:px-10 py-4 sm:py-5 flex items-center justify-between border-b border-emerald-500/15 bg-[#080d12]/50 backdrop-blur-sm sticky top-0 z-30">
          {/* Left Title */}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase font-sans truncate">
              {headerTitle}
            </h1>
            
            {/* Quick dropdown for testing up to 10 investors when on Overview */}
            {isOverview && (
              <div className="relative group shrink-0">
                <select
                  value={selectedInvestorId}
                  onChange={(e) => setSelectedInvestorId(e.target.value)}
                  className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                  title="Select partner account"
                >
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id} className="bg-slate-900 text-white">
                      {inv.name} ({inv.sharePercentage}%)
                    </option>
                  ))}
                </select>
                <button className="flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 cursor-pointer">
                  <span>({activeInvestor.sharePercentage || 12}%)</span>
                  <ChevronDown className="w-3 h-3 text-emerald-400" />
                </button>
              </div>
            )}
          </div>

          {/* Right Role Badge & Avatar matching main site */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <span className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-emerald-300 border border-emerald-500/40 bg-emerald-500/10">
              INVESTOR
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-emerald-400/25">
              I
            </div>
          </div>
        </header>

        {/* BODY CONTAINER WITH RESPONSIVE PADDING */}
        <div className="p-4 sm:p-8 lg:p-10 w-full flex-1">
          {children}
        </div>
      </main>

    </div>
  );
}
