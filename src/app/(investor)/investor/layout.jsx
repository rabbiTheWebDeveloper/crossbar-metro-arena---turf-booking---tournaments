'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useArena } from '@/context/ArenaContext';
import { InvestorContext } from '@/context/InvestorContext';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { BarChart3, Calendar, Receipt, CreditCard, Globe, ShieldCheck, LogOut, Menu, X, ChevronDown, UserX, LogIn } from 'lucide-react';

export default function InvestorDashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { investors, myInvestorId, currentUser, isAdmin, isVisitor, authChecked, isLoadingData, logout, setAuthModalInitialTab, setShowAuthModal } = useArena();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Admins may switch partner; everyone else is fixed to the record the server linked to their login.
    const [adminSelectedId, setAdminSelectedId] = useState('');
    useEffect(() => {
        if (!isAdmin) return;
        if (!adminSelectedId || !investors.some(i => i.id === adminSelectedId)) {
            setAdminSelectedId(investors[0]?.id || '');
        }
    }, [isAdmin, investors, adminSelectedId]);

    const selectedInvestorId = isAdmin ? adminSelectedId : (myInvestorId || '');
    const activeInvestor = useMemo(() => investors.find(i => i.id === selectedInvestorId) || null, [investors, selectedInvestorId]);
    const isLinked = Boolean(activeInvestor);

    const headerTitle = useMemo(() => {
        if (pathname.includes('/bookings')) return 'BOOKINGS';
        if (pathname.includes('/expenses')) return 'EXPENSES';
        if (pathname.includes('/payouts') || pathname.includes('/my-payouts')) return 'MY PAYOUTS';
        return `INVESTOR OVERVIEW · ${activeInvestor?.name || 'Partner'}`;
    }, [pathname, activeInvestor]);

    const isOverview = pathname === '/investor' || pathname === '/investor/';
    const isBookings = pathname.includes('/bookings');
    const isExpenses = pathname.includes('/expenses');
    const isPayouts = pathname.includes('/payouts') || pathname.includes('/my-payouts');

    const roleLabel = String(currentUser?.role || 'investor').toUpperCase();
    const avatarInitial = (currentUser?.name || 'P').trim().charAt(0).toUpperCase() || 'P';

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try { await logout(); } finally { setIsLoggingOut(false); }
        router.push('/');
    };

    const openLogin = () => { setAuthModalInitialTab('login'); setShowAuthModal(true); };

    const stillResolving = !authChecked || (isLoadingData && !isLinked);

    const renderBody = () => {
        if (isVisitor && authChecked) {
            return (<div className="max-w-md mx-auto mt-10 bg-[#0c131a]/95 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
                <LogIn className="w-8 h-8 text-emerald-400 mx-auto"/>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Partner sign-in required</h2>
                <p className="text-xs text-slate-400">Log in with the account linked to your partner record to view the investor portal.</p>
                <button type="button" onClick={openLogin} className="px-5 py-2.5 rounded-xl bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-emerald-300 transition-colors">Log in</button>
            </div>);
        }
        if (stillResolving) {
            return (<div className="w-full max-w-4xl space-y-4" aria-busy="true">
                <div className="h-8 w-56 rounded-xl bg-white/5 animate-pulse"/>
                <div className="h-44 rounded-2xl bg-white/5 animate-pulse"/>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(n => <div key={n} className="h-24 rounded-2xl bg-white/5 animate-pulse"/>)}
                </div>
            </div>);
        }
        if (!isLinked) {
            return (<div className="max-w-md mx-auto mt-10 bg-[#0c131a]/95 border border-amber-400/25 rounded-2xl p-8 text-center space-y-3">
                <UserX className="w-8 h-8 text-amber-400 mx-auto"/>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">No partner account linked</h2>
                <p className="text-xs text-slate-400">
                    {isAdmin
                        ? 'There are no partner records yet. Add one from the Admin Console under Investors.'
                        : 'No partner account is linked to your login — contact the arena desk and they will link your partner record to this phone number.'}
                </p>
                {isAdmin && (<Link href="/admin/investors" className="inline-block px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider">Manage investors</Link>)}
            </div>);
        }
        return children;
    };

    return (<div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col md:flex-row antialiased font-sans">

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#080d12]/95 backdrop-blur-md border-b border-emerald-500/20 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 group">
          <CrossbarLogo size="sm" showSubtitle={false}/>
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            INVESTOR
          </span>
        </Link>
        <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors" aria-label="Toggle navigation">
          {mobileSidebarOpen ? <X className="w-5 h-5 text-emerald-400"/> : <Menu className="w-5 h-5"/>}
        </button>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileSidebarOpen && (<div onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 md:hidden animate-fade-in" aria-hidden="true"/>)}

      {/* LEFT SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#080d12] border-r border-emerald-500/20 flex flex-col justify-between p-5 transition-transform duration-200 ease-out shadow-2xl md:shadow-none
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:static md:w-64 md:shrink-0
      `}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex flex-col group">
              <CrossbarLogo size="sm" showSubtitle={false}/>
              <div className="pl-10 -mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-mono tracking-[0.22em] text-emerald-400 uppercase font-black">
                  INVESTOR PORTAL
                </span>
              </div>
            </Link>

            <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
              <X className="w-5 h-5"/>
            </button>
          </div>

          <nav className="space-y-1.5 font-sans">
            <Link href="/investor" onClick={() => setMobileSidebarOpen(false)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${isOverview
            ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
              <BarChart3 className={`w-4 h-4 ${isOverview ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`}/>
              <span>Overview</span>
            </Link>

            <Link href="/investor/bookings" onClick={() => setMobileSidebarOpen(false)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${isBookings
            ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
              <Calendar className={`w-4 h-4 ${isBookings ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`}/>
              <span>Bookings</span>
            </Link>

            <Link href="/investor/expenses" onClick={() => setMobileSidebarOpen(false)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${isExpenses
            ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
              <Receipt className={`w-4 h-4 ${isExpenses ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`}/>
              <span>Expenses</span>
            </Link>

            <Link href="/investor/payouts" onClick={() => setMobileSidebarOpen(false)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${isPayouts
            ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
              <CreditCard className={`w-4 h-4 ${isPayouts ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`}/>
              <span>My payouts</span>
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-emerald-500/15 space-y-1 text-xs">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors">
            <Globe className="w-4 h-4 text-emerald-400/70"/>
            <span>View website</span>
          </Link>

          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors">
              <ShieldCheck className="w-4 h-4 text-emerald-400/70"/>
              <span>Admin Console</span>
            </Link>
          )}

          {!isVisitor && (
            <button onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors text-left cursor-pointer disabled:opacity-50">
              <LogOut className="w-4 h-4 text-rose-400/80"/>
              <span>{isLoggingOut ? 'Logging out…' : 'Log out'}</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#070b0e] bg-[radial-gradient(900px_500px_at_15%_-5%,rgba(76,191,2,0.08),transparent_60%)] overflow-y-auto">

        <header className="px-4 sm:px-8 lg:px-10 py-4 sm:py-5 flex items-center justify-between border-b border-emerald-500/15 bg-[#080d12]/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase font-sans truncate">
              {headerTitle}
            </h1>

            {/* Partner switcher: admins only. Investors are fixed to their own record. */}
            {isAdmin && investors.length > 0 && (<div className="relative group shrink-0">
                <select value={selectedInvestorId} onChange={(e) => setAdminSelectedId(e.target.value)} className="opacity-0 absolute inset-0 cursor-pointer w-full h-full" title="View as partner" aria-label="View as partner">
                  {investors.map(inv => (<option key={inv.id} value={inv.id} className="bg-slate-900 text-white">
                      {inv.name} ({inv.sharePercentage}%){inv.status === 'inactive' ? ' · inactive' : ''}
                    </option>))}
                </select>
                <button type="button" className="flex items-center gap-1 text-[12px] text-emerald-300 hover:text-emerald-200 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 cursor-pointer">
                  <span>({activeInvestor?.sharePercentage ?? 0}%)</span>
                  <ChevronDown className="w-3 h-3 text-emerald-400"/>
                </button>
              </div>)}
            {!isAdmin && activeInvestor && (
              <span className="text-[12px] text-emerald-300 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 shrink-0">
                {activeInvestor.sharePercentage ?? 0}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-mono font-bold tracking-wider text-emerald-300 border border-emerald-500/40 bg-emerald-500/10">
              {roleLabel}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-emerald-400/25" title={currentUser?.name || ''}>
              {avatarInitial}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8 lg:p-10 w-full flex-1">
          <InvestorContext.Provider value={{ activeInvestor, selectedInvestorId, setSelectedInvestorId: isAdmin ? setAdminSelectedId : () => {}, canSwitch: isAdmin, isLinked }}>
            {renderBody()}
          </InvestorContext.Provider>
        </div>
      </main>

    </div>);
}
