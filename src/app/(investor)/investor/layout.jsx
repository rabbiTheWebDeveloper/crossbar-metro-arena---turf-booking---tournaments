'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useArena } from '@/context/ArenaContext';
import { InvestorContext } from '@/context/InvestorContext';
import { canAccessPortal, getDefaultPortalForRole } from '@/lib/permissions';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { BarChart3, Calendar, Receipt, CreditCard, Settings, Globe, LogOut, Menu, X, UserX } from 'lucide-react';

export default function InvestorDashboardLayout({ children }) {
    const pathname = usePathname() || '/investor';
    const router = useRouter();
    const { investors, myInvestorId, currentUser, isVisitor, authChecked, isLoadingData, logout } = useArena();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const portalAuthorized = canAccessPortal(currentUser, pathname);

    useEffect(() => {
        if (!authChecked) return;
        if (!portalAuthorized) {
            if (isVisitor) router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
            else router.replace(getDefaultPortalForRole(currentUser));
        }
    }, [authChecked, portalAuthorized, isVisitor, currentUser, pathname, router]);

    useEffect(() => {
        setMobileSidebarOpen(false);
    }, [pathname]);

    const selectedInvestorId = myInvestorId || '';
    const activeInvestor = useMemo(
        () => investors.find(i => i.id === selectedInvestorId) || null,
        [investors, selectedInvestorId]
    );
    const isLinked = Boolean(activeInvestor);

    const headerTitle = useMemo(() => {
        if (pathname.includes('/bookings')) return 'BOOKINGS';
        if (pathname.includes('/expenses')) return 'EXPENSES';
        if (pathname.includes('/payouts') || pathname.includes('/my-payouts')) return 'MY PAYOUTS';
        if (pathname.includes('/settings')) return 'ACCOUNT SETTINGS';
        return `PARTNER OVERVIEW · ${activeInvestor?.name || currentUser?.name || 'Partner'}`;
    }, [pathname, activeInvestor, currentUser?.name]);

    const isOverview = pathname === '/investor' || pathname === '/investor/';
    const isBookings = pathname.includes('/bookings');
    const isExpenses = pathname.includes('/expenses');
    const isPayouts = pathname.includes('/payouts') || pathname.includes('/my-payouts');
    const isSettings = pathname.includes('/settings');

    const avatarInitial = (currentUser?.name || 'P').trim().charAt(0).toUpperCase() || 'P';

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await logout();
            router.replace('/login');
            router.refresh();
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Before the session check finishes, the user comes from the login cookie (the proxy already verified the token),
    // so an allowed user sees the panel at once; anyone else sees the skeleton until the redirect above runs.
    if (!portalAuthorized) {
        return (
            <div className="min-h-dvh bg-[#070b0e] text-slate-100 flex items-center justify-center p-6 font-sans">
                <div className="w-full max-w-md space-y-4 animate-pulse" aria-busy="true">
                    <div className="h-10 w-48 rounded-xl bg-[#0c131a] border border-white/5 mx-auto" />
                    <div className="h-40 rounded-3xl bg-[#0c131a] border border-white/5" />
                </div>
            </div>
        );
    }

    const stillResolving = isLoadingData && !isLinked;

    const renderBody = () => {
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
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">No partner record linked yet</h2>
                <p className="text-xs text-slate-400">
                    Your investor account (<span className="font-mono text-white">{currentUser?.phone}</span>) is active, but no partner share record is linked yet. Contact Arena Management to link your equity profile.
                </p>
            </div>);
        }
        return children;
    };

    const mobileTabs = [
        { href: '/investor', label: 'Overview', icon: BarChart3, active: isOverview },
        { href: '/investor/bookings', label: 'Bookings', icon: Calendar, active: isBookings },
        { href: '/investor/expenses', label: 'Expenses', icon: Receipt, active: isExpenses },
        { href: '/investor/payouts', label: 'Payouts', icon: CreditCard, active: isPayouts },
        { href: '/investor/settings', label: 'Account', icon: Settings, active: isSettings }
    ];

    return (<div className="min-h-dvh bg-[#070b0e] text-slate-100 flex flex-col md:flex-row antialiased font-sans">

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 pt-safe bg-[#080d12]/95 backdrop-blur-xl border-b border-emerald-500/20 sticky top-0 z-40">
        <Link href="/investor" className="flex items-center gap-2 group min-w-0">
          <CrossbarLogo size="sm"/>
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            INVESTOR
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-rose-300 cursor-pointer" aria-label="Log out" title="Log out">
            <LogOut className="w-4 h-4"/>
          </button>
          <button type="button" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors" aria-label="Toggle navigation">
            {mobileSidebarOpen ? <X className="w-5 h-5 text-emerald-400"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileSidebarOpen && (<div onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 md:hidden animate-fade-in" aria-hidden="true"/>)}

      {/* LEFT SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#080d12] border-r border-emerald-500/20 flex flex-col justify-between p-5 transition-transform duration-200 ease-out shadow-2xl md:shadow-none
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0
      `}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link href="/investor" className="flex flex-col group">
              <CrossbarLogo variant="stacked" size="sm"/>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-mono tracking-[0.22em] text-emerald-400 uppercase font-black">
                  INVESTOR PORTAL
                </span>
              </div>
            </Link>

            <button type="button" onClick={() => setMobileSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
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

            <Link href="/investor/settings" onClick={() => setMobileSidebarOpen(false)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${isSettings
            ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
              <Settings className={`w-4 h-4 ${isSettings ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`}/>
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-emerald-500/15 space-y-2 text-xs">
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
              {avatarInitial}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white truncate">{currentUser?.name || 'Partner'}</div>
              <div className="text-[10.5px] font-mono text-emerald-400 truncate">{currentUser?.phone || ''}</div>
            </div>
          </div>

          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors">
            <Globe className="w-4 h-4 text-emerald-400/70"/>
            <span>Public website</span>
          </Link>

          <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors text-left cursor-pointer disabled:opacity-50">
            <LogOut className="w-4 h-4 text-rose-400/80"/>
            <span>{isLoggingOut ? 'Logging out…' : 'Log out'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#070b0e] bg-[radial-gradient(900px_500px_at_15%_-5%,rgba(76,191,2,0.08),transparent_60%)] overflow-y-auto">

        <header className="px-4 sm:px-8 lg:px-10 py-3.5 sm:py-5 flex items-center justify-between border-b border-emerald-500/15 bg-[#080d12]/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-xs sm:text-base font-bold text-white tracking-wide uppercase font-sans truncate">
              {headerTitle}
            </h1>
            {activeInvestor && (
              <span className="text-[11px] font-mono font-bold text-emerald-300 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 shrink-0">
                {activeInvestor.sharePercentage ?? 0}% Equity
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider text-emerald-300 border border-emerald-500/40 bg-emerald-500/10">
              {currentUser?.name || 'INVESTOR'}
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-emerald-400/25">
              {avatarInitial}
            </div>
          </div>
        </header>

        <div className="p-4 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:p-8 md:pb-8 lg:p-10 w-full flex-1">
          <InvestorContext.Provider value={{ activeInvestor, selectedInvestorId, setSelectedInvestorId: () => {}, canSwitch: false, isLinked }}>
            {renderBody()}
          </InvestorContext.Provider>
        </div>
      </main>

      {/* MOBILE BOTTOM APP TAB BAR */}
      <nav aria-label="Investor mobile navigation" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#080d12]/95 backdrop-blur-xl border-t border-white/10 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
        <div className="h-15 px-1.5 grid grid-cols-5 items-center max-w-lg mx-auto">
          {mobileTabs.map(t => {
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-95 ${
                  t.active ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${t.active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] tracking-tight truncate">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>);
}
