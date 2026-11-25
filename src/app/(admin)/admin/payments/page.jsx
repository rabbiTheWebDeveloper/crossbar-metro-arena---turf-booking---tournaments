'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    Search, RefreshCw, CreditCard, CheckCircle2, AlertTriangle, Clock, XCircle,
    ShieldCheck, Loader2, ChevronLeft, ChevronRight, DatabaseZap, ArrowUpRight, X, Copy, Check
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;
const money = (n) => `৳${(Number(n) || 0).toLocaleString()}`;
const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_STYLE = {
    success: { label: 'Paid', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
    initiated: { label: 'Pending / Initiated', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Clock },
    failed: { label: 'Failed', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30', icon: AlertTriangle },
    cancelled: { label: 'Cancelled', cls: 'bg-slate-700/40 text-slate-400 border-white/10', icon: XCircle },
    refunded: { label: 'Refunded', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30', icon: RefreshCw }
};

const GATEWAY_STYLE = {
    eps: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    sslcommerz: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    counter: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
};

export default function AdminPaymentsPage() {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [overview, setOverview] = useState({
        totalTransactions: 0,
        totalCollected: 0,
        epsCollected: 0,
        sslcommerzCollected: 0,
        counterCollected: 0,
        successCount: 0,
        initiatedCount: 0,
        failedCount: 0,
        cancelledCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [flash, setFlash] = useState(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [gatewayFilter, setGatewayFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);
    const [verifyingId, setVerifyingId] = useState('');
    const [syncing, setSyncing] = useState(false);

    const reqCounter = useRef(0);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);
    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, gatewayFilter, fromDate, toDate]);

    const load = useCallback(async ({ sync = false } = {}) => {
        const mine = ++reqCounter.current;
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
            if (debouncedSearch) params.set('q', debouncedSearch);
            if (statusFilter) params.set('status', statusFilter);
            if (gatewayFilter) params.set('gateway', gatewayFilter);
            if (fromDate) params.set('from', fromDate);
            if (toDate) params.set('to', toDate);
            if (sync) params.set('sync', '1');
            const res = await fetch(`/api/payments?${params.toString()}`, { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (mine !== reqCounter.current) return;
            setLoading(false);
            if (!res.ok) {
                setError(data.error || 'Failed to load payments.');
                return;
            }
            setRows(data.payments || []);
            // Keep an open detail panel in sync with the refreshed row
            setSelected(cur => (cur ? (data.payments || []).find(r => r.id === cur.id) || cur : cur));
            setTotal(data.total || 0);
            setPages(data.pages || 1);
            if (data.overview) setOverview(data.overview);
        } catch {
            if (mine !== reqCounter.current) return;
            setLoading(false);
            setError('Could not reach the server to load payments.');
        }
    }, [page, debouncedSearch, statusFilter, gatewayFilter, fromDate, toDate]);

    useEffect(() => { load(); }, [load]);

    const handleSyncOlder = async () => {
        if (syncing) return;
        setSyncing(true);
        setFlash(null);
        await load({ sync: true });
        setSyncing(false);
        setFlash({ type: 'success', text: 'Synced paid booking records into the payment ledger.' });
    };

    const handleVerifyEps = async (p) => {
        if (verifyingId) return;
        setVerifyingId(p.id);
        setFlash(null);
        try {
            const res = await fetch('/api/payment/eps/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    merchantTransactionId: p.merchantTransactionId,
                    epsTransactionId: p.gatewayTransactionId
                })
            });
            const data = await res.json().catch(() => ({}));
            setFlash({
                type: res.ok && data.success ? 'success' : 'error',
                text: data.message || data.error || (res.ok ? 'Verified with EPS.' : 'EPS verification did not succeed.')
            });
            await load();
        } catch {
            setFlash({ type: 'error', text: 'Could not reach EPS verification endpoint.' });
        } finally {
            setVerifyingId('');
        }
    };

    return (
        <div className="space-y-5 animate-fade-in font-sans">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-lime-400"/>
                        <span>Booking Payments &amp; EPS Ledger</span>
                    </h2>
                    <p className="text-xs text-slate-400 max-w-2xl mt-1">
                        Every EPS online payment, SSLCommerz transaction, and desk collection recorded for turf bookings. Verify pending EPS payments directly against EPS servers.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/admin/settings"
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                    >
                        <span>EPS Gateway Settings</span>
                        <ArrowUpRight className="w-3.5 h-3.5"/>
                    </Link>
                    <button
                        type="button"
                        onClick={handleSyncOlder}
                        disabled={syncing || loading}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Backfill older paid bookings into the payments list"
                    >
                        {syncing ? <Loader2 className="w-4 h-4 animate-spin"/> : <DatabaseZap className="w-4 h-4"/>}
                        <span>Sync Bookings</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => load()}
                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                        title="Refresh"
                        aria-label="Refresh payments"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
                    </button>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#0c131a] border border-emerald-500/20">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Collected</div>
                    <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{money(overview.totalCollected)}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{overview.successCount} verified payments</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0c131a] border border-white/10">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">EPS Online</div>
                    <div className="text-2xl font-black font-mono text-white mt-1">{money(overview.epsCollected)}</div>
                    <div className="text-[11px] text-emerald-400 mt-0.5">Easy Payment System</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0c131a] border border-white/10">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Desk / Counter</div>
                    <div className="text-2xl font-black font-mono text-white mt-1">{money(overview.counterCollected)}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Cash, bKash &amp; manual desk</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0c131a] border border-white/10">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Pending / Failed</div>
                    <div className="text-2xl font-black font-mono text-amber-300 mt-1">
                        {overview.initiatedCount} <span className="text-sm text-rose-400">/ {overview.failedCount + overview.cancelledCount}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{overview.totalTransactions} total records</div>
                </div>
            </div>

            {flash && (
                <div
                    role="status"
                    className={`p-3 rounded-xl text-xs border flex items-center gap-2 ${
                        flash.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                >
                    {flash.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0"/> : <AlertTriangle className="w-4 h-4 shrink-0"/>}
                    <span>{flash.text}</span>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 sm:max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search booking code, transaction ID, name, phone..."
                        className="w-full bg-[#0c131a] border border-white/10 focus:border-lime-400 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none"
                    />
                </div>
                <select
                    value={gatewayFilter}
                    onChange={e => setGatewayFilter(e.target.value)}
                    aria-label="Filter by gateway"
                    className="bg-[#0c131a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                    <option value="">All Gateways</option>
                    <option value="online">Online only (EPS + SSLCommerz)</option>
                    <option value="eps">EPS Gateway</option>
                    <option value="counter">Counter / Desk</option>
                    <option value="sslcommerz">SSLCommerz</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    aria-label="Filter by status"
                    className="bg-[#0c131a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                    <option value="">All Statuses</option>
                    <option value="success">Paid / Verified</option>
                    <option value="initiated">Pending / Initiated</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                </select>
                <div className="flex items-center gap-1.5">
                    <input
                        type="date"
                        value={fromDate}
                        max={toDate || undefined}
                        onChange={e => setFromDate(e.target.value)}
                        aria-label="Slot date from"
                        title="Slot date from"
                        className="bg-[#0c131a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none [color-scheme:dark]"
                    />
                    <span className="text-slate-500 text-xs">to</span>
                    <input
                        type="date"
                        value={toDate}
                        min={fromDate || undefined}
                        onChange={e => setToDate(e.target.value)}
                        aria-label="Slot date to"
                        title="Slot date to"
                        className="bg-[#0c131a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none [color-scheme:dark]"
                    />
                    {(fromDate || toDate) && (
                        <button
                            type="button"
                            onClick={() => { setFromDate(''); setToDate(''); }}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
                            aria-label="Clear date range"
                            title="Clear date range"
                        >
                            <X className="w-3.5 h-3.5"/>
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0"/> {error}
                </div>
            )}

            {/* Table */}
            {loading && rows.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin"/> Loading payments…
                </div>
            ) : rows.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs space-y-2">
                    <div className="text-sm font-bold text-white">No payment records found.</div>
                    <p>Online EPS payments and desk collections appear here automatically. Click &ldquo;Sync Bookings&rdquo; to backfill existing paid bookings.</p>
                </div>
            ) : (
                <div className={`rounded-2xl bg-[#0c131a] border border-white/10 overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500 border-b border-white/10">
                                    <th className="px-4 py-3">Date &amp; Booking</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Gateway &amp; Channel</th>
                                    <th className="px-4 py-3">Transaction IDs</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(p => {
                                    const st = STATUS_STYLE[p.status] || STATUS_STYLE.initiated;
                                    const StIcon = st.icon;
                                    const gwCls = GATEWAY_STYLE[p.gateway] || GATEWAY_STYLE.counter;
                                    return (
                                        <tr
                                            key={p.id}
                                            onClick={() => setSelected(p)}
                                            className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer ${selected?.id === p.id ? 'bg-white/[0.05]' : ''}`}
                                            title="View payment details"
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="font-mono font-bold text-lime-400">{p.bookingCode || '—'}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    {p.slotDate ? `${p.slotDate} · ${p.slotDisplay || `Slot #${p.slotNumber}`}` : fmtDateTime(p.createdAt)}
                                                </div>
                                                <div className="text-[10px] font-mono text-slate-500">{fmtDateTime(p.verifiedAt || p.createdAt)}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-white">{p.customerName || '—'}</div>
                                                <div className="font-mono text-[11px] text-slate-400">{p.customerPhone || '—'}</div>
                                                {p.teamName && <div className="text-[11px] text-slate-500">{p.teamName}</div>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${gwCls}`}>
                                                    {p.gateway === 'eps' ? (p.sandbox ? 'EPS · SANDBOX' : 'EPS') : p.gateway}
                                                </span>
                                                <div className="text-[11px] text-slate-300 mt-1">
                                                    {p.financialEntity || p.paymentMethod || '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                                                {p.merchantTransactionId && (
                                                    <div title="Merchant Transaction ID">M: {p.merchantTransactionId}</div>
                                                )}
                                                {p.gatewayTransactionId && p.gatewayTransactionId !== p.merchantTransactionId && (
                                                    <div className="text-slate-400" title="Gateway Transaction ID">G: {p.gatewayTransactionId}</div>
                                                )}
                                                {p.errorMessage && (
                                                    <div className="text-[10px] text-rose-400 font-sans mt-0.5 max-w-[220px] truncate" title={p.errorMessage}>
                                                        {p.errorMessage}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono font-black text-white whitespace-nowrap">
                                                {money(p.amount)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${st.cls}`}>
                                                    <StIcon className="w-3 h-3"/>
                                                    <span>{st.label}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                {p.gateway === 'eps' && p.status !== 'success' && p.status !== 'refunded' ? (
                                                    <button
                                                        type="button"
                                                        disabled={verifyingId === p.id}
                                                        onClick={(e) => { e.stopPropagation(); handleVerifyEps(p); }}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        {verifyingId === p.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <ShieldCheck className="w-3 h-3"/>}
                                                        <span>Verify EPS</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-slate-500 font-mono">{p.recordedBy || 'Verified'}</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/10 text-[11px] text-slate-400 font-mono">
                        <span>{total} payment{total === 1 ? '' : 's'} · page {page} of {pages}</span>
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

            {selected && (
                <PaymentDetailDrawer
                    payment={selected}
                    onClose={() => setSelected(null)}
                    onVerify={handleVerifyEps}
                    verifying={verifyingId === selected.id}
                />
            )}
        </div>
    );
}

const BOOKING_PAYMENT_LABEL = {
    pending_payment: 'Awaiting payment (slot held)',
    confirmed_unpaid: 'Confirmed · unpaid',
    paid_advance: 'Advance paid',
    paid_full: 'Paid in full',
    needs_refund: 'Needs refund',
    cancelled: 'Cancelled'
};

function CopyValue({ value }) {
    const [copied, setCopied] = useState(false);
    if (!value) return <span className="text-slate-500">—</span>;
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch { /* clipboard unavailable (non-HTTPS) */ }
    };
    return (
        <span className="inline-flex items-center gap-1.5 min-w-0">
            <span className="font-mono break-all">{value}</span>
            <button
                type="button"
                onClick={copy}
                className="shrink-0 p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Copy"
                title="Copy"
            >
                {copied ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
            </button>
        </span>
    );
}

function DetailRow({ label, children }) {
    return (
        <div className="grid grid-cols-[130px_1fr] gap-3 py-2 border-b border-white/5 text-xs">
            <dt className="text-slate-500 font-mono uppercase text-[10px] tracking-wider pt-0.5">{label}</dt>
            <dd className="text-slate-200 min-w-0">{children}</dd>
        </div>
    );
}

function PaymentDetailDrawer({ payment: p, onClose, onVerify, verifying }) {
    const [booking, setBooking] = useState(null);
    const [bookingState, setBookingState] = useState('idle'); // idle | loading | error | none

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const bookingRef = p.bookingId || p.bookingCode;
    useEffect(() => {
        if (!bookingRef) { setBooking(null); setBookingState('none'); return; }
        let cancelled = false;
        setBookingState('loading');
        fetch(`/api/bookings/${encodeURIComponent(bookingRef)}`, { credentials: 'include' })
            .then(res => res.json().then(data => ({ ok: res.ok, data })).catch(() => ({ ok: false, data: {} })))
            .then(({ ok, data }) => {
                if (cancelled) return;
                if (ok && data.booking) { setBooking(data.booking); setBookingState('idle'); }
                else { setBooking(null); setBookingState('error'); }
            })
            .catch(() => { if (!cancelled) { setBooking(null); setBookingState('error'); } });
        return () => { cancelled = true; };
    }, [bookingRef, p.updatedAt]);

    const st = STATUS_STYLE[p.status] || STATUS_STYLE.initiated;
    const StIcon = st.icon;
    const gwCls = GATEWAY_STYLE[p.gateway] || GATEWAY_STYLE.counter;
    const canVerify = p.gateway === 'eps' && p.status !== 'success' && p.status !== 'refunded';

    return (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="payment-detail-title">
            <button type="button" className="absolute inset-0 bg-black/60 cursor-default" onClick={onClose} aria-label="Close details"/>
            <aside className="relative w-full max-w-md h-full overflow-y-auto bg-[#0a1016] border-l border-white/10 shadow-2xl animate-fade-in">
                <div className="sticky top-0 z-10 bg-[#0a1016]/95 backdrop-blur px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Payment details</div>
                        <h3 id="payment-detail-title" className="text-2xl font-black font-mono text-white mt-0.5">{money(p.amount)}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${st.cls}`}>
                                <StIcon className="w-3 h-3"/> {st.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${gwCls}`}>
                                {p.gateway === 'eps' ? (p.sandbox ? 'EPS · SANDBOX' : 'EPS') : p.gateway}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4"/>
                    </button>
                </div>

                <div className="px-5 py-4 space-y-6">
                    {p.errorMessage && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                            <div className="font-bold">{p.errorCode ? `Error ${p.errorCode}` : 'Gateway message'}</div>
                            <div className="mt-0.5 break-words">{p.errorMessage}</div>
                        </div>
                    )}

                    {canVerify && (
                        <button
                            type="button"
                            disabled={verifying}
                            onClick={() => onVerify(p)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {verifying ? <Loader2 className="w-4 h-4 animate-spin"/> : <ShieldCheck className="w-4 h-4"/>}
                            <span>Re-check this payment with EPS</span>
                        </button>
                    )}

                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-lime-400 mb-1">Transaction</h4>
                        <dl>
                            <DetailRow label="Merchant Txn"><CopyValue value={p.merchantTransactionId}/></DetailRow>
                            <DetailRow label="Gateway Txn"><CopyValue value={p.gatewayTransactionId}/></DetailRow>
                            <DetailRow label="Amount">{money(p.amount)} {p.currency && p.currency !== 'BDT' ? p.currency : ''}</DetailRow>
                            <DetailRow label="Channel">{p.financialEntity || '—'}</DetailRow>
                            <DetailRow label="Method">{p.paymentMethod || '—'}</DetailRow>
                            <DetailRow label="Started">{fmtDateTime(p.createdAt)}</DetailRow>
                            <DetailRow label="Verified">{fmtDateTime(p.verifiedAt)}</DetailRow>
                            <DetailRow label="Last update">{fmtDateTime(p.updatedAt)}</DetailRow>
                            <DetailRow label="Recorded by">{p.recordedBy || '—'}</DetailRow>
                            {p.notes && <DetailRow label="Notes"><span className="break-words">{p.notes}</span></DetailRow>}
                        </dl>
                    </section>

                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-lime-400 mb-1">Customer</h4>
                        <dl>
                            <DetailRow label="Name">{p.customerName || '—'}</DetailRow>
                            <DetailRow label="Phone">
                                {p.customerPhone
                                    ? <a href={`tel:${p.customerPhone}`} className="font-mono text-sky-300 hover:underline">{p.customerPhone}</a>
                                    : '—'}
                            </DetailRow>
                            <DetailRow label="Email">{p.customerEmail || '—'}</DetailRow>
                            <DetailRow label="Team">{p.teamName || '—'}</DetailRow>
                        </dl>
                    </section>

                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-lime-400 mb-1">Booking</h4>
                        <dl>
                            <DetailRow label="Booking code"><CopyValue value={p.bookingCode || booking?.bookingCode}/></DetailRow>
                            <DetailRow label="Slot">
                                {p.slotDate ? `${p.slotDate} · ${p.slotDisplay || `Slot #${p.slotNumber}`}` : '—'}
                            </DetailRow>
                        </dl>
                        {bookingState === 'loading' && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-2">
                                <Loader2 className="w-3 h-3 animate-spin"/> Loading booking…
                            </div>
                        )}
                        {bookingState === 'error' && (
                            <div className="text-[11px] text-slate-500 mt-2">Linked booking could not be loaded (it may have been deleted).</div>
                        )}
                        {booking && bookingState === 'idle' && (
                            <dl>
                                {booking.paymentStatus && (
                                    <DetailRow label="Booking state">
                                        {BOOKING_PAYMENT_LABEL[booking.paymentStatus] || booking.paymentStatus}
                                    </DetailRow>
                                )}
                                {booking.totalPrice != null && <DetailRow label="Booking total">{money(booking.totalPrice)}</DetailRow>}
                                {booking.advanceAmount != null && <DetailRow label="Paid so far">{money(booking.advanceAmount)}</DetailRow>}
                                {booking.dueAmount != null && (
                                    <DetailRow label="Due at venue">
                                        <span className={Number(booking.dueAmount) > 0 ? 'text-amber-300 font-bold' : ''}>{money(booking.dueAmount)}</span>
                                    </DetailRow>
                                )}
                                {booking.paymentType && (
                                    <DetailRow label="Plan">{booking.paymentType === 'full_payment' ? 'Full payment' : 'Advance'}</DetailRow>
                                )}
                                {booking.matchType && <DetailRow label="Match type">{booking.matchType}</DetailRow>}
                            </dl>
                        )}
                    </section>
                </div>
            </aside>
        </div>
    );
}
