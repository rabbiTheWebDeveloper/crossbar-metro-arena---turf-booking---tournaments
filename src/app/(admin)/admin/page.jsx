'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useArena, todayDhaka, collectedAmount } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { permissionLabel } from '@/lib/permissions';
import {
    ShoppingBag, Star, Download, Upload, ChevronRight, AlertCircle, Award,
    CalendarCheck, Wallet, BarChart3, TrendingUp, Clock, ArrowUpRight,
    Calendar, Layers, CreditCard, MessageSquare, Contact, ShieldCheck,
    Users, Tag, Package, Trophy, ClipboardCheck, Camera, Settings, UsersRound
} from 'lucide-react';
export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parseLocalDate = (iso) => {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
};
/** Dhaka calendar date (YYYY-MM-DD) of an ISO timestamp. */
const dhakaDate = (iso) => {
    if (!iso) return '';
    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Dhaka',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(iso));
    } catch {
        return String(iso).slice(0, 10);
    }
};
/** Convert "18:30" -> "06:30 PM", "00:30" -> "12:30 AM". */
const formatTime12 = (hhmm) => {
    const [hRaw, mRaw] = String(hhmm || '00:00').split(':').map(Number);
    const h = Number.isFinite(hRaw) ? hRaw : 0;
    const m = Number.isFinite(mRaw) ? mRaw : 0;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const PILL_COLORS = {
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
    slate: 'bg-slate-800/60 text-slate-300 border-white/10'
};
const DOT_COLORS = {
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    slate: 'bg-slate-400'
};
const Pill = ({ color, label, dot, pulse }) => (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border inline-flex items-center gap-1.5 whitespace-nowrap ${PILL_COLORS[color]}`}>
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[color]} ${pulse ? 'animate-pulse' : ''}`} />}
        <span>{label}</span>
    </span>
);
const StatusPill = ({ booking }) => {
    const b = booking;
    if (!b) {
        return (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border border-white/[0.07] bg-white/[0.02] text-slate-500">
                Open
            </span>
        );
    }
    if (b.paymentStatus === 'cancelled') return <Pill color="rose" label="Cancelled" />;
    if (b.played) return <Pill color="cyan" label="Played" dot />;
    if (b.paymentStatus === 'paid_full') return <Pill color="emerald" label="Paid" dot />;
    if (b.paymentStatus === 'paid_advance') return <Pill color="emerald" label="Advance paid" dot pulse />;
    if (b.paymentStatus === 'confirmed_unpaid') return <Pill color="amber" label="Pay at arena" dot />;
    if (b.paymentStatus === 'needs_refund') return <Pill color="rose" label="Needs refund" />;
    if (b.paymentStatus === 'pending_payment') return <Pill color="slate" label="Paying…" dot pulse />;
    return <Pill color="slate" label={String(b.paymentStatus || '').replaceAll('_', ' ')} />;
};

function StaffRoleDashboard({
    currentUser,
    can,
    financeReport,
    investorsCount,
    pendingRefundsCount,
    pendingOrdersCount,
    pendingRegistrationsCount,
    pendingResultsCount,
    shopProductsCount,
    tournamentsCount,
    galleryCount,
    playersCount
}) {
    const permissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
    const roleTitle = currentUser?.staffRoleName || 'Staff Member';

    const kpis = [
        can('finance') && {
            label: 'Month Revenue',
            value: `৳${Number(financeReport.totalRevenue || 0).toLocaleString()}`,
            sub: `Expenses ৳${Number(financeReport.totalExpenses || 0).toLocaleString()}`,
            tone: 'text-white'
        },
        can('finance') && {
            label: 'Month Net Profit',
            value: `${financeReport.netProfit < 0 ? '-' : ''}৳${Math.abs(Number(financeReport.netProfit || 0)).toLocaleString()}`,
            sub: `${Number(financeReport.profitMargin || 0).toFixed(1)}% net margin`,
            tone: financeReport.isLossMonth ? 'text-rose-400' : 'text-emerald-400'
        },
        can('investors') && {
            label: 'Active Partners',
            value: String(investorsCount),
            sub: `Pool ৳${Number(financeReport.totalInvestorShare || 0).toLocaleString()}`,
            tone: 'text-lime-400'
        },
        can('refunds') && {
            label: 'Pending Refunds',
            value: String(pendingRefundsCount),
            sub: pendingRefundsCount > 0 ? 'Awaiting payout review' : 'All clear',
            tone: pendingRefundsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
        },
        can('players') && {
            label: 'Registered Players',
            value: String(playersCount),
            sub: 'Active member accounts',
            tone: 'text-sky-300'
        },
        can('shop_orders') && {
            label: 'Shop Pickups',
            value: String(pendingOrdersCount),
            sub: 'Reserved at counter',
            tone: pendingOrdersCount > 0 ? 'text-amber-300' : 'text-white'
        },
        can('products') && {
            label: 'Pro Shop Items',
            value: String(shopProductsCount),
            sub: 'Catalogue items',
            tone: 'text-white'
        },
        can('events') && {
            label: 'Events & Cups',
            value: String(tournamentsCount),
            sub: 'Published tournaments',
            tone: 'text-lime-300'
        },
        can('registrations') && {
            label: 'Pending Squads',
            value: String(pendingRegistrationsCount),
            sub: 'Registrations to review',
            tone: pendingRegistrationsCount > 0 ? 'text-amber-300' : 'text-emerald-400'
        },
        can('matches') && {
            label: 'Pending Results',
            value: String(pendingResultsCount),
            sub: 'Scores awaiting approval',
            tone: pendingResultsCount > 0 ? 'text-emerald-300' : 'text-white'
        },
        can('gallery') && {
            label: 'Gallery Photos',
            value: String(galleryCount),
            sub: 'Live on website',
            tone: 'text-white'
        }
    ].filter(Boolean);

    const modules = [
        can('finance') && { href: '/admin/financial-report', label: 'Financial Report', desc: 'Monthly revenue, expenses & profit share', icon: TrendingUp },
        (can('finance') || can('bookings')) && { href: '/admin/payments', label: 'Payments Ledger', desc: 'Online EPS & counter payment records', icon: CreditCard },
        can('investors') && { href: '/admin/investors', label: 'Investors & Payouts', desc: 'Partner shares, SMS alerts & dividend payouts', icon: Users },
        can('pricing') && { href: '/admin/slot-pricing', label: 'Slot Pricing & Rules', desc: 'Weekday/weekend turf rates & booking rules', icon: Tag },
        can('refunds') && { href: '/admin/refunds', label: 'Refunds Queue', desc: 'Review & settle cancelled booking refunds', icon: AlertCircle, badge: pendingRefundsCount },
        can('players') && { href: '/admin/customers', label: 'Customers Directory', desc: 'Manage arena customers & contact records', icon: Contact },
        can('players') && { href: '/admin/customer-list', label: 'Customer Booking List', desc: 'Inspect booking history by customer', icon: Layers },
        can('players') && { href: '/admin/players', label: 'Player Accounts', desc: 'Manage registered player logins', icon: UsersRound },
        (can('players') || can('settings')) && { href: '/admin/bulk-sms', label: 'Bulk & Manual SMS', desc: 'Send announcements & check SMS balance', icon: MessageSquare },
        can('shop_orders') && { href: '/admin/shop-orders', label: 'Shop Orders', desc: 'Approve & hand over reserved gear', icon: ShoppingBag, badge: pendingOrdersCount },
        can('products') && { href: '/admin/products', label: 'Products & Stock', desc: 'Update pro shop inventory & prices', icon: Package },
        can('events') && { href: '/admin/events', label: 'Events & Tournaments', desc: 'Create & manage arena tournaments', icon: Trophy },
        can('registrations') && { href: '/admin/registrations', label: 'Registrations', desc: 'Approve tournament team entries', icon: ClipboardCheck, badge: pendingRegistrationsCount },
        can('matches') && { href: '/admin/match-results', label: 'Match Results', desc: 'Publish & verify match scores', icon: Award, badge: pendingResultsCount },
        can('gallery') && { href: '/admin/gallery', label: 'Website Gallery', desc: 'Upload & feature arena photos', icon: Camera },
        { href: '/admin/settings', label: 'Account & Settings', desc: can('settings') ? 'Venue profile, gateways & your password' : 'Update your profile, email & password', icon: Settings }
    ].filter(Boolean);

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* Role Welcome Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0e1a16] via-[#0c131a] to-[#0c131a] border border-emerald-500/25 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{roleTitle} Workspace</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white font-display truncate">
                        Welcome back, {currentUser?.name || 'Team Member'}
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xl">
                        Your dashboard displays live metrics and direct shortcuts for the modules assigned to your <strong className="text-slate-200">{roleTitle}</strong> role.
                    </p>
                    {permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {permissions.map(key => (
                                <span key={key} className="px-2.5 py-0.5 rounded-lg bg-lime-400/10 border border-lime-400/25 text-lime-300 text-[11px] font-semibold">
                                    {permissionLabel(key)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <Link
                    href="/admin/settings"
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-slate-200 inline-flex items-center justify-center gap-2 shrink-0 transition-colors"
                >
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>My Account</span>
                </Link>
            </div>

            {/* Live Role KPIs */}
            {kpis.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    {kpis.slice(0, 8).map(kpi => (
                        <div key={kpi.label} className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/[0.07] space-y-1.5 shadow-lg shadow-black/20">
                            <div className="text-xs text-slate-400 truncate">{kpi.label}</div>
                            <div className={`text-xl sm:text-2xl font-black font-mono ${kpi.tone}`}>{kpi.value}</div>
                            <div className="text-[11px] text-slate-500 truncate">{kpi.sub}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Permitted Modules Launchpad */}
            <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-slate-400 px-1">
                    Your Assigned Modules ({modules.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {modules.map(mod => {
                        const Icon = mod.icon;
                        return (
                            <Link
                                key={mod.href}
                                href={mod.href}
                                className="p-4 rounded-2xl bg-[#0c131a] border border-white/[0.07] hover:border-lime-400/35 transition-all flex items-start justify-between gap-3 group app-card-press"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/25 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-lime-400 group-hover:text-slate-950 transition-colors">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-white flex items-center gap-2">
                                            <span className="truncate">{mod.label}</span>
                                            {mod.badge > 0 && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white">
                                                    {mod.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11.5px] text-slate-400 mt-0.5 line-clamp-2">{mod.desc}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-lime-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function AdminTodayPage() {
    const {
        bookings, pricing, refunds, shopReservations, registrations, matchResults,
        investors, shopProducts, tournaments, galleryPhotos, users, currentUser, isAdmin,
        calculateMonthlyFinance, currentMonthFinance, exportDatabaseBackup, isLoadingData, can
    } = useArena();

    const todayStr = useMemo(() => todayDhaka(), []);
    const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);
    const financeReport = currentMonthFinance;

    // Today's play-date bookings (non-cancelled, excluding live gateway holds from the slot count)
    const todayBookings = useMemo(() => {
        return bookings.filter(b => b.date === todayStr && b.paymentStatus !== 'cancelled' && b.paymentStatus !== 'pending_payment');
    }, [bookings, todayStr]);

    // Money that actually arrived today (cash basis: paidAt, else createdAt, in Dhaka time)
    const todayCollected = useMemo(() => {
        return bookings.reduce((sum, b) => {
            if (b.isPublicView) return sum;
            const paidDay = dhakaDate(b.paidAt || b.createdAt);
            return paidDay === todayStr ? sum + collectedAmount(b) : sum;
        }, 0);
    }, [bookings, todayStr]);

    // Pending counts from live state
    const pendingOrdersCount = shopReservations.filter(r => r.status === 'reserved_pickup').length;
    const pendingRegistrationsCount = registrations.filter(r => r.status === 'pending').length;
    const pendingRefundsCount = refunds.filter(r => r.status === 'pending').length;
    const pendingResultsCount = matchResults.filter(r => r.status === 'pending_approval').length;

    // 12 Slots for Today
    const todaySlots = useMemo(() => {
        const weekendDays = pricing?.weekendDays?.length ? pricing.weekendDays : ['Friday', 'Saturday'];
        const isWeekend = weekendDays.includes(DAY_NAMES[parseLocalDate(todayStr).getDay()]);
        const slotList = pricing?.slotPrices?.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        return slotList.map(def => {
            const b = bookings.find(item => item.date === todayStr && Number(item.slotNumber) === Number(def.slotNumber) && item.paymentStatus !== 'cancelled');
            const price = Number(isWeekend ? def.weekendPrice : def.weekdayPrice) || 0;
            return { ...def, booking: b, price };
        });
    }, [bookings, todayStr, pricing?.slotPrices, pricing?.weekendDays]);

    // 6 months net profit from the finance engine
    const sixMonthsProfit = useMemo(() => {
        const result = [];
        const [currY, currM] = currentMonthStr.split('-').map(Number);
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currY, currM - 1 - i, 1);
            const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const mName = d.toLocaleDateString('en-US', { month: 'short' });
            const fin = mStr === currentMonthStr ? financeReport : calculateMonthlyFinance(mStr);
            result.push({ month: mName, net: fin.netProfit, isLoss: fin.netProfit <= 0 });
        }
        const maxAbs = Math.max(1, ...result.map(r => Math.abs(r.net)));
        return result.map(r => ({
            ...r,
            valK: Math.round((r.net / 1000) * 10) / 10,
            height: r.net === 0 ? 4 : Math.max(8, (Math.abs(r.net) / maxAbs) * 100)
        }));
    }, [calculateMonthlyFinance, currentMonthStr, financeReport]);

    const dailyMax = useMemo(
        () => Math.max(1, ...financeReport.dailyBreakdown.map(d => d.slotsBooked)),
        [financeReport.dailyBreakdown]
    );

    const fmtK = (n) => `${n < 0 ? '-' : ''}৳${(Math.abs(n) / 1000).toFixed(1)}k`;
    const todayFillPct = Math.min(100, Math.round((todayBookings.length / 12) * 100));
    const canBookings = can('bookings');
    const canFinance = can('finance');
    const activeInvestorsCount = useMemo(
        () => (investors || []).filter(i => (i.status || 'active') === 'active').length,
        [investors]
    );
    const activePlayersCount = useMemo(
        () => (users || []).filter(u => u.role === 'player' && !u.disabled).length,
        [users]
    );

    if (!canBookings) {
        return (
            <StaffRoleDashboard
                currentUser={currentUser}
                can={can}
                financeReport={financeReport}
                investorsCount={activeInvestorsCount}
                pendingRefundsCount={pendingRefundsCount}
                pendingOrdersCount={pendingOrdersCount}
                pendingRegistrationsCount={pendingRegistrationsCount}
                pendingResultsCount={pendingResultsCount}
                shopProductsCount={(shopProducts || []).length}
                tournamentsCount={(tournaments || []).length}
                galleryCount={(galleryPhotos || []).length}
                playersCount={activePlayersCount}
            />
        );
    }

    if (isLoadingData && bookings.length === 0) {
        return (
            <div className="space-y-6 animate-pulse font-sans">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="h-28 rounded-2xl bg-[#0c131a] border border-white/5" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-14 rounded-2xl bg-[#0c131a] border border-white/5" />
                        ))}
                    </div>
                    <div className="lg:col-span-5 space-y-4">
                        <div className="h-56 rounded-3xl bg-[#0c131a] border border-white/5" />
                        <div className="h-48 rounded-3xl bg-[#0c131a] border border-white/5" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in font-sans">

            {/* 4 TOP KPI METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">

                <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0c131a]/95 border border-white/[0.07] hover:border-emerald-400/25 transition-colors shadow-lg shadow-black/20 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-400">Today&apos;s slots</span>
                        <span className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                            <CalendarCheck className="w-3.5 h-3.5" />
                        </span>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-[26px] font-black font-mono text-white leading-none">
                            {todayBookings.length}
                        </span>
                        <span className="text-sm font-mono text-slate-500 font-bold">/12</span>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-500"
                                style={{ width: `${todayFillPct}%` }}
                            />
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>{Math.max(0, 12 - todayBookings.length)} open</span>
                            <span className="font-mono text-slate-400">{todayFillPct}%</span>
                        </div>
                    </div>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0c131a]/95 border border-white/[0.07] hover:border-emerald-400/25 transition-colors shadow-lg shadow-black/20 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-400">Collected today</span>
                        <span className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                            <Wallet className="w-3.5 h-3.5" />
                        </span>
                    </div>
                    <div className="text-2xl sm:text-[26px] font-black font-mono text-white mt-2.5 leading-none">
                        ৳{todayCollected.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-400/90 mt-2.5 truncate">
                        Online + counter cash today
                    </div>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0c131a]/95 border border-white/[0.07] hover:border-emerald-400/25 transition-colors shadow-lg shadow-black/20 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-400 truncate">
                            Bookings · {parseLocalDate(todayStr).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="p-1.5 rounded-lg bg-sky-400/10 text-sky-400 border border-sky-400/20">
                            <BarChart3 className="w-3.5 h-3.5" />
                        </span>
                    </div>
                    <div className="text-2xl sm:text-[26px] font-black font-mono text-white mt-2.5 leading-none">
                        {financeReport.slotsBooked}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2.5">
                        <span className="font-mono text-slate-300 font-semibold">{financeReport.occupancyRate.toFixed(0)}%</span> monthly occupancy
                    </div>
                </div>

                {canFinance ? (
                    <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0c131a]/95 border border-white/[0.07] hover:border-emerald-400/25 transition-colors shadow-lg shadow-black/20 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-400">Net profit · month</span>
                            <span className={`p-1.5 rounded-lg border ${
                                financeReport.isLossMonth
                                    ? 'bg-rose-400/10 text-rose-400 border-rose-400/20'
                                    : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                            }`}>
                                <TrendingUp className="w-3.5 h-3.5" />
                            </span>
                        </div>
                        <div className={`text-2xl sm:text-[26px] font-black font-mono mt-2.5 leading-none ${
                            financeReport.isLossMonth ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                            {fmtK(financeReport.netProfit)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-2.5 truncate">
                            Rev ৳{(financeReport.totalRevenue / 1000).toFixed(0)}k · Exp ৳{(financeReport.totalExpenses / 1000).toFixed(0)}k
                        </div>
                    </div>
                ) : (
                    <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0c131a]/95 border border-white/[0.07] hover:border-emerald-400/25 transition-colors shadow-lg shadow-black/20 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-400">Due at Arena Today</span>
                            <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                <Clock className="w-3.5 h-3.5" />
                            </span>
                        </div>
                        <div className="text-2xl sm:text-[26px] font-black font-mono text-amber-300 mt-2.5 leading-none">
                            ৳{todayBookings.reduce((s, b) => s + (Number(b.dueAmount) || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2.5 truncate">
                            Balance to collect at kickoff
                        </div>
                    </div>
                )}

            </div>

            {/* MOBILE APP QUICK-SHORTCUTS STRIP */}
            <div className="md:hidden app-tab-strip -mx-0.5 px-0.5 py-0.5">
                {[
                    { show: can('bookings'), href: '/admin/schedule', label: 'Schedule', icon: Calendar },
                    { show: can('bookings'), href: '/admin/all-bookings', label: 'Bookings', icon: Layers },
                    { show: can('bookings') || can('finance'), href: '/admin/payments', label: 'Payments', icon: CreditCard },
                    { show: can('players') || can('bookings') || can('settings'), href: '/admin/bulk-sms', label: 'Bulk SMS', icon: MessageSquare },
                    { show: can('players'), href: '/admin/customers', label: 'Customers', icon: Contact },
                    { show: can('finance'), href: '/admin/financial-report', label: 'Finance', icon: TrendingUp }
                ].filter(item => item.show).map(item => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="px-3 py-2 rounded-2xl bg-[#0c131a] border border-white/[0.08] text-xs font-bold text-slate-200 flex items-center gap-1.5 app-card-press"
                        >
                            <Icon className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* ALERT BANNERS */}
            {((can('shop_orders') && pendingOrdersCount > 0) || (can('registrations') && pendingRegistrationsCount > 0) || (can('refunds') && pendingRefundsCount > 0) || (can('matches') && pendingResultsCount > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {can('refunds') && pendingRefundsCount > 0 && (
                        <Link
                            href="/admin/refunds"
                            className="p-3.5 rounded-2xl bg-rose-500/[0.06] border border-rose-500/25 hover:border-rose-400/45 flex items-center justify-between text-xs text-rose-200 transition-all group"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
                                    <AlertCircle className="w-4 h-4" />
                                </span>
                                <span className="font-semibold">{pendingRefundsCount} refund(s) pending review</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    )}

                    {can('shop_orders') && pendingOrdersCount > 0 && (
                        <Link
                            href="/admin/shop-orders"
                            className="p-3.5 rounded-2xl bg-amber-400/[0.06] border border-amber-400/25 hover:border-amber-400/45 flex items-center justify-between text-xs text-amber-200 transition-all group"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="p-1.5 rounded-lg bg-amber-400/15 text-amber-400">
                                    <ShoppingBag className="w-4 h-4" />
                                </span>
                                <span className="font-semibold">{pendingOrdersCount} shop reservation(s) waiting for pickup</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    )}

                    {can('registrations') && pendingRegistrationsCount > 0 && (
                        <Link
                            href="/admin/registrations"
                            className="p-3.5 rounded-2xl bg-amber-400/[0.06] border border-amber-400/25 hover:border-amber-400/45 flex items-center justify-between text-xs text-amber-200 transition-all group"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="p-1.5 rounded-lg bg-amber-400/15 text-amber-400">
                                    <Star className="w-4 h-4" />
                                </span>
                                <span className="font-semibold">{pendingRegistrationsCount} event registration(s) to review</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    )}

                    {can('matches') && pendingResultsCount > 0 && (
                        <Link
                            href="/admin/match-results"
                            className="p-3.5 rounded-2xl bg-emerald-400/[0.06] border border-emerald-400/25 hover:border-emerald-400/45 flex items-center justify-between text-xs text-emerald-200 transition-all group"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="p-1.5 rounded-lg bg-emerald-400/15 text-emerald-400">
                                    <Award className="w-4 h-4" />
                                </span>
                                <span className="font-semibold">{pendingResultsCount} match result(s) awaiting approval</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    )}
                </div>
            )}

            {/* TWO COLUMNS LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                {/* LEFT COLUMN: TODAY'S SCHEDULE */}
                <div className="lg:col-span-7 p-4 sm:p-5 rounded-3xl bg-[#0c131a]/85 border border-white/[0.07] space-y-3.5">
                    <div className="flex items-center justify-between gap-2 pb-1">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                                Today&apos;s Schedule
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[11px] font-mono text-slate-400">
                                {todayBookings.length}/12
                            </span>
                        </div>
                        <Link
                            href="/admin/schedule"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                        >
                            <span>Manage schedule</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="space-y-2">
                        {todaySlots.map(slot => {
                            const b = slot.booking;
                            const isBooked = !!b;
                            const isHold = b?.paymentStatus === 'pending_payment';
                            const cardClass = !isBooked
                                ? 'bg-[#080d12]/80 border-white/[0.06] hover:border-emerald-400/25'
                                : b.played
                                    ? 'bg-[#0a131b] border-cyan-500/25'
                                    : isHold
                                        ? 'bg-[#0c131a] border-white/15 border-dashed'
                                        : b.paymentStatus === 'confirmed_unpaid'
                                            ? 'bg-[#161209] border-amber-500/25'
                                            : 'bg-[#0b1811] border-emerald-500/25';

                            return (
                                <Link
                                    key={slot.slotNumber}
                                    href="/admin/schedule"
                                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs group ${cardClass}`}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] font-mono font-bold text-[12px] text-slate-100 shrink-0 tabular-nums">
                                            {formatTime12(slot.startTime)}
                                        </span>

                                        <div className="min-w-0">
                                            {!isBooked ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-slate-400 font-medium">Available slot</span>
                                                    <span className="text-slate-500 font-mono text-[12px]">
                                                        ৳{slot.price.toLocaleString()}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-white font-bold truncate flex items-center gap-1.5">
                                                        <span className="truncate">{b.captainName || 'Booked'}</span>
                                                        {b.teamName && (
                                                            <span className="text-slate-400 font-normal truncate hidden sm:inline">
                                                                · {b.teamName}
                                                            </span>
                                                        )}
                                                        {b.isRecurring && (
                                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-slate-300 shrink-0">
                                                                FIXED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                                        ৳{(Number(b.advanceAmount) || 0).toLocaleString()} of ৳{(Number(b.totalPrice) || 0).toLocaleString()}
                                                        {Number(b.dueAmount) > 0 && b.paymentStatus !== 'pending_payment' && (
                                                            <span className="text-amber-400 font-bold ml-1.5">
                                                                (Due ৳{Number(b.dueAmount).toLocaleString()})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        <StatusPill booking={b} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT COLUMN: CHARTS & TOOLS */}
                <div className="lg:col-span-5 space-y-4">

                    {canFinance && (
                        <div className="p-5 rounded-3xl bg-[#0c131a]/90 border border-white/[0.07] space-y-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                        Net profit · 6 months
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Cash basis: collected minus expenses
                                    </p>
                                </div>
                                <Link
                                    href="/admin/financial-report"
                                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-0.5 shrink-0"
                                >
                                    <span>Report</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="h-40 flex items-end justify-between gap-2 pt-5 px-2 border-b border-white/[0.06] pb-1">
                                {sixMonthsProfit.map(m => (
                                    <div key={m.month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                        <span className="text-[10px] font-mono text-slate-400 group-hover:text-white mb-1.5 transition-colors">
                                            {m.valK < 0 ? '-' : ''}৳{Math.abs(m.valK)}k
                                        </span>

                                        <div
                                            style={{ height: `${m.height}%` }}
                                            title={fmtK(m.net)}
                                            className={`w-full max-w-[30px] rounded-t-md transition-all group-hover:brightness-115 ${
                                                m.isLoss
                                                    ? 'bg-gradient-to-t from-rose-600/80 to-rose-400'
                                                    : 'bg-gradient-to-t from-emerald-600/80 to-lime-400'
                                            }`}
                                        />

                                        <span className="text-[11px] font-mono text-slate-400 mt-2">
                                            {m.month}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-5 rounded-3xl bg-[#0c131a]/90 border border-white/[0.07] space-y-3.5">
                        <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                Bookings per day · {parseLocalDate(`${currentMonthStr}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Slots by play date · busiest day {dailyMax} slot{dailyMax === 1 ? '' : 's'}
                            </p>
                        </div>

                        <div className="h-28 flex items-end gap-1 pt-4">
                            {financeReport.dailyBreakdown.map((d) => {
                                const heightPct = d.slotsBooked === 0 ? 4 : Math.max(10, (d.slotsBooked / dailyMax) * 100);
                                const isToday = d.date === todayStr;
                                return (
                                    <div key={d.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                        <div
                                            style={{ height: `${heightPct}%` }}
                                            className={`w-full rounded-t-xs transition-all cursor-pointer ${
                                                d.slotsBooked === 0
                                                    ? 'bg-white/[0.07]'
                                                    : isToday
                                                        ? 'bg-emerald-300 shadow-[0_0_8px_rgba(76,191,2,0.5)]'
                                                        : 'bg-emerald-400/85'
                                            } hover:brightness-125`}
                                        />
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#080d12] border border-white/15 text-white text-[11px] font-mono py-1 px-2 rounded-lg pointer-events-none z-20 whitespace-nowrap shadow-xl transition-opacity">
                                            Day {d.date.slice(8)}: {d.slotsBooked} · ৳{d.moneyCollected.toLocaleString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-white/[0.06]">
                            <span>1</span>
                            <span>6</span>
                            <span>11</span>
                            <span>16</span>
                            <span>21</span>
                            <span>26</span>
                            <span>{financeReport.dailyBreakdown.length}</span>
                        </div>
                    </div>

                    {/* Database Backup Utility Bar (Super Admin only) */}
                    {isAdmin && (
                        <div className="p-4 sm:p-5 rounded-3xl bg-[#0c131a]/90 border border-white/[0.07] text-xs space-y-2.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-slate-300 font-semibold">Database Backup</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={exportDatabaseBackup}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-400/12 hover:bg-emerald-400/20 border border-emerald-400/25 text-emerald-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Export JSON</span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled
                                        title="Restore from a JSON file is not supported. Data lives in MongoDB; backups are read-only exports."
                                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-slate-500 font-bold flex items-center gap-1.5 cursor-not-allowed opacity-60"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Restore</span>
                                    </button>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                Read-only JSON export. Production data lives in MongoDB; restore via your database tooling.
                            </p>
                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}
