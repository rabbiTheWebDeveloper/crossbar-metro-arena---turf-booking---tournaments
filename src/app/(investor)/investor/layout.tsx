'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useArena } from '@/context/ArenaContext';
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
    <div className="min-h-screen bg-[#060906] text-white flex flex-col md:flex-row antialiased font-sans">
      
      {/* MOBILE TOP BAR (Hamburgers) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#080d08] border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#bef264] rounded-lg flex items-center justify-center font-black text-black text-xs shadow-md shadow-[#bef264]/20">
            C
          </div>
          <span className="font-bold tracking-wider text-sm font-display">CROSSBAR</span>
          <span className="text-[10px] font-mono text-[#bef264] tracking-widest uppercase">INVESTOR</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-white/5 text-zinc-300 hover:text-white cursor-pointer"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* LEFT SIDEBAR (EXACT MATCH WITH REFERENCE IMAGES) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#080d08] border-r border-white/5 flex flex-col justify-between p-5 transition-transform duration-200
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:static md:w-64 md:shrink-0
      `}>
        {/* Top brand */}
        <div>
          <Link href="/" className="flex items-center gap-3 mb-8 group">
            {/* Goal Crossbar Icon */}
            <div className="w-8 h-8 rounded-lg bg-[#bef264] flex items-center justify-center shadow-lg shadow-[#bef264]/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20V5h16v15" />
                <path d="M4 10h16" />
                <circle cx="12" cy="15" r="2" />
              </svg>
            </div>
            <div>
              <div className="font-black tracking-wider text-sm text-white font-display uppercase leading-tight">
                CROSSBAR
              </div>
              <div className="text-[10px] font-mono tracking-widest text-[#bef264] uppercase font-bold">
                INVESTOR PORTAL
              </div>
            </div>
          </Link>

          {/* Navigation Items (Exact pill styling matching screenshots) */}
          <nav className="space-y-1.5 font-sans">
            {/* 1. Overview */}
            <Link
              href="/investor"
              onClick={() => setMobileSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                isOverview
                  ? 'bg-[#bef264] text-black shadow-md shadow-[#bef264]/10 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${isOverview ? 'text-black' : 'text-zinc-400'}`} />
              <span>Overview</span>
            </Link>

            {/* 2. Bookings */}
            <Link
              href="/investor/bookings"
              onClick={() => setMobileSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                isBookings
                  ? 'bg-[#bef264] text-black shadow-md shadow-[#bef264]/10 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Calendar className={`w-4 h-4 ${isBookings ? 'text-black' : 'text-zinc-400'}`} />
              <span>Bookings</span>
            </Link>

            {/* 3. Expenses */}
            <Link
              href="/investor/expenses"
              onClick={() => setMobileSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                isExpenses
                  ? 'bg-[#bef264] text-black shadow-md shadow-[#bef264]/10 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Receipt className={`w-4 h-4 ${isExpenses ? 'text-black' : 'text-zinc-400'}`} />
              <span>Expenses</span>
            </Link>

            {/* 4. My payouts */}
            <Link
              href="/investor/payouts"
              onClick={() => setMobileSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                isPayouts
                  ? 'bg-[#bef264] text-black shadow-md shadow-[#bef264]/10 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${isPayouts ? 'text-black' : 'text-zinc-400'}`} />
              <span>My payouts</span>
            </Link>
          </nav>
        </div>

        {/* Bottom utility links (matching screenshots) */}
        <div className="pt-6 border-t border-white/[0.08] space-y-1 text-xs">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors"
          >
            <Globe className="w-4 h-4 text-zinc-500" />
            <span>View website</span>
          </Link>

          <button
            onClick={() => { switchDemoUser('player'); router.push('/player'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-zinc-500" />
            <span>Switch to Player demo</span>
          </button>

          <button
            onClick={() => { switchDemoUser('admin'); router.push('/admin'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-zinc-500" />
            <span>Switch to Admin demo</span>
          </button>

          <button
            onClick={handleResetData}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-zinc-500" />
            <span>Reset demo data</span>
          </button>

          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/[0.05] transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-zinc-500" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#060906] overflow-y-auto">
        
        {/* TOP BAR (EXACT MATCH ACROSS ALL PAGES) */}
        <header className="px-6 sm:px-10 py-5 flex items-center justify-between border-b border-white/[0.04]">
          {/* Left Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase font-sans">
              {headerTitle}
            </h1>
            
            {/* Quick dropdown for testing up to 10 investors when on Overview */}
            {isOverview && (
              <div className="relative group">
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
                <button className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 cursor-pointer">
                  <span>({activeInvestor.sharePercentage || 12}%)</span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </button>
              </div>
            )}
          </div>

          {/* Right Role Badge & Avatar matching screenshots */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider text-amber-300 border border-amber-400/60 bg-amber-400/10">
              INVESTOR
            </span>
            <div className="w-8 h-8 rounded-full bg-[#bef264] text-black font-black flex items-center justify-center text-xs shadow-md">
              I
            </div>
          </div>
        </header>

        {/* BODY CONTAINER */}
        <div className="p-6 sm:p-10 w-full">
          {children}
        </div>
      </main>

    </div>
  );
}
