'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    Search, RefreshCw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
    Phone, Mail, MapPin, Calendar, Users, Layers, Repeat, ShieldCheck,
    Download, AlertTriangle, Loader2, Copy, Check, CheckCircle2, Clock,
    ChevronsUpDown, ExternalLink, Wallet
} from 'lucide-react';
import { formatMoney, formatDate, paymentMethodLabel } from '@/data/finance';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;
const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400/60 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-colors';

const BOOKING_STATUS_META = {
    paid_full: { label: 'Paid', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    paid_advance: { label: 'Advance Paid', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    confirmed_unpaid: { label: 'Pay at Arena', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    needs_refund: { label: 'Refund Due', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
    cancelled: { label: 'Cancelled', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' }
};

const CHANNEL_META = {
    online: { label: 'Online', cls: 'bg-sky-400/10 text-sky-300 border-sky-400/25' },
    walk_in: { label: 'Walk-in', cls: 'bg-amber-400/10 text-amber-300 border-amber-400/25' },
    recurring: { label: 'Fixed Slot', cls: 'bg-violet-400/10 text-violet-300 border-violet-400/25' }
};

const SEGMENTS = [
    { key: 'booked', label: 'Booked Customers', countKey: 'bookedCustomers' },
    { key: 'multiple', label: 'Multiple Bookings (2+)', countKey: 'repeatCustomers' },
    { key: 'due', label: 'Has Due Balance', countKey: 'customersWithDue' },
    { key: 'single', label: 'Single Booking', countKey: 'singleBookingCustomers' },
    { key: 'all', label: 'All Customers', countKey: 'totalCustomers' }
];

const SORT_OPTIONS = [
    { value: 'recent', label: 'Sort: Latest booking' },
    { value: 'bookings_desc', label: 'Sort: Most bookings' },
    { value: 'paid_desc', label: 'Sort: Highest paid' },
    { value: 'due_desc', label: 'Sort: Highest due' },
    { value: 'name_asc', label: 'Sort: Name (A–Z)' }
];

const csvCell = (value) => {
    const str = String(value ?? '');
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
};

export default function AdminCustomerListPage() {
    const [customers, setCustomers] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [overview, setOverview] = useState({
        totalCustomers: 0,
        bookedCustomers: 0,
        repeatCustomers: 0,
        singleBookingCustomers: 0,
        customersWithDue: 0,
        totalBookings: 0,
        totalAllBookings: 0,
        totalRevenueCollected: 0,
        totalDueAmount: 0
    });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    // Filters & sorting
    const [segment, setSegment] = useState('booked');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [bookingType, setBookingType] = useState('');
    const [sort, setSort] = useState('recent');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);

    // Per-customer expanded accordion state + per-customer sub-filter
    const [expandedIds, setExpandedIds] = useState(() => new Set());
    const [bookingStatusFilterById, setBookingStatusFilterById] = useState({});
    const [copiedPhone, setCopiedPhone] = useState('');

    const latestReq = useRef(0);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [segment, debouncedSearch, bookingType, sort, fromDate, toDate]);

    const load = useCallback(async () => {
        const reqId = ++latestReq.current;
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            qs.set('segment', segment);
            qs.set('sort', sort);
            qs.set('page', String(page));
            qs.set('limit', String(PAGE_SIZE));
            if (debouncedSearch) qs.set('q', debouncedSearch);
            if (bookingType) qs.set('bookingType', bookingType);
            if (fromDate) qs.set('from', fromDate);
            if (toDate) qs.set('to', toDate);

            const res = await fetch(`/api/customers/bookings?${qs.toString()}`);
            const data = await res.json().catch(() => ({}));
            if (reqId !== latestReq.current) return;
            setLoading(false);
            if (!res.ok) {
                setLoadError(data.error || `Failed to load customer list (${res.status})`);
                return;
            }
            setLoadError('');
            setCustomers(data.customers || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
            if (data.overview) setOverview(data.overview);
            if (data.page && data.page !== page) setPage(data.page);
        } catch {
            if (reqId !== latestReq.current) return;
            setLoading(false);
            setLoadError('Network error while loading customer list.');
        }
    }, [segment, debouncedSearch, bookingType, sort, fromDate, toDate, page]);

    useEffect(() => { load(); }, [load]);

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const allOnPageExpanded = customers.length > 0 && customers.every(c => expandedIds.has(c.id));
    const toggleExpandAll = () => {
        if (allOnPageExpanded) {
            setExpandedIds(new Set());
        } else {
            setExpandedIds(new Set(customers.map(c => c.id)));
        }
    };

    const copyPhone = async (phone) => {
        try {
            await navigator.clipboard.writeText(phone);
            setCopiedPhone(phone);
            setTimeout(() => setCopiedPhone(prev => (prev === phone ? '' : prev)), 1500);
        } catch {
            // ignore clipboard errors
        }
    };

    const exportCsv = () => {
        const headers = [
            'Customer Name', 'Mobile', 'Email', 'Area', 'Has Login',
            'Active Bookings', 'Cancelled Bookings', 'Played', 'Teams',
            'Total Billed (BDT)', 'Total Paid (BDT)', 'Total Due (BDT)',
            'First Booking', 'Last Booking', 'Booking Codes'
        ];
        const lines = [headers.map(csvCell).join(',')];
        for (const c of customers) {
            const st = c.stats || {};
            lines.push([
                c.name,
                c.phone,
                c.email || '',
                c.area || '',
                c.hasLogin ? 'Yes' : 'No',
                st.totalBookings || 0,
                st.cancelledCount || 0,
                st.playedCount || 0,
                (c.teams || []).join(' | '),
                st.totalBilled || 0,
                st.totalPaid || 0,
                st.totalDue || 0,
                st.firstBookingDate || '',
                st.lastBookingDate || '',
                (c.bookings || []).map(b => `${b.bookingCode} (${b.date})`).join(' | ')
            ].map(csvCell).join(','));
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crossbar-customer-bookings-page-${page}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const hasActiveFilters = Boolean(debouncedSearch || bookingType || fromDate || toDate || segment !== 'booked');
    const clearFilters = () => {
        setSearch('');
        setBookingType('');
        setFromDate('');
        setToDate('');
        setSegment('booked');
        setSort('recent');
    };

    const repeatRate = overview.bookedCustomers > 0
        ? Math.round((overview.repeatCustomers / overview.bookedCustomers) * 100)
        : 0;
    const avgBookings = overview.bookedCustomers > 0
        ? (overview.totalBookings / overview.bookedCustomers).toFixed(1)
        : '0.0';

    return (<div className="space-y-5 animate-fade-in font-sans">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">Customer Booking List</h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Every customer grouped with all of their bookings in one place. Expand any customer to inspect their complete multi-booking history, teams, payment status, and due balances.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleExpandAll}
            disabled={customers.length === 0}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <ChevronsUpDown className="w-3.5 h-3.5"/>
            <span>{allOnPageExpanded ? 'Collapse all' : 'Expand all'}</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={customers.length === 0}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5"/>
            <span>Export CSV</span>
          </button>
          <Link
            href="/admin/customers"
            className="px-3 py-2 rounded-xl bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-slate-950 border border-lime-400/25 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Manage CRM</span>
            <ExternalLink className="w-3.5 h-3.5"/>
          </Link>
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
            title="Reload from database"
            aria-label="Reload customer list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Booked customers</span>
            <Users className="w-4 h-4 text-emerald-400"/>
          </div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white">{overview.bookedCustomers}</div>
          <div className="text-[11px] text-slate-500 font-mono">{overview.totalCustomers} total customers</div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Repeat (2+)</span>
            <Repeat className="w-4 h-4 text-lime-400"/>
          </div>
          <div className="text-xl sm:text-3xl font-black font-mono text-lime-400">{overview.repeatCustomers}</div>
          <div className="text-[11px] text-slate-500 font-mono">{repeatRate}% repeat rate</div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active bookings</span>
            <Layers className="w-4 h-4 text-sky-400"/>
          </div>
          <div className="text-xl sm:text-3xl font-black font-mono text-white">{overview.totalBookings}</div>
          <div className="text-[11px] text-slate-500 font-mono">avg {avgBookings} / customer</div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Collected / Due</span>
            <Wallet className="w-4 h-4 text-amber-400"/>
          </div>
          <div className="text-xl sm:text-3xl font-black font-mono text-emerald-400">{formatMoney(overview.totalRevenueCollected)}</div>
          <div className="text-[11px] font-mono">
            {overview.totalDueAmount > 0 ? (
              <span className="text-amber-300">due {formatMoney(overview.totalDueAmount)}</span>
            ) : (
              <span className="text-slate-500">all bookings settled</span>
            )}
          </div>
        </div>
      </div>

      {/* SEGMENT TABS */}
      <div className="app-tab-strip sm:flex-wrap" role="tablist" aria-label="Customer booking segments">
        {SEGMENTS.map(seg => {
            const active = segment === seg.key;
            const count = overview[seg.countKey] ?? 0;
            return (
              <button
                key={seg.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSegment(seg.key)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${active
                  ? 'bg-lime-400 text-slate-950 border-lime-400'
                  : 'bg-[#0c131a] text-slate-400 border-white/10 hover:text-white'}`}
              >
                {seg.label}{' '}
                <span className={`font-mono ml-1 ${active ? 'text-slate-950/75' : 'text-slate-500'}`}>{count}</span>
              </button>
            );
        })}
      </div>

      {/* SEARCH, CHANNEL, DATE RANGE & SORT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
        <div className="relative lg:col-span-4">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, team, booking code, email..."
            aria-label="Search customers and bookings"
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="lg:col-span-2">
          <select value={bookingType} onChange={e => setBookingType(e.target.value)} aria-label="Booking type" className={inputCls}>
            <option value="">All channels</option>
            <option value="online">Online bookings</option>
            <option value="walk_in">Walk-in / counter</option>
            <option value="recurring">Fixed weekly slots</option>
          </select>
        </div>
        <div className="lg:col-span-2">
          <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort customers" className={inputCls}>
            {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="lg:col-span-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="Bookings from date" aria-label="From date" className={`${inputCls} font-mono`}/>
        </div>
        <div className="lg:col-span-2 flex gap-2">
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="Bookings to date" aria-label="To date" className={`${inputCls} font-mono flex-1`}/>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer shrink-0">
              Clear
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0"/>
          <span>{loadError}</span>
        </div>
      )}

      {/* CUSTOMER MULTI-BOOKING LIST */}
      {loading && customers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin"/> Loading customers and bookings…
        </div>
      ) : customers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs space-y-2">
          <div className="text-sm font-bold text-white">No matching customers found.</div>
          <p>Try clearing your search or switching to &ldquo;All Customers&rdquo; to include customers with zero bookings.</p>
        </div>
      ) : (
        <div className={`space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {customers.map(c => {
              const st = c.stats || {};
              const isExpanded = expandedIds.has(c.id);
              const isMulti = (st.allBookingsCount || 0) >= 2;
              const subFilter = bookingStatusFilterById[c.id] || 'all';
              const customerBookings = (c.bookings || []).filter(b => {
                  if (subFilter === 'all') return true;
                  if (subFilter === 'due') return b.dueAmount > 0;
                  if (subFilter === 'paid') return b.paymentStatus === 'paid_full';
                  if (subFilter === 'cancelled') return b.paymentStatus === 'cancelled';
                  return true;
              });

              return (
                <div key={c.id} className={`rounded-2xl bg-[#0c131a] border transition-all overflow-hidden ${isExpanded ? 'border-lime-400/35 shadow-lg shadow-black/40' : 'border-white/5 hover:border-white/15'}`}>
                  {/* CUSTOMER SUMMARY HEADER ROW */}
                  <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 text-xs">
                    {/* Left: Identity & Contact */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-full font-black flex items-center justify-center text-sm font-mono shrink-0 ${isMulti ? 'bg-lime-400 text-slate-950' : 'bg-white/10 text-white'}`}>
                        {(c.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm truncate">{c.name}</span>
                          {c.hasLogin && (
                            <span title="Has customer login account" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[10px] font-mono">
                              <ShieldCheck className="w-3 h-3"/> Login
                            </span>
                          )}
                          {isMulti ? (
                            <span className="px-2 py-0.5 rounded-md bg-lime-400/15 border border-lime-400/30 text-lime-300 text-[10px] font-mono font-bold uppercase">
                              {st.allBookingsCount} bookings · repeat
                            </span>
                          ) : st.allBookingsCount === 1 ? (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px] font-mono font-bold uppercase">
                              1 booking
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-500 text-[10px] font-mono uppercase">
                              No bookings
                            </span>
                          )}
                          {st.upcomingCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-sky-400/15 border border-sky-400/30 text-sky-300 text-[10px] font-mono font-bold">
                              {st.upcomingCount} upcoming
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400">
                          <button
                            type="button"
                            onClick={() => copyPhone(c.phone)}
                            title="Copy mobile number"
                            className="inline-flex items-center gap-1 text-slate-200 hover:text-lime-300 cursor-pointer"
                          >
                            <Phone className="w-3 h-3 text-slate-500"/>
                            <span>{c.phone}</span>
                            {copiedPhone === c.phone ? <Check className="w-3 h-3 text-lime-400"/> : <Copy className="w-2.5 h-2.5 opacity-50"/>}
                          </button>
                          {c.email && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-500"/>{c.email}
                            </span>
                          )}
                          {c.area && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-500"/>{c.area}
                            </span>
                          )}
                        </div>

                        {(c.teams || []).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="text-[10px] text-slate-500 uppercase font-mono mr-0.5">Teams:</span>
                            {c.teams.slice(0, 4).map(t => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10 text-slate-300 text-[10px]">
                                {t}
                              </span>
                            ))}
                            {c.teams.length > 4 && (
                              <span className="text-[10px] text-slate-500 font-mono">+{c.teams.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Stats + Expand toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 w-full lg:w-auto pt-2.5 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
                      <div className="grid grid-cols-3 gap-3 text-center sm:text-right font-mono bg-[#080d12]/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Bookings</div>
                          <div className="text-sm font-black text-white">
                            {st.totalBookings || 0}
                            {st.cancelledCount > 0 && <span className="text-[10px] text-rose-400 font-normal ml-1">(-{st.cancelledCount})</span>}
                          </div>
                          <div className="text-[10px] text-slate-500">{st.playedCount || 0} played</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Paid</div>
                          <div className="text-sm font-black text-emerald-400">{formatMoney(st.totalPaid)}</div>
                          <div className="text-[10px] text-slate-500">of {formatMoney(st.totalBilled)}</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Due</div>
                          <div className={`text-sm font-black ${st.totalDue > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                            {formatMoney(st.totalDue)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {st.lastBookingDate ? formatDate(st.lastBookingDate, { day: 'numeric', month: 'short' }) : '—'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(c.id)}
                        disabled={(c.bookings || []).length === 0}
                        aria-expanded={isExpanded}
                        className={`w-full sm:w-auto justify-center px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 disabled:opacity-35 disabled:cursor-not-allowed ${isExpanded
                          ? 'bg-lime-400 text-slate-950 border-lime-400'
                          : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'}`}
                      >
                        <Calendar className="w-3.5 h-3.5"/>
                        <span>{isExpanded ? 'Hide' : `Bookings (${st.allBookingsCount || 0})`}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                      </button>
                    </div>
                  </div>

                  {/* EXPANDED MULTI-BOOKING TABLE */}
                  {isExpanded && (
                    <div className="border-t border-white/10 bg-[#080d12]/80 px-4 py-3.5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-slate-400">
                          <span className="text-lime-400 font-bold uppercase tracking-wider">All Bookings ({c.bookings.length})</span>
                          {st.onlineCount > 0 && <span className="px-1.5 py-0.5 rounded bg-sky-400/10 text-sky-300">{st.onlineCount} online</span>}
                          {st.walkInCount > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">{st.walkInCount} walk-in</span>}
                          {st.recurringCount > 0 && <span className="px-1.5 py-0.5 rounded bg-violet-400/10 text-violet-300">{st.recurringCount} fixed</span>}
                          {st.firstBookingDate && (
                            <span className="text-slate-500">
                              First: {formatDate(st.firstBookingDate, { day: 'numeric', month: 'short', year: 'numeric' })} · Last: {formatDate(st.lastBookingDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {c.bookings.length > 1 && (
                          <div className="flex items-center gap-1">
                            {[
                              { k: 'all', l: 'All' },
                              { k: 'paid', l: 'Paid' },
                              { k: 'due', l: 'Has Due' },
                              { k: 'cancelled', l: 'Cancelled' }
                            ].map(opt => (
                              <button
                                key={opt.k}
                                type="button"
                                onClick={() => setBookingStatusFilterById(prev => ({ ...prev, [c.id]: opt.k }))}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${subFilter === opt.k
                                  ? 'bg-lime-400/20 text-lime-300 border border-lime-400/35'
                                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'}`}
                              >
                                {opt.l}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {customerBookings.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-500">No bookings match this status filter.</div>
                      ) : (<>
                        {/* MOBILE BOOKING CARDS */}
                        <div className="md:hidden space-y-2">
                          {customerBookings.map(b => {
                            const statusMeta = BOOKING_STATUS_META[b.paymentStatus] || {
                              label: String(b.paymentStatus || '').replaceAll('_', ' '),
                              cls: 'bg-white/10 text-slate-300 border-white/15'
                            };
                            const chMeta = CHANNEL_META[b.channel] || CHANNEL_META.online;
                            return (
                              <div key={b.id} className="p-3 rounded-xl bg-[#0c131a] border border-white/10 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <span className="font-bold text-lime-400">{b.bookingCode}</span>
                                    <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${chMeta.cls}`}>{chMeta.label}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${statusMeta.cls}`}>
                                    {statusMeta.label}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-300">
                                  {formatDate(b.date, { day: 'numeric', month: 'short', year: 'numeric' })} · S{b.slotNumber} ({b.displayTime})
                                </div>
                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.05] font-mono">
                                  <span className="text-slate-300 font-sans truncate max-w-[140px]">{b.teamName}</span>
                                  <span>
                                    <span className="text-emerald-400">{formatMoney(b.collectedAmount)}</span>
                                    <span className="text-slate-500"> / {formatMoney(b.totalPrice)}</span>
                                    {b.dueAmount > 0 && <span className="text-amber-300 font-bold ml-1.5">(Due {formatMoney(b.dueAmount)})</span>}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* DESKTOP BOOKING TABLE */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-white/[0.03] text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-white/10">
                              <tr>
                                <th className="py-2.5 px-3">Code &amp; Type</th>
                                <th className="py-2.5 px-3">Date &amp; Slot</th>
                                <th className="py-2.5 px-3">Team / Captain</th>
                                <th className="py-2.5 px-3 text-right">Total</th>
                                <th className="py-2.5 px-3 text-right">Paid</th>
                                <th className="py-2.5 px-3 text-right">Due</th>
                                <th className="py-2.5 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {customerBookings.map(b => {
                                  const statusMeta = BOOKING_STATUS_META[b.paymentStatus] || {
                                      label: String(b.paymentStatus || '').replaceAll('_', ' '),
                                      cls: 'bg-white/10 text-slate-300 border-white/15'
                                  };
                                  const chMeta = CHANNEL_META[b.channel] || CHANNEL_META.online;
                                  return (
                                    <tr key={b.id} className="hover:bg-white/[0.02]">
                                      <td className="py-2.5 px-3 whitespace-nowrap">
                                        <div className="font-mono font-bold text-lime-400">{b.bookingCode}</div>
                                        <div className="mt-0.5 flex items-center gap-1">
                                          <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold uppercase ${chMeta.cls}`}>
                                            {chMeta.label}
                                          </span>
                                          {b.played && (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono">
                                              <CheckCircle2 className="w-2.5 h-2.5"/> Played
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                                        <div className="text-white font-semibold">{formatDate(b.date, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-slate-500"/>
                                          <span>S{b.slotNumber} · {b.displayTime}</span>
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <div className="text-white font-semibold truncate max-w-[180px]">{b.teamName}</div>
                                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                          {b.captainName}{b.seriesLabel ? ` · ${b.seriesLabel}` : ''}
                                        </div>
                                        {b.notes && <div className="text-[10px] text-slate-500 truncate max-w-[220px] mt-0.5">{b.notes}</div>}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono text-slate-200 whitespace-nowrap">
                                        {formatMoney(b.totalPrice)}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 whitespace-nowrap">
                                        {formatMoney(b.collectedAmount)}
                                      </td>
                                      <td className={`py-2.5 px-3 text-right font-mono whitespace-nowrap ${b.dueAmount > 0 ? 'text-amber-300 font-bold' : 'text-slate-500'}`}>
                                        {formatMoney(b.dueAmount)}
                                      </td>
                                      <td className="py-2.5 px-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${statusMeta.cls}`}>
                                          {statusMeta.label}
                                        </span>
                                        {b.paymentMethod && (
                                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                            {paymentMethodLabel(b.paymentMethod)}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>)}

                      {c.notes && (
                        <div className="text-[11px] text-slate-400 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                          <span className="text-slate-500 font-semibold">Staff note: </span>{c.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
          })}

          {/* PAGINATION */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#0c131a] border border-white/10 text-[11px] text-slate-400 font-mono">
            <span>
              Showing {customers.length} of {total} {total === 1 ? 'customer' : 'customers'} · page {page} of {pages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white disabled:opacity-30 cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4"/>
              </button>
              <button
                type="button"
                disabled={page >= pages || loading}
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white disabled:opacity-30 cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>);
}
