'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useArena } from '../../context/ArenaContext';
import { CrossbarLogo } from '../../components/CrossbarLogo';
import { SCHEDULE_SLOTS_DEFINITION } from '../../data/initialData';
import { Clock, Calendar, Layers, TrendingUp, Users, Tag, AlertCircle, ShoppingBag, Package, ClipboardCheck, Trophy, Award, Camera, Globe, UserCheck, RotateCcw, LogOut, Menu, X, Plus } from 'lucide-react';
export default function AdminLayout({ children, }) {
    const pathname = usePathname();
    const router = useRouter();
    const { bookings, pricing, refunds, shopReservations, registrations, matchResults, handleBookingSuccess, switchDemoUser, logout } = useArena();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showWalkinModal, setShowWalkinModal] = useState(false);
    // Walk-in booking modal state
    const todayDateStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);
    const [walkinDate, setWalkinDate] = useState(todayDateStr);
    const [walkinSlotNum, setWalkinSlotNum] = useState(10);
    const [walkinTeam, setWalkinTeam] = useState('');
    const [walkinCaptain, setWalkinCaptain] = useState('');
    const [walkinPhone, setWalkinPhone] = useState('');
    const [walkinPrice, setWalkinPrice] = useState(3200);
    const [walkinPaid, setWalkinPaid] = useState(3200);
    const [walkinMethod, setWalkinMethod] = useState('cash');
    const pendingRefundsCount = refunds.filter(r => r.status === 'pending').length;
    const pendingOrdersCount = shopReservations.filter(r => r.status === 'reserved_pickup').length;
    const pendingRegistrationsCount = registrations.filter(r => r.status === 'pending').length;
    const pendingResultsCount = matchResults.filter(r => r.status === 'pending_approval').length;
    // Navigation Items matching exact screenshot order
    const navItems = [
        { label: 'Today', href: '/admin', icon: Clock },
        { label: 'Schedule', href: '/admin/schedule', icon: Calendar },
        { label: 'All bookings', href: '/admin/all-bookings', altHref: '/admin/bookings', icon: Layers },
        { label: 'Financial report', href: '/admin/financial-report', icon: TrendingUp },
        { label: 'Investors', href: '/admin/investors', icon: Users },
        { label: 'Slot pricing', href: '/admin/slot-pricing', icon: Tag },
        { label: 'Refunds', href: '/admin/refunds', icon: AlertCircle, badge: pendingRefundsCount },
        { label: 'Shop orders', href: '/admin/shop-orders', icon: ShoppingBag, badge: pendingOrdersCount },
        { label: 'Products', href: '/admin/products', icon: Package },
        { label: 'Registrations', href: '/admin/registrations', icon: ClipboardCheck, badge: pendingRegistrationsCount },
        { label: 'Events', href: '/admin/events', icon: Trophy },
        { label: 'Match results', href: '/admin/match-results', icon: Award, badge: pendingResultsCount },
        { label: 'Gallery', href: '/admin/gallery', icon: Camera },
    ];
    // Dynamic Header Title
    const headerTitle = useMemo(() => {
        if (!pathname || pathname === '/admin' || pathname === '/admin/') {
            const d = new Date();
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = d.getDate();
            const monthName = d.toLocaleDateString('en-US', { month: 'short' });
            return `Today · ${dayName}, ${dayNum} ${monthName}`;
        }
        if (pathname.includes('/schedule'))
            return 'SCHEDULE';
        if (pathname.includes('/all-bookings') || pathname.includes('/bookings'))
            return 'All bookings';
        if (pathname.includes('/financial-report'))
            return 'Financial report · October 2026';
        if (pathname.includes('/investors'))
            return 'Investors';
        if (pathname.includes('/slot-pricing'))
            return 'Slot pricing & Matrix';
        if (pathname.includes('/refunds'))
            return 'Refunds Management';
        if (pathname.includes('/shop-orders'))
            return 'Shop Orders';
        if (pathname.includes('/products'))
            return 'Products & Inventory';
        if (pathname.includes('/registrations'))
            return 'Tournament Registrations';
        if (pathname.includes('/events'))
            return 'Events Hub';
        if (pathname.includes('/match-results'))
            return 'Match results';
        if (pathname.includes('/gallery'))
            return 'Gallery Photos';
        return 'Admin Panel';
    }, [pathname]);
    // Create Walk-in Booking
    const handleCreateWalkin = (e) => {
        e.preventDefault();
        if (!walkinTeam.trim() || !walkinCaptain.trim() || !walkinPhone.trim())
            return;
        const def = SCHEDULE_SLOTS_DEFINITION.find(s => s.slotNumber === walkinSlotNum) || SCHEDULE_SLOTS_DEFINITION[0];
        const isFull = walkinPaid >= walkinPrice;
        const due = Math.max(0, walkinPrice - walkinPaid);
        const newBooking = {
            id: `walkin-${Date.now()}`,
            bookingCode: `CMA-W${Math.floor(1000 + Math.random() * 9000)}`,
            courtId: 'main-turf',
            courtName: 'Crossbar Metro Arena (Main Turf)',
            date: walkinDate,
            slotNumber: def.slotNumber,
            startTime: def.startTime,
            endTime: def.endTime,
            displayTime: def.displayTime,
            captainName: walkinCaptain.trim(),
            captainPhone: walkinPhone.trim(),
            teamName: walkinTeam.trim(),
            playerCount: 14,
            matchType: 'friendly',
            addOns: [],
            courtPrice: walkinPrice,
            addOnsPrice: 0,
            totalPrice: walkinPrice,
            paymentType: isFull ? 'full_payment' : 'advance_500',
            advanceAmount: walkinPaid,
            dueAmount: due,
            paymentMethod: walkinMethod,
            paymentStatus: isFull ? 'paid_full' : 'paid_advance',
            isWalkIn: true,
            notes: 'Counter Walk-In Recorded by Admin Desk',
            createdAt: new Date().toISOString()
        };
        handleBookingSuccess(newBooking);
        setShowWalkinModal(false);
        setWalkinTeam('');
        setWalkinCaptain('');
        setWalkinPhone('');
    };
    const handleResetData = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };
    return (<div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#080d12]/95 backdrop-blur-md border-b border-emerald-500/20 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 group">
          <CrossbarLogo size="sm" showSubtitle={false}/>
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            ADMIN
          </span>
        </Link>
        <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors" aria-label="Toggle navigation">
          {mobileSidebarOpen ? <X className="w-5 h-5 text-emerald-400"/> : <Menu className="w-5 h-5"/>}
        </button>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileSidebarOpen && (<div onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden animate-fade-in" aria-hidden="true"/>)}

      {/* LEFT SIDEBAR (EXACT MATCH TO DESIGN SCREENSHOTS) */}
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
                <span className="text-[9px] font-mono tracking-[0.2em] text-lime-400 uppercase font-black">
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

                  {item.badge ? (<span className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${isActive ? 'bg-slate-950 text-lime-400' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
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

          <button type="button" onClick={() => { switchDemoUser('player'); router.push('/player'); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400/70"/>
            <span>Switch to Player demo</span>
          </button>

          <button type="button" onClick={() => { switchDemoUser('investor'); router.push('/investor'); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400/70"/>
            <span>Switch to Investor demo</span>
          </button>

          <button type="button" onClick={handleResetData} className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400/70"/>
            <span>Reset demo data</span>
          </button>

          <button type="button" onClick={() => { logout(); router.push('/'); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors text-left cursor-pointer">
            <LogOut className="w-3.5 h-3.5 text-rose-400/80"/>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#070b0e] overflow-y-auto">
        
        {/* TOP BAR MATCHING SCREENSHOT */}
        <header className="px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-emerald-500/15 bg-[#080d12]/70 backdrop-blur-md sticky top-0 z-30">
          {/* Header Title */}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide font-sans truncate">
              {headerTitle}
            </h1>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* + Walk-in booking button */}
            <button type="button" onClick={() => setShowWalkinModal(true)} className="px-3.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-lime-400/20 active:scale-95 transition-all cursor-pointer">
              <Plus className="w-3.5 h-3.5 stroke-[3]"/>
              <span className="hidden xs:inline">Walk-in booking</span>
            </button>

            {/* ADMIN Role Badge */}
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-black tracking-wider text-slate-950 bg-[#f59e0b]">
              ADMIN
            </span>

            {/* Avatar Circle */}
            <div className="w-7 h-7 rounded-full bg-lime-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-lime-400/20">
              A
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
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/30">
                  <Calendar className="w-4 h-4"/>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Create Walk-In Booking</h3>
                  <p className="text-[10px] text-slate-400">Lock turf slot at arena counter desk.</p>
                </div>
              </div>

              <button type="button" onClick={() => setShowWalkinModal(false)} className="text-slate-400 hover:text-white">
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
                    {SCHEDULE_SLOTS_DEFINITION.map(s => (<option key={s.slotNumber} value={s.slotNumber}>
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
                  <label className="block text-slate-300 font-semibold mb-1">Slot Total Price (৳)</label>
                  <input type="number" value={walkinPrice} onChange={e => setWalkinPrice(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white font-mono text-xs"/>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Collected at Counter (৳)</label>
                  <input type="number" value={walkinPaid} onChange={e => setWalkinPaid(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white font-mono text-xs"/>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                <select value={walkinMethod} onChange={e => setWalkinMethod(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 text-white text-xs">
                  <option value="cash">Cash (Counter)</option>
                  <option value="bkash">bKash Merchant</option>
                  <option value="nagad">Nagad</option>
                  <option value="card">POS Card</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowWalkinModal(false)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black uppercase tracking-wider">
                  Confirm Walk-in
                </button>
              </div>

            </form>
          </div>
        </div>)}

    </div>);
}
