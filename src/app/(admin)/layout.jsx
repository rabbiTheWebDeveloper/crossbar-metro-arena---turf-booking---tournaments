'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useArena, todayDhaka } from '../../context/ArenaContext';
import { CrossbarLogo } from '../../components/CrossbarLogo';
import { SCHEDULE_SLOTS_DEFINITION } from '../../data/initialData';
import { Clock, Calendar, Layers, TrendingUp, Users, Tag, AlertCircle, ShoppingBag, Package, ClipboardCheck, Trophy, Award, Camera, Globe, UserCheck, LogOut, Menu, X, Plus, Repeat, UsersRound } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parseLocalDate = (iso) => {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
};
const PHONE_RE = /^01[3-9]\d{8}$/;

export default function AdminLayout({ children, }) {
    const pathname = usePathname();
    const router = useRouter();
    const { pricing, refunds, shopReservations, registrations, matchResults, handleBookingSuccess, switchDemoUser, logout, currentUser, demoMode } = useArena();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showWalkinModal, setShowWalkinModal] = useState(false);
    // Walk-in booking modal state
    const todayDateStr = useMemo(() => todayDhaka(), []);
    const [walkinDate, setWalkinDate] = useState(todayDateStr);
    const [walkinSlotNum, setWalkinSlotNum] = useState(10);
    const [walkinTeam, setWalkinTeam] = useState('');
    const [walkinCaptain, setWalkinCaptain] = useState('');
    const [walkinPhone, setWalkinPhone] = useState('');
    const [walkinListPrice, setWalkinListPrice] = useState(0);
    const [walkinPriceOverride, setWalkinPriceOverride] = useState(''); // '' = use list price
    const [walkinPaid, setWalkinPaid] = useState(0);
    const [walkinMethod, setWalkinMethod] = useState('cash');
    const [walkinNotes, setWalkinNotes] = useState('');
    const [walkinError, setWalkinError] = useState('');
    const [walkinSubmitting, setWalkinSubmitting] = useState(false);

    const slotList = pricing?.slotPrices?.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;

    // List price follows the admin pricing matrix + weekend rule whenever slot/date change
    useEffect(() => {
        const def = slotList.find(s => Number(s.slotNumber) === Number(walkinSlotNum)) || slotList[0];
        if (!def) return;
        const weekendDays = pricing?.weekendDays?.length ? pricing.weekendDays : ['Friday', 'Saturday'];
        const weekend = weekendDays.includes(DAY_NAMES[parseLocalDate(walkinDate).getDay()]);
        const price = Number(weekend ? def.weekendPrice : def.weekdayPrice) || 0;
        setWalkinListPrice(price);
        setWalkinPriceOverride('');
        setWalkinPaid(price);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walkinSlotNum, walkinDate, pricing?.weekendDays, slotList]);

    const walkinEffectivePrice = walkinPriceOverride === '' ? walkinListPrice : Math.max(0, Number(walkinPriceOverride) || 0);
    const walkinDue = Math.max(0, walkinEffectivePrice - (Number(walkinPaid) || 0));

    const pendingRefundsCount = refunds.filter(r => r.status === 'pending').length;
    const pendingOrdersCount = shopReservations.filter(r => r.status === 'reserved_pickup').length;
    const pendingRegistrationsCount = registrations.filter(r => r.status === 'pending').length;
    const pendingResultsCount = matchResults.filter(r => r.status === 'pending_approval').length;

    const navItems = [
        { label: 'Today', href: '/admin', icon: Clock },
        { label: 'Schedule', href: '/admin/schedule', icon: Calendar },
        { label: 'All bookings', href: '/admin/all-bookings', altHref: '/admin/bookings', icon: Layers },
        { label: 'Fixed slots (bulk)', href: '/admin/recurring', icon: Repeat },
        { label: 'Financial report', href: '/admin/financial-report', icon: TrendingUp },
        { label: 'Investors', href: '/admin/investors', icon: Users },
        { label: 'Slot pricing', href: '/admin/slot-pricing', icon: Tag },
        { label: 'Refunds', href: '/admin/refunds', icon: AlertCircle, badge: pendingRefundsCount },
        { label: 'Shop orders', href: '/admin/shop-orders', icon: ShoppingBag, badge: pendingOrdersCount },
        { label: 'Products', href: '/admin/products', icon: Package },
        { label: 'Registrations', href: '/admin/registrations', icon: ClipboardCheck, badge: pendingRegistrationsCount },
        { label: 'Players', href: '/admin/players', icon: UsersRound },
        { label: 'Events', href: '/admin/events', icon: Trophy },
        { label: 'Match results', href: '/admin/match-results', icon: Award, badge: pendingResultsCount },
        { label: 'Gallery', href: '/admin/gallery', icon: Camera },
    ];

    // Dynamic Header Title
    const headerTitle = useMemo(() => {
        if (!pathname || pathname === '/admin' || pathname === '/admin/') {
            const d = parseLocalDate(todayDateStr);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = d.getDate();
            const monthName = d.toLocaleDateString('en-US', { month: 'short' });
            return `Today · ${dayName}, ${dayNum} ${monthName}`;
        }
        if (pathname.includes('/schedule')) return 'SCHEDULE';
        if (pathname.includes('/all-bookings') || pathname.includes('/bookings')) return 'All bookings';
        if (pathname.includes('/recurring')) return 'Fixed weekly slots · Bulk booking';
        if (pathname.includes('/players')) return 'Registered players';
        if (pathname.includes('/financial-report')) return `Financial report · ${parseLocalDate(todayDateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        if (pathname.includes('/investors')) return 'Investors';
        if (pathname.includes('/slot-pricing')) return 'Slot pricing & Matrix';
        if (pathname.includes('/refunds')) return 'Refunds Management';
        if (pathname.includes('/shop-orders')) return 'Shop Orders';
        if (pathname.includes('/products')) return 'Products & Inventory';
        if (pathname.includes('/registrations')) return 'Tournament Registrations';
        if (pathname.includes('/events')) return 'Events Hub';
        if (pathname.includes('/match-results')) return 'Match results';
        if (pathname.includes('/gallery')) return 'Gallery Photos';
        return 'Admin Panel';
    }, [pathname, todayDateStr]);

    const resetWalkinForm = () => {
        setWalkinTeam('');
        setWalkinCaptain('');
        setWalkinPhone('');
        setWalkinNotes('');
        setWalkinPriceOverride('');
        setWalkinError('');
    };

    // Create Walk-in Booking (server prices it; cash collected decides the payment status)
    const handleCreateWalkin = async (e) => {
        e.preventDefault();
        if (walkinSubmitting) return;
        setWalkinError('');
        const phone = walkinPhone.replace(/[^0-9]/g, '').replace(/^8801/, '01');
        if (!walkinTeam.trim() || !walkinCaptain.trim()) { setWalkinError('Team name and captain name are required.'); return; }
        if (!PHONE_RE.test(phone)) { setWalkinError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).'); return; }
        const collected = Math.max(0, Number(walkinPaid) || 0);
        if (collected > walkinEffectivePrice) { setWalkinError('Collected amount cannot exceed the slot price.'); return; }
        const payload = {
            date: walkinDate,
            slotNumber: Number(walkinSlotNum),
            captainName: walkinCaptain.trim(),
            captainPhone: phone,
            teamName: walkinTeam.trim(),
            advanceAmount: collected,
            paymentMethod: collected > 0 ? walkinMethod : 'pay_at_turf',
            notes: walkinNotes.trim() || `Counter walk-in recorded by ${currentUser?.name || 'admin desk'}`,
            isWalkIn: true
        };
        if (walkinPriceOverride !== '' && Number(walkinPriceOverride) !== walkinListPrice) payload.courtPrice = walkinEffectivePrice;
        setWalkinSubmitting(true);
        const res = await handleBookingSuccess(payload);
        setWalkinSubmitting(false);
        if (res?.ok) {
            setShowWalkinModal(false);
            resetWalkinForm();
        } else {
            setWalkinError(res?.error || 'Could not create the booking. The slot may already be taken.');
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const avatarInitial = (currentUser?.name || 'A').trim().charAt(0).toUpperCase() || 'A';

    return (<div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col md:flex-row antialiased font-sans">

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#080d12]/95 backdrop-blur-md border-b border-emerald-500/20 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 group">
          <CrossbarLogo size="sm" showSubtitle={false}/>
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            ADMIN
          </span>
        </Link>
        <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors" aria-label="Toggle navigation">
          {mobileSidebarOpen ? <X className="w-5 h-5 text-emerald-400"/> : <Menu className="w-5 h-5"/>}
        </button>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileSidebarOpen && (<div onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden animate-fade-in" aria-hidden="true"/>)}

      {/* LEFT SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-[#080d12] border-r border-emerald-500/15 flex flex-col justify-between p-4 transition-transform duration-200 ease-out shadow-2xl md:shadow-none
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:static md:w-60 md:shrink-0
      `}>
        {/* Top Logo & Brand */}
        <div className="overflow-y-auto pr-1">
          <div className="mb-6 px-2">
            <Link href="/" className="flex flex-col group">
              <CrossbarLogo size="sm" showSubtitle={false}/>
              <div className="pl-10 -mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                <span className="text-[10px] font-mono tracking-[0.2em] text-lime-400 uppercase font-black">
                  ADMIN PANEL
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 font-sans">
            {navItems.map(item => {
            const Icon = item.icon;
            const isActive = item.href === '/admin'
                ? pathname === '/admin' || pathname === '/admin/'
                : pathname === item.href || (item.altHref && pathname === item.altHref);
            return (<Link key={item.label} href={item.href} onClick={() => setMobileSidebarOpen(false)} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${isActive
                    ? 'bg-lime-400 text-slate-950 font-black shadow-lg shadow-lime-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`}/>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge ? (<span className={`min-w-4 h-4 px-1 rounded-full text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${isActive ? 'bg-slate-950 text-lime-400' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                      {item.badge}
                    </span>) : null}
                </Link>);
        })}
          </nav>
        </div>

        {/* Bottom Utility Links */}
        <div className="pt-4 border-t border-emerald-500/15 space-y-1 text-xs shrink-0">
          <Link href="/" className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors">
            <Globe className="w-3.5 h-3.5 text-emerald-400/70"/>
            <span>View website</span>
          </Link>

          {demoMode && (<>
            <button type="button" onClick={async () => { const r = await switchDemoUser('player'); if (r?.success) router.push('/player'); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400/70"/>
              <span>Switch to Player demo</span>
            </button>

            <button type="button" onClick={async () => { const r = await switchDemoUser('investor'); if (r?.success) router.push('/investor'); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400/70"/>
              <span>Switch to Investor demo</span>
            </button>
          </>)}

          <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors text-left cursor-pointer">
            <LogOut className="w-3.5 h-3.5 text-rose-400/80"/>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#070b0e] overflow-y-auto">

        {/* TOP BAR */}
        <header className="px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-emerald-500/15 bg-[#080d12]/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide font-sans truncate">
              {headerTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={() => { resetWalkinForm(); setShowWalkinModal(true); }} className="px-3.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-lime-400/20 active:scale-95 transition-all cursor-pointer">
              <Plus className="w-3.5 h-3.5 stroke-[3]"/>
              <span className="hidden xs:inline">Walk-in booking</span>
            </button>

            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-black tracking-wider text-slate-950 bg-[#f59e0b]">
              ADMIN
            </span>

            <div className="w-7 h-7 rounded-full bg-lime-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-lime-400/20" title={currentUser?.name || 'Admin'}>
              {avatarInitial}
            </div>
          </div>
        </header>

        {/* BODY CONTAINER */}
        <div className="p-4 sm:p-6 lg:p-8 w-full flex-1">
          {children}
        </div>
      </main>

      {/* WALK-IN BOOKING MODAL */}
      {showWalkinModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/30">
                  <Calendar className="w-4 h-4"/>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Create Walk-In Booking</h3>
                  <p className="text-[11px] text-slate-400">Record a counter booking. Price follows the slot matrix.</p>
                </div>
              </div>

              <button type="button" onClick={() => setShowWalkinModal(false)} className="text-slate-400 hover:text-white" aria-label="Close">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWalkin} className="space-y-3 text-xs">

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date</label>
                  <input type="date" required value={walkinDate} onChange={e => setWalkinDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white font-mono text-xs"/>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Slot</label>
                  <select value={walkinSlotNum} onChange={e => setWalkinSlotNum(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white text-xs">
                    {slotList.map(s => (<option key={s.slotNumber} value={s.slotNumber}>
                        {s.displayTime}
                      </option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Team Name *</label>
                <input type="text" required placeholder="e.g. Uttara Strikers" value={walkinTeam} onChange={e => setWalkinTeam(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white text-xs"/>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Captain Name *</label>
                  <input type="text" required placeholder="e.g. Rafiqul" value={walkinCaptain} onChange={e => setWalkinCaptain(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white text-xs"/>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Phone *</label>
                  <input type="tel" required placeholder="01711223344" value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white font-mono text-xs"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Slot Price (৳) <span className="text-slate-500 font-normal">list ৳{walkinListPrice.toLocaleString()}</span></label>
                  <input type="number" min={0} value={walkinPriceOverride === '' ? walkinListPrice : walkinPriceOverride} onChange={e => setWalkinPriceOverride(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white font-mono text-xs"/>
                  <span className="text-[10px] text-slate-500">Change only for a counter deal</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Collected at Counter (৳)</label>
                  <input type="number" min={0} max={walkinEffectivePrice} value={walkinPaid} onChange={e => setWalkinPaid(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white font-mono text-xs"/>
                  <span className="text-[10px] text-slate-500">{walkinDue > 0 ? `Due at arena: ৳${walkinDue.toLocaleString()}` : 'Paid in full'}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                <select value={walkinMethod} onChange={e => setWalkinMethod(e.target.value)} disabled={Number(walkinPaid) <= 0} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white text-xs disabled:opacity-50">
                  <option value="cash">Cash (Counter)</option>
                  <option value="bkash">bKash Merchant</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="card">POS Card</option>
                </select>
                {Number(walkinPaid) <= 0 && (<span className="text-[10px] text-amber-300">Nothing collected: the booking will be saved as &quot;pay at arena&quot;.</span>)}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes (optional)</label>
                <input type="text" value={walkinNotes} onChange={e => setWalkinNotes(e.target.value)} placeholder="e.g. Regular Friday squad" className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white text-xs"/>
              </div>

              {walkinError && (<div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                  {walkinError}
                </div>)}

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowWalkinModal(false)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={walkinSubmitting} className="flex-1 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed">
                  {walkinSubmitting ? 'Saving…' : 'Confirm Walk-in'}
                </button>
              </div>

            </form>
          </div>
        </div>)}

    </div>);
}
