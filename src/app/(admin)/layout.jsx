'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useArena, todayDhaka } from '../../context/ArenaContext';
import { CrossbarLogo } from '../../components/CrossbarLogo';
import { SCHEDULE_SLOTS_DEFINITION } from '../../data/initialData';
import { canOpenAdminPath } from '../../lib/permissions';
import {
    Clock, Calendar, Layers, TrendingUp, Users, Tag, AlertCircle, ShoppingBag,
    Package, ClipboardCheck, Trophy, Award, Camera, Settings, ShieldCheck, KeyRound,
    Lock, Globe, UserCheck, LogOut, Menu, X, Plus, Repeat, UsersRound, Contact,
    PanelLeftClose, PanelLeftOpen, ExternalLink, CreditCard, ClipboardList, MessageSquare,
    LayoutGrid, ChevronLeft
} from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parseLocalDate = (iso) => {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
};
const PHONE_RE = /^01[3-9]\d{8}$/;
const SIDEBAR_COLLAPSE_KEY = 'crossbar_admin_sidebar_collapsed';

const BADGE_STYLES = {
    rose: {
        active: 'bg-rose-500 text-white shadow-sm shadow-rose-500/30',
        idle: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
        dot: 'bg-rose-400'
    },
    amber: {
        active: 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30',
        idle: 'bg-amber-400/15 text-amber-300 border border-amber-400/30',
        dot: 'bg-amber-400'
    },
    emerald: {
        active: 'bg-emerald-400 text-slate-950 shadow-sm shadow-emerald-400/30',
        idle: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30',
        dot: 'bg-emerald-400'
    }
};

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const {
        pricing, refunds, shopReservations, registrations, matchResults,
        handleBookingSuccess, switchDemoUser, logout, currentUser,
        demoMode, isAdmin, can, authChecked
    } = useArena();

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [mobileLauncherOpen, setMobileLauncherOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showWalkinModal, setShowWalkinModal] = useState(false);

    // Restore persisted desktop sidebar preference
    useEffect(() => {
        try {
            if (window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1') {
                setSidebarCollapsed(true);
            }
        } catch {
            // ignore storage errors
        }
    }, []);

    const toggleSidebarCollapsed = () => {
        setSidebarCollapsed(prev => {
            const next = !prev;
            try {
                window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? '1' : '0');
            } catch {
                // ignore storage errors
            }
            return next;
        });
    };

    // Close mobile drawer & app launcher on route change
    useEffect(() => {
        setMobileSidebarOpen(false);
        setMobileLauncherOpen(false);
    }, [pathname]);

    // Lock body scroll when mobile sidebar, app launcher, or walk-in modal is open; support Escape key
    useEffect(() => {
        if (!mobileSidebarOpen && !mobileLauncherOpen && !showWalkinModal) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showWalkinModal) setShowWalkinModal(false);
                else if (mobileLauncherOpen) setMobileLauncherOpen(false);
                else if (mobileSidebarOpen) setMobileSidebarOpen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [mobileSidebarOpen, mobileLauncherOpen, showWalkinModal]);

    // Walk-in booking modal state
    const todayDateStr = useMemo(() => todayDhaka(), []);
    const [walkinDate, setWalkinDate] = useState(todayDateStr);
    const [walkinSlotNum, setWalkinSlotNum] = useState(10);
    const [walkinTeam, setWalkinTeam] = useState('');
    const [walkinCaptain, setWalkinCaptain] = useState('');
    const [walkinPhone, setWalkinPhone] = useState('');
    const [walkinListPrice, setWalkinListPrice] = useState(0);
    const [walkinPriceOverride, setWalkinPriceOverride] = useState('');
    const [walkinPaid, setWalkinPaid] = useState(0);
    const [walkinMethod, setWalkinMethod] = useState('cash');
    const [walkinNotes, setWalkinNotes] = useState('');
    const [walkinError, setWalkinError] = useState('');
    const [walkinSubmitting, setWalkinSubmitting] = useState(false);

    const slotList = pricing?.slotPrices?.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;

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

    // Grouped navigation matching permission domains; empty groups are hidden automatically
    const navGroups = useMemo(() => {
        const groups = [
            {
                id: 'operations',
                label: 'Operations',
                items: [
                    { label: 'Today', href: '/admin', icon: Clock },
                    { label: 'Schedule', href: '/admin/schedule', icon: Calendar },
                    { label: 'All Bookings', href: '/admin/all-bookings', altHref: '/admin/bookings', icon: Layers },
                    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
                    { label: 'Fixed Slots', href: '/admin/recurring', icon: Repeat },
                    { label: 'Refunds', href: '/admin/refunds', icon: AlertCircle, badge: pendingRefundsCount, badgeTone: 'rose' },
                    { label: 'Customers', href: '/admin/customers', icon: Contact },
                    { label: 'Customer List', href: '/admin/customer-list', icon: ClipboardList },
                    { label: 'Players', href: '/admin/players', icon: UsersRound },
                    { label: 'Bulk SMS', href: '/admin/bulk-sms', icon: MessageSquare },
                ]
            },
            {
                id: 'finance',
                label: 'Finance',
                items: [
                    { label: 'Financial Report', href: '/admin/financial-report', icon: TrendingUp },
                    { label: 'Investors', href: '/admin/investors', icon: Users },
                    { label: 'Slot Pricing', href: '/admin/slot-pricing', icon: Tag },
                ]
            },
            {
                id: 'shop',
                label: 'Pro Shop',
                items: [
                    { label: 'Shop Orders', href: '/admin/shop-orders', icon: ShoppingBag, badge: pendingOrdersCount, badgeTone: 'amber' },
                    { label: 'Products', href: '/admin/products', icon: Package },
                ]
            },
            {
                id: 'tournaments',
                label: 'Tournaments',
                items: [
                    { label: 'Events', href: '/admin/events', icon: Trophy },
                    { label: 'Registrations', href: '/admin/registrations', icon: ClipboardCheck, badge: pendingRegistrationsCount, badgeTone: 'amber' },
                    { label: 'Match Results', href: '/admin/match-results', icon: Award, badge: pendingResultsCount, badgeTone: 'emerald' },
                ]
            },
            {
                id: 'system',
                label: 'System',
                items: [
                    { label: 'Gallery', href: '/admin/gallery', icon: Camera },
                    { label: 'Users', href: '/admin/users', icon: ShieldCheck },
                    { label: 'Roles & Permissions', href: '/admin/roles', icon: KeyRound },
                    { label: 'Settings', href: '/admin/settings', icon: Settings },
                ]
            }
        ];

        return groups
            .map(group => ({
                ...group,
                items: group.items.filter(item => canOpenAdminPath(currentUser, item.href))
            }))
            .filter(group => group.items.length > 0);
    }, [currentUser, pendingRefundsCount, pendingOrdersCount, pendingRegistrationsCount, pendingResultsCount]);

    const navItems = useMemo(() => navGroups.flatMap(g => g.items), [navGroups]);
    const totalPendingAlerts = pendingRefundsCount + pendingOrdersCount + pendingRegistrationsCount + pendingResultsCount;

    // Primary tabs pinned in the mobile bottom app bar (up to 4 permitted routes + More launcher)
    const mobilePrimaryTabs = useMemo(() => {
        const preferred = ['/admin', '/admin/schedule', '/admin/all-bookings', '/admin/payments', '/admin/customers', '/admin/financial-report', '/admin/settings'];
        const picked = [];
        for (const href of preferred) {
            if (picked.length >= 4) break;
            const found = navItems.find(it => it.href === href);
            if (found) picked.push(found);
        }
        for (const it of navItems) {
            if (picked.length >= 4) break;
            if (!picked.some(p => p.href === it.href)) picked.push(it);
        }
        return picked.map(it => ({
            ...it,
            shortLabel: it.href === '/admin/all-bookings' ? 'Bookings' : it.href === '/admin/financial-report' ? 'Finance' : it.label
        }));
    }, [navItems]);

    const pageAllowed = canOpenAdminPath(currentUser, pathname);
    const canTakeBookings = can('bookings');
    const roleBadge = isAdmin ? 'ADMIN' : (currentUser?.staffRoleName || 'STAFF');
    const isRootToday = !pathname || pathname === '/admin' || pathname === '/admin/';

    // Consistent Header Section + Title
    const headerMeta = useMemo(() => {
        if (!pathname || pathname === '/admin' || pathname === '/admin/') {
            const d = parseLocalDate(todayDateStr);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = d.getDate();
            const monthName = d.toLocaleDateString('en-US', { month: 'short' });
            return { section: 'Operations', title: `Today · ${dayName}, ${dayNum} ${monthName}` };
        }
        if (pathname.includes('/schedule')) return { section: 'Operations', title: 'Daily Schedule' };
        if (pathname.includes('/payments')) return { section: 'Operations', title: 'Booking Payments' };
        if (pathname.includes('/all-bookings') || pathname.includes('/bookings')) return { section: 'Operations', title: 'All Bookings' };
        if (pathname.includes('/recurring')) return { section: 'Operations', title: 'Fixed Weekly Slots' };
        if (pathname.includes('/refunds')) return { section: 'Operations', title: 'Refunds Queue' };
        if (pathname.includes('/customer-list')) return { section: 'Operations', title: 'Customer Booking List' };
        if (pathname.includes('/customers')) return { section: 'Operations', title: 'Customers' };
        if (pathname.includes('/players')) return { section: 'Operations', title: 'Registered Players' };
        if (pathname.includes('/bulk-sms')) return { section: 'Operations', title: 'Bulk & Manual SMS' };
        if (pathname.includes('/financial-report')) {
            const monthLabel = parseLocalDate(todayDateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return { section: 'Finance', title: `Financial Report · ${monthLabel}` };
        }
        if (pathname.includes('/investors')) return { section: 'Finance', title: 'Investors & Payouts' };
        if (pathname.includes('/slot-pricing')) return { section: 'Finance', title: 'Slot Pricing & Rules' };
        if (pathname.includes('/shop-orders')) return { section: 'Pro Shop', title: 'Shop Orders' };
        if (pathname.includes('/products')) return { section: 'Pro Shop', title: 'Products & Inventory' };
        if (pathname.includes('/registrations')) return { section: 'Tournaments', title: 'Registrations' };
        if (pathname.includes('/events')) return { section: 'Tournaments', title: 'Events Hub' };
        if (pathname.includes('/match-results')) return { section: 'Tournaments', title: 'Match Results' };
        if (pathname.includes('/gallery')) return { section: 'System', title: 'Gallery Photos' };
        if (pathname.includes('/users')) return { section: 'System', title: 'Users & Accounts' };
        if (pathname.includes('/roles')) return { section: 'System', title: 'Roles & Permissions' };
        if (pathname.includes('/settings')) return { section: 'System', title: 'Venue Settings' };
        return { section: 'Arena Desk', title: 'Admin Console' };
    }, [pathname, todayDateStr]);

    const resetWalkinForm = () => {
        setWalkinTeam('');
        setWalkinCaptain('');
        setWalkinPhone('');
        setWalkinNotes('');
        setWalkinPriceOverride('');
        setWalkinError('');
    };

    const handleCreateWalkin = async (e) => {
        e.preventDefault();
        if (walkinSubmitting) return;
        setWalkinError('');
        const phone = walkinPhone.replace(/[^0-9]/g, '').replace(/^8801/, '01');
        if (!walkinTeam.trim() || !walkinCaptain.trim()) {
            setWalkinError('Team name and captain name are required.');
            return;
        }
        if (!PHONE_RE.test(phone)) {
            setWalkinError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).');
            return;
        }
        const collected = Math.max(0, Number(walkinPaid) || 0);
        if (collected > walkinEffectivePrice) {
            setWalkinError('Collected amount cannot exceed the slot price.');
            return;
        }
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
        if (walkinPriceOverride !== '' && Number(walkinPriceOverride) !== walkinListPrice) {
            payload.courtPrice = walkinEffectivePrice;
        }
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

    const displayName = (currentUser?.name || 'Admin').trim();
    const roleDisplay = isAdmin ? 'Super Admin' : (currentUser?.staffRoleName || 'Staff');
    const userSubtext = currentUser?.phone || currentUser?.email || '';
    const avatarInitial = displayName.charAt(0).toUpperCase() || 'A';
    const avatarInitials = useMemo(() => {
        const parts = displayName.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return displayName.slice(0, 2).toUpperCase() || 'AD';
    }, [displayName]);

    return (
        <div className="admin-app min-h-dvh bg-[#060a0d] text-slate-100 flex flex-col md:flex-row antialiased font-sans">

            {/* MOBILE BACKDROP OVERLAY */}
            {mobileSidebarOpen && (
                <div
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 md:hidden animate-fade-in"
                    aria-hidden="true"
                />
            )}

            {/* LEFT SIDEBAR: Sticky viewport-height on desktop, slide-over drawer on mobile */}
            <aside
                aria-label="Admin navigation"
                className={`
                    fixed inset-y-0 left-0 z-50 h-dvh bg-[#080d12] border-r border-white/[0.07]
                    flex flex-col transition-all duration-200 ease-out shadow-2xl shadow-black/60 md:shadow-none
                    ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    md:sticky md:top-0 md:h-screen md:shrink-0
                    ${sidebarCollapsed ? 'w-64 md:w-[76px]' : 'w-64'}
                `}
            >
                {/* SIDEBAR HEADER / BRAND */}
                <div className={`shrink-0 h-16 px-4 border-b border-white/[0.06] flex items-center ${sidebarCollapsed ? 'justify-between md:justify-center' : 'justify-between'} gap-2`}>
                    <Link
                        href="/admin"
                        className="flex items-center gap-2.5 min-w-0 group"
                        title="Crossbar Metro Arena · Admin Desk"
                    >
                        {sidebarCollapsed ? (
                            <>
                                <span className="hidden md:inline-flex">
                                    <CrossbarLogo variant="mark" size="sm" />
                                </span>
                                <span className="md:hidden inline-flex items-center gap-2">
                                    <CrossbarLogo size="sm" />
                                </span>
                            </>
                        ) : (
                            <div className="flex flex-col min-w-0">
                                <CrossbarLogo size="sm" />
                                <div className="mt-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                    <span className="text-[10px] font-mono tracking-[0.2em] text-emerald-400/90 uppercase font-bold truncate">
                                        Arena Desk
                                    </span>
                                </div>
                            </div>
                        )}
                    </Link>

                    {/* Mobile close drawer button */}
                    <button
                        type="button"
                        onClick={() => setMobileSidebarOpen(false)}
                        className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        aria-label="Close navigation"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Desktop collapse toggle (expanded state) */}
                    {!sidebarCollapsed && (
                        <button
                            type="button"
                            onClick={toggleSidebarCollapsed}
                            className="hidden md:inline-flex p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors shrink-0"
                            title="Collapse sidebar"
                            aria-label="Collapse sidebar"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Desktop expand button bar when collapsed */}
                {sidebarCollapsed && (
                    <div className="hidden md:flex justify-center py-2 border-b border-white/[0.05] shrink-0">
                        <button
                            type="button"
                            onClick={toggleSidebarCollapsed}
                            className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/[0.05] transition-colors"
                            title="Expand sidebar"
                            aria-label="Expand sidebar"
                        >
                            <PanelLeftOpen className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* LOGGED-IN USER PROFILE CARD (Sidebar Top) */}
                <div className={`shrink-0 border-b border-white/[0.06] ${sidebarCollapsed ? 'px-3 py-3 md:px-2 md:py-3' : 'px-3 py-3'}`}>
                    {!authChecked ? (
                        <div className={`flex items-center gap-3 px-2 py-1.5 animate-pulse ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}>
                            <div className="w-10 h-10 rounded-full bg-white/[0.07] shrink-0" />
                            <div className={`min-w-0 flex-1 space-y-1.5 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
                                <div className="h-3.5 w-24 rounded bg-white/[0.08]" />
                                <div className="h-2.5 w-16 rounded bg-white/[0.05]" />
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/admin/settings"
                            onClick={() => setMobileSidebarOpen(false)}
                            title={`${displayName} · ${roleDisplay}${userSubtext ? ` (${userSubtext})` : ''}`}
                            className={`group flex items-center gap-3 rounded-2xl transition-all duration-150 ${
                                sidebarCollapsed
                                    ? 'px-2.5 py-2 md:justify-center md:px-0 md:py-1.5 hover:bg-white/[0.04]'
                                    : 'px-2.5 py-2 bg-white/[0.025] hover:bg-white/[0.055] border border-white/[0.06] hover:border-amber-400/25'
                            }`}
                        >
                            {/* Circular Avatar with Gold/Sky Ring & Online Green Status Dot */}
                            <div className="relative shrink-0">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-black text-xs tracking-wide shadow-inner transition-transform duration-150 group-hover:scale-[1.03] ${
                                        isAdmin
                                            ? 'bg-gradient-to-br from-[#16222c] via-[#101920] to-[#0a1016] text-amber-100 ring-2 ring-amber-400/80 shadow-amber-500/15'
                                            : 'bg-gradient-to-br from-[#13212c] via-[#0e1821] to-[#091017] text-sky-100 ring-2 ring-sky-400/75 shadow-sky-500/15'
                                    }`}
                                >
                                    {avatarInitials}
                                </div>
                                <span
                                    aria-label="Online"
                                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#080d12] shadow-[0_0_8px_rgba(76,191,2,0.7)]"
                                />
                            </div>

                            {/* User Name, Role & Contact */}
                            <div className={`min-w-0 flex-1 leading-tight ${sidebarCollapsed ? 'md:hidden' : ''}`}>
                                <div className="text-[13.5px] font-bold text-white group-hover:text-emerald-50 truncate">
                                    {displayName}
                                </div>
                                <div
                                    className={`text-[12px] font-semibold mt-0.5 truncate ${
                                        isAdmin ? 'text-amber-400' : 'text-sky-400'
                                    }`}
                                >
                                    {roleDisplay}
                                </div>
                                {userSubtext && (
                                    <div className="text-[10.5px] font-mono text-slate-500 mt-0.5 truncate">
                                        {userSubtext}
                                    </div>
                                )}
                            </div>
                        </Link>
                    )}
                </div>

                {/* SCROLLABLE GROUPED NAVIGATION */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
                    {navGroups.map((group, groupIdx) => (
                        <div key={group.id} className={groupIdx > 0 && sidebarCollapsed ? 'md:pt-2 md:border-t md:border-white/[0.05]' : ''}>
                            <div
                                className={`px-2.5 mb-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-slate-500 select-none ${
                                    sidebarCollapsed ? 'md:hidden' : ''
                                }`}
                            >
                                {group.label}
                            </div>

                            <nav className="space-y-0.5">
                                {group.items.map(item => {
                                    const Icon = item.icon;
                                    const isActive = item.href === '/admin'
                                        ? pathname === '/admin' || pathname === '/admin/'
                                        : pathname === item.href || (item.altHref && pathname === item.altHref);
                                    const tone = BADGE_STYLES[item.badgeTone || 'rose'];

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileSidebarOpen(false)}
                                            title={sidebarCollapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined}
                                            className={`group relative flex items-center rounded-xl text-[13px] transition-all duration-150 ${
                                                sidebarCollapsed
                                                    ? 'justify-between md:justify-center px-3 md:px-0 py-2.5 md:h-10'
                                                    : 'justify-between px-3 py-2'
                                            } ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-emerald-400/[0.16] via-emerald-400/[0.08] to-transparent text-white font-semibold border border-emerald-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                                                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent font-medium'
                                            }`}
                                        >
                                            {/* Left glowing active bar */}
                                            {isActive && (
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-400 shadow-[0_0_10px_rgba(76,191,2,0.8)]"
                                                />
                                            )}

                                            <div className={`flex items-center gap-2.5 min-w-0 ${sidebarCollapsed ? 'md:gap-0' : ''}`}>
                                                <Icon
                                                    className={`w-[17px] h-[17px] shrink-0 transition-colors ${
                                                        isActive
                                                            ? 'text-emerald-400 stroke-[2.25]'
                                                            : 'text-slate-500 group-hover:text-slate-300 stroke-[1.9]'
                                                    }`}
                                                />
                                                <span className={`truncate leading-tight ${sidebarCollapsed ? 'md:hidden' : ''}`}>
                                                    {item.label}
                                                </span>
                                            </div>

                                            {/* Expanded badge pill */}
                                            {item.badge > 0 && (
                                                <span
                                                    className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                                                        isActive ? tone.active : tone.idle
                                                    } ${sidebarCollapsed ? 'md:hidden' : ''}`}
                                                >
                                                    {item.badge > 99 ? '99+' : item.badge}
                                                </span>
                                            )}

                                            {/* Collapsed notification dot */}
                                            {item.badge > 0 && sidebarCollapsed && (
                                                <span
                                                    aria-hidden="true"
                                                    className={`hidden md:block absolute top-1.5 right-2.5 w-2 h-2 rounded-full ring-2 ring-[#080d12] ${tone.dot}`}
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* PINNED BOTTOM UTILITY FOOTER */}
                <div className="shrink-0 p-3 border-t border-white/[0.07] bg-[#070b10]/80 space-y-1">
                    <Link
                        href="/"
                        title="View website"
                        className={`flex items-center rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
                            sidebarCollapsed ? 'gap-2.5 px-3 py-2 md:justify-center md:px-0' : 'justify-between px-3 py-2'
                        }`}
                    >
                        <span className="flex items-center gap-2.5 min-w-0">
                            <Globe className="w-4 h-4 text-emerald-400/80 shrink-0" />
                            <span className={`truncate ${sidebarCollapsed ? 'md:hidden' : ''}`}>View Website</span>
                        </span>
                        {!sidebarCollapsed && <ExternalLink className="w-3 h-3 text-slate-600 shrink-0" />}
                    </Link>

                    {demoMode && (
                        <>
                            <button
                                type="button"
                                title="Switch to Player demo"
                                onClick={async () => {
                                    const r = await switchDemoUser('player');
                                    if (r?.success) router.push('/customer');
                                }}
                                className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors text-left ${
                                    sidebarCollapsed ? 'px-3 py-2 md:justify-center md:px-0' : 'px-3 py-2'
                                }`}
                            >
                                <UserCheck className="w-4 h-4 text-emerald-400/80 shrink-0" />
                                <span className={`truncate ${sidebarCollapsed ? 'md:hidden' : ''}`}>Player Demo</span>
                            </button>

                            <button
                                type="button"
                                title="Switch to Investor demo"
                                onClick={async () => {
                                    const r = await switchDemoUser('investor');
                                    if (r?.success) router.push('/investor');
                                }}
                                className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors text-left ${
                                    sidebarCollapsed ? 'px-3 py-2 md:justify-center md:px-0' : 'px-3 py-2'
                                }`}
                            >
                                <TrendingUp className="w-4 h-4 text-emerald-400/80 shrink-0" />
                                <span className={`truncate ${sidebarCollapsed ? 'md:hidden' : ''}`}>Investor Demo</span>
                            </button>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Log out"
                        className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/[0.08] transition-colors text-left ${
                            sidebarCollapsed ? 'px-3 py-2 md:justify-center md:px-0' : 'px-3 py-2'
                        }`}
                    >
                        <LogOut className="w-4 h-4 text-rose-400/80 shrink-0" />
                        <span className={`truncate ${sidebarCollapsed ? 'md:hidden' : ''}`}>Log out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN ADMIN WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#070b0e] bg-[radial-gradient(900px_480px_at_12%_-8%,rgba(76,191,2,0.08),transparent_62%)]">

                {/* UNIFIED STICKY TOP APP HEADER */}
                <header className="sticky top-0 z-30 pt-safe border-b border-white/[0.07] bg-[#080d12]/90 backdrop-blur-xl">
                    <div className="h-14 sm:h-16 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <button
                                type="button"
                                onClick={() => setMobileSidebarOpen(true)}
                                className="md:hidden relative w-9 h-9 rounded-xl bg-white/[0.04] active:scale-95 hover:bg-white/[0.08] border border-white/10 text-slate-200 flex items-center justify-center transition-all shrink-0"
                                aria-label="Open navigation drawer"
                            >
                                <Menu className="w-4.5 h-4.5" />
                                {totalPendingAlerts > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#080d12]" />
                                )}
                            </button>

                            {!isRootToday && (
                                <Link
                                    href="/admin"
                                    className="md:hidden w-8 h-8 rounded-xl bg-white/[0.03] active:scale-95 border border-white/[0.07] text-slate-400 hover:text-white flex items-center justify-center shrink-0"
                                    aria-label="Back to Today"
                                    title="Back to Today"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Link>
                            )}

                            <div className="min-w-0 leading-tight">
                                <div className="text-[9.5px] sm:text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-400/85 font-bold truncate">
                                    {headerMeta.section}
                                </div>
                                <h1 className="text-[14.5px] sm:text-lg font-extrabold text-white tracking-tight font-display truncate">
                                    {headerMeta.title}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {canTakeBookings && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetWalkinForm();
                                        setShowWalkinModal(true);
                                    }}
                                    className="hidden sm:flex btn-volt px-3.5 py-2 rounded-xl text-xs font-extrabold items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Walk-in booking</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setMobileLauncherOpen(true)}
                                className="md:hidden flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-white/[0.05] active:scale-95 border border-white/[0.09]"
                                aria-label="Open quick app menu"
                            >
                                <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 text-slate-950 font-black flex items-center justify-center text-[11px] shrink-0">
                                    {avatarInitial}
                                </div>
                                <span className={`text-[9.5px] font-mono font-bold tracking-wider uppercase max-w-[72px] truncate ${
                                    isAdmin ? 'text-amber-300' : 'text-sky-300'
                                }`}>
                                    {roleBadge}
                                </span>
                            </button>

                            <div
                                className="hidden md:flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]"
                                title={`${displayName} · ${isAdmin ? 'Full admin access' : `Staff role: ${roleBadge}`}`}
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm shadow-emerald-400/30 shrink-0">
                                    {avatarInitial}
                                </div>
                                <div className="hidden lg:flex flex-col min-w-0 leading-none">
                                    <span className="text-xs font-bold text-slate-100 max-w-[110px] truncate">
                                        {displayName}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider mt-0.5 truncate max-w-[110px] ${
                                        isAdmin ? 'text-amber-300' : 'text-sky-300'
                                    }`}>
                                        {roleBadge}
                                    </span>
                                </div>
                                <span
                                    className={`lg:hidden px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase max-w-[96px] truncate ${
                                        isAdmin
                                            ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                                            : 'bg-sky-400/15 text-sky-300 border border-sky-400/30'
                                    }`}
                                >
                                    {roleBadge}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* BODY CONTAINER (extra bottom padding on mobile for native bottom tab bar) */}
                <main className="px-3.5 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:p-6 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:p-6 lg:p-8 w-full max-w-[1440px] mx-auto flex-1">
                    {!authChecked ? (
                        <div className="space-y-4 animate-pulse" aria-busy="true">
                            <div className="h-10 w-64 rounded-xl bg-[#0c131a] border border-white/5" />
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="h-24 rounded-2xl bg-[#0c131a] border border-white/5" />
                                ))}
                            </div>
                            <div className="h-64 rounded-3xl bg-[#0c131a] border border-white/5" />
                        </div>
                    ) : pageAllowed ? children : (
                        <div className="max-w-md mx-auto mt-10 p-8 rounded-3xl bg-[#0c131a] border border-amber-400/25 text-center space-y-4 shadow-xl">
                            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center mx-auto">
                                <Lock className="w-6 h-6 text-amber-400" />
                            </div>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                {navItems.length <= 1 ? 'No access yet' : 'You do not have access to this page'}
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {navItems.length <= 1
                                    ? 'Your account has not been given a staff role with any permissions. Ask an admin to set one under Users.'
                                    : `Your role (${roleBadge}) does not include this section. Ask an admin if you need it.`}
                            </p>
                            {navItems.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-2 pt-1">
                                    {navItems.map(item => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* NATIVE MOBILE BOTTOM APP NAVIGATION BAR */}
            {authChecked && navItems.length > 0 && (
                <nav
                    aria-label="Mobile quick navigation"
                    className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#080d12]/95 backdrop-blur-xl border-t border-white/[0.09] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.65)]"
                >
                    <div className="h-16 px-2 flex items-center justify-around gap-1 max-w-lg mx-auto">
                        {mobilePrimaryTabs.slice(0, 2).map(tab => {
                            const Icon = tab.icon;
                            const active = tab.href === '/admin'
                                ? pathname === '/admin' || pathname === '/admin/'
                                : pathname === tab.href || (tab.altHref && pathname === tab.altHref);
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={`relative flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-95 ${
                                        active ? 'text-lime-400' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {active && (
                                        <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(90,214,10,0.9)]" />
                                    )}
                                    <Icon className={`w-5 h-5 ${active ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                                    <span className="text-[10px] font-semibold tracking-tight truncate max-w-[68px]">
                                        {tab.shortLabel}
                                    </span>
                                    {tab.badge > 0 && (
                                        <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#080d12]" />
                                    )}
                                </Link>
                            );
                        })}

                        {/* Center Floating "+ Walk-in" Action Button */}
                        {canTakeBookings && (
                            <div className="px-1 -mt-5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetWalkinForm();
                                        setShowWalkinModal(true);
                                    }}
                                    aria-label="New walk-in booking"
                                    className="w-12 h-12 rounded-2xl btn-volt flex items-center justify-center shadow-lg shadow-emerald-500/35 ring-4 ring-[#080d12] active:scale-92 transition-transform"
                                >
                                    <Plus className="w-6 h-6 stroke-[3]" />
                                </button>
                            </div>
                        )}

                        {mobilePrimaryTabs.slice(2, 4).map(tab => {
                            const Icon = tab.icon;
                            const active = tab.href === '/admin'
                                ? pathname === '/admin' || pathname === '/admin/'
                                : pathname === tab.href || (tab.altHref && pathname === tab.altHref);
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={`relative flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-95 ${
                                        active ? 'text-lime-400' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {active && (
                                        <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(90,214,10,0.9)]" />
                                    )}
                                    <Icon className={`w-5 h-5 ${active ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                                    <span className="text-[10px] font-semibold tracking-tight truncate max-w-[68px]">
                                        {tab.shortLabel}
                                    </span>
                                    {tab.badge > 0 && (
                                        <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#080d12]" />
                                    )}
                                </Link>
                            );
                        })}

                        {/* "More" App Grid Sheet Trigger */}
                        <button
                            type="button"
                            onClick={() => setMobileLauncherOpen(prev => !prev)}
                            className={`relative flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-95 ${
                                mobileLauncherOpen ? 'text-lime-400' : 'text-slate-400 hover:text-slate-200'
                            }`}
                            aria-expanded={mobileLauncherOpen}
                            aria-label="All admin sections"
                        >
                            <LayoutGrid className={`w-5 h-5 ${mobileLauncherOpen ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                            <span className="text-[10px] font-semibold tracking-tight">Apps</span>
                            {totalPendingAlerts > 0 && (
                                <span className="absolute top-0.5 right-3 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-[#080d12]">
                                    {totalPendingAlerts > 9 ? '9+' : totalPendingAlerts}
                                </span>
                            )}
                        </button>
                    </div>
                </nav>
            )}

            {/* MOBILE SLIDE-UP APP LAUNCHER SHEET ("Apps") */}
            {mobileLauncherOpen && (
                <div
                    className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-label="All Admin Sections"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setMobileLauncherOpen(false);
                    }}
                >
                    <div className="w-full max-h-[84dvh] bg-[#0a1016] border-t border-white/15 rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom pb-safe">
                        <div className="pt-2.5 pb-3 px-5 border-b border-white/[0.07] shrink-0">
                            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-3" aria-hidden="true" />
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                                        {avatarInitials}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-white truncate">{displayName}</div>
                                        <div className="text-[11px] font-mono text-emerald-400 truncate">
                                            {roleDisplay}{userSubtext ? ` · ${userSubtext}` : ''}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMobileLauncherOpen(false)}
                                    className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                                    aria-label="Close app menu"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
                            {navGroups.map(group => (
                                <div key={group.id}>
                                    <div className="px-1 mb-2 text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-slate-500">
                                        {group.label}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {group.items.map(item => {
                                            const Icon = item.icon;
                                            const active = item.href === '/admin'
                                                ? pathname === '/admin' || pathname === '/admin/'
                                                : pathname === item.href || (item.altHref && pathname === item.altHref);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setMobileLauncherOpen(false)}
                                                    className={`relative p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 app-card-press ${
                                                        active
                                                            ? 'bg-emerald-400/15 border-emerald-400/40 text-white'
                                                            : 'bg-[#0d151d] border-white/[0.06] text-slate-300 hover:border-white/15'
                                                    }`}
                                                >
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                                        active ? 'bg-lime-400 text-slate-950' : 'bg-white/[0.05] text-emerald-400'
                                                    }`}>
                                                        <Icon className="w-4.5 h-4.5" />
                                                    </div>
                                                    <span className="text-[11px] font-bold leading-tight line-clamp-1">
                                                        {item.label}
                                                    </span>
                                                    {item.badge > 0 && (
                                                        <span className="absolute top-1.5 right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                                                            {item.badge > 99 ? '99+' : item.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="pt-2 border-t border-white/[0.07] grid grid-cols-2 gap-2">
                                <Link
                                    href="/"
                                    onClick={() => setMobileLauncherOpen(false)}
                                    className="py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold text-slate-200 flex items-center justify-center gap-2"
                                >
                                    <Globe className="w-4 h-4 text-emerald-400" />
                                    <span>Public Website</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="py-2.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs font-bold text-rose-300 flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Log out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* WALK-IN BOOKING MODAL (Bottom sheet on phones, centered dialog on desktop) */}
            {showWalkinModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="walkin-modal-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !walkinSubmitting) setShowWalkinModal(false);
                    }}
                >
                    <div className="bg-[#0c131a] border-t sm:border border-emerald-500/25 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-7 max-w-md w-full shadow-2xl shadow-black/70 relative space-y-4 max-h-[92dvh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom sm:zoom-in-95">
                        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto sm:hidden" aria-hidden="true" />
                        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-400/12 text-emerald-400 border border-emerald-400/25">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 id="walkin-modal-title" className="text-base font-bold text-white font-display">
                                        Create Walk-In Booking
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Counter booking · price follows the slot matrix
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowWalkinModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateWalkin} className="space-y-3.5 text-xs">
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={walkinDate}
                                        onChange={e => setWalkinDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 focus:border-emerald-400/60 focus:outline-none text-white font-mono text-xs transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Slot</label>
                                    <select
                                        value={walkinSlotNum}
                                        onChange={e => setWalkinSlotNum(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 focus:border-emerald-400/60 focus:outline-none text-white text-xs transition-colors"
                                    >
                                        {slotList.map(s => (
                                            <option key={s.slotNumber} value={s.slotNumber}>
                                                {s.displayTime}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Team Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Uttara Strikers"
                                    value={walkinTeam}
                                    onChange={e => setWalkinTeam(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 focus:border-emerald-400/60 focus:outline-none text-white text-xs placeholder:text-slate-600 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Captain Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Rafiqul"
                                        value={walkinCaptain}
                                        onChange={e => setWalkinCaptain(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 focus:border-emerald-400/60 focus:outline-none text-white text-xs placeholder:text-slate-600 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Mobile Phone *</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="01711223344"
                                        value={walkinPhone}
                                        onChange={e => setWalkinPhone(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 focus:border-emerald-400/60 focus:outline-none text-white font-mono text-xs placeholder:text-slate-600 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">
                                        Slot Price (৳){' '}
                                        <span className="text-slate-500 font-normal font-mono">list ৳{walkinListPrice.toLocaleString()}</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={walkinPriceOverride === '' ? walkinListPrice : walkinPriceOverride}
                                        onChange={e => setWalkinPriceOverride(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 focus:border-emerald-400/60 focus:outline-none text-white font-mono text-xs transition-colors"
                                    />
                                    <span className="text-[10px] text-slate-500 mt-0.5 block">Change only for a counter deal</span>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Collected at Counter (৳)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={walkinEffectivePrice}
                                        value={walkinPaid}
                                        onChange={e => setWalkinPaid(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 focus:border-emerald-400/60 focus:outline-none text-white font-mono text-xs transition-colors"
                                    />
                                    <span className={`text-[10px] mt-0.5 block font-medium ${walkinDue > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                                        {walkinDue > 0 ? `Due at arena: ৳${walkinDue.toLocaleString()}` : 'Paid in full'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                                <select
                                    value={walkinMethod}
                                    onChange={e => setWalkinMethod(e.target.value)}
                                    disabled={Number(walkinPaid) <= 0}
                                    className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 focus:border-emerald-400/60 focus:outline-none text-white text-xs disabled:opacity-50 transition-colors"
                                >
                                    <option value="cash">Cash (Counter)</option>
                                    <option value="bkash">bKash Merchant</option>
                                    <option value="nagad">Nagad</option>
                                    <option value="rocket">Rocket</option>
                                    <option value="card">POS Card</option>
                                </select>
                                {Number(walkinPaid) <= 0 && (
                                    <span className="text-[10px] text-amber-300 mt-1 block">
                                        Nothing collected: booking will be saved as &quot;pay at arena&quot;.
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Notes (optional)</label>
                                <input
                                    type="text"
                                    value={walkinNotes}
                                    onChange={e => setWalkinNotes(e.target.value)}
                                    placeholder="e.g. Regular Friday squad"
                                    className="w-full px-3 py-2 rounded-xl bg-[#080d12] border border-white/10 focus:border-emerald-400/60 focus:outline-none text-white text-xs placeholder:text-slate-600 transition-colors"
                                />
                            </div>

                            {walkinError && (
                                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                                    {walkinError}
                                </div>
                            )}

                            <div className="pt-2 flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowWalkinModal(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-slate-300 font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={walkinSubmitting}
                                    className="flex-1 py-2.5 rounded-xl btn-volt uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {walkinSubmitting ? 'Saving…' : 'Confirm Walk-in'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
