'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { buildBookingInvoice } from '@/lib/invoice';
import { Search, XCircle, FileText, Download, Pencil } from 'lucide-react';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;
const currentMonth = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};
const monthLabel = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
const customerKey = (b) => String(b.captainPhone || b.captainName || '').trim();
const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'unpaid', label: 'Unpaid' },
    { key: 'balance_due', label: 'Balance due' },
    { key: 'paid', label: 'Paid' },
    { key: 'played', label: 'Played' },
    { key: 'cancelled', label: 'Cancelled' }
];
const parseLocalDate = (iso) => {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
};

const PILL = {
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
    slate: 'bg-slate-800/60 text-slate-300 border-white/10'
};
const Pill = ({ color, label, pulse }) => (<span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border flex items-center gap-1 ${PILL[color]}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${{ cyan: 'bg-cyan-400', emerald: 'bg-emerald-400', amber: 'bg-amber-400', rose: 'bg-rose-400', slate: 'bg-slate-400' }[color]} ${pulse ? 'animate-pulse' : ''}`}></span>
    <span>{label}</span>
  </span>);

const statusPill = (b) => {
    if (b.paymentStatus === 'cancelled') return <Pill color="rose" label="Cancelled" />;
    if (b.played) return <Pill color="cyan" label="Played" />;
    if (b.paymentStatus === 'paid_full') return <Pill color="emerald" label="Paid" />;
    if (b.paymentStatus === 'paid_advance') return <Pill color="emerald" label="Advance paid" pulse />;
    if (b.paymentStatus === 'confirmed_unpaid') return <Pill color="amber" label="Pay at arena" />;
    if (b.paymentStatus === 'needs_refund') return <Pill color="rose" label="Needs refund" />;
    if (b.paymentStatus === 'pending_payment') return <Pill color="slate" label="Paying…" pulse />;
    return <Pill color="slate" label={String(b.paymentStatus || '').replaceAll('_', ' ')} />;
};

export default function AdminAllBookingsPage() {
    const { bookings, pricing, siteSettings, openInvoice, downloadInvoice, handleUpdateBookingStatus, handleRescheduleBooking, handleMarkPlayed, handleCancelBooking, showNotice, isLoadingData } = useArena();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [month, setMonth] = useState(currentMonth); // '' = all time
    const [customer, setCustomer] = useState('');
    const [collectingBooking, setCollectingBooking] = useState(null);
    const [collectAmount, setCollectAmount] = useState(0);
    const [collectError, setCollectError] = useState('');
    const [reschedulingBooking, setReschedulingBooking] = useState(null);
    const [rescheduleError, setRescheduleError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const slotDefs = useMemo(
        () => (pricing?.slotPrices?.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION),
        [pricing]
    );

    // Customers (unique by phone) for the filter dropdown
    const customers = useMemo(() => {
        const map = new Map();
        for (const b of bookings) {
            if (b.isPublicView) continue;
            const key = customerKey(b);
            if (!key) continue;
            const cur = map.get(key);
            if (cur) cur.count += 1;
            else map.set(key, { key, name: b.captainName || 'Unknown', phone: b.captainPhone || '', count: 1 });
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [bookings]);

    // Filtered and sorted (newest play date first, then slot)
    const filteredBookings = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = bookings.filter(b => {
            if (b.isPublicView) return false;
            if (month && !String(b.date || '').startsWith(month)) return false;
            if (customer && customerKey(b) !== customer) return false;
            if (q) {
                const hay = [b.teamName, b.captainName, b.captainPhone, b.bookingCode, b.date, b.seriesLabel, b.transactionId, b.epsTransactionId, b.gatewayCardType, b.paymentGateway].map(x => String(x || '').toLowerCase());
                if (!hay.some(h => h.includes(q))) return false;
            }
            const due = Number(b.dueAmount) || 0;
            switch (filterStatus) {
                case 'unpaid': return b.paymentStatus === 'confirmed_unpaid';
                case 'balance_due': return due > 0 && !['cancelled', 'pending_payment'].includes(b.paymentStatus);
                case 'paid': return b.paymentStatus === 'paid_full';
                case 'played': return !!b.played && b.paymentStatus !== 'cancelled';
                case 'cancelled': return b.paymentStatus === 'cancelled';
                default: return true;
            }
        });
        return list.sort((a, b) => (a.date === b.date ? Number(b.slotNumber) - Number(a.slotNumber) : (a.date < b.date ? 1 : -1)));
    }, [bookings, search, filterStatus, month, customer]);

    const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const visibleBookings = filteredBookings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const pageNumbers = useMemo(() => {
        const set = new Set([1, totalPages, safePage - 1, safePage, safePage + 1]);
        const nums = [...set].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
        const out = [];
        nums.forEach((n, i) => { if (i > 0 && n - nums[i - 1] > 1) out.push('…'); out.push(n); });
        return out;
    }, [totalPages, safePage]);

    const changeFilter = (key) => { setFilterStatus(key); setPage(1); };
    const isDefaultView = month === currentMonth() && !customer && !search && filterStatus === 'all';
    const resetAll = () => { setSearch(''); setCustomer(''); setFilterStatus('all'); setMonth(currentMonth()); setPage(1); };

    const openCollect = (b) => {
        setCollectingBooking(b);
        setCollectAmount(Number(b.dueAmount) || 0);
        setCollectError('');
    };

    const submitCollect = async () => {
        if (!collectingBooking || isSubmitting) return;
        const amount = Number(collectAmount) || 0;
        const due = Number(collectingBooking.dueAmount) || 0;
        if (amount <= 0) { setCollectError('Enter an amount greater than zero.'); return; }
        if (amount > due) { setCollectError(`Cannot collect more than the due ৳${due.toLocaleString()}.`); return; }
        setIsSubmitting(true);
        const res = await handleUpdateBookingStatus(collectingBooking.id, undefined, amount);
        setIsSubmitting(false);
        if (res?.ok) {
            showNotice('success', `৳${amount.toLocaleString()} collected for ${collectingBooking.bookingCode}`);
            setCollectingBooking(null);
        } else {
            setCollectError(res?.error || 'Could not record the payment.');
        }
    };

    const settleInFull = async (b) => {
        if (busyId) return;
        if (!confirm(`Settle ${b.bookingCode} in full (collect the remaining ৳${(Number(b.dueAmount) || 0).toLocaleString()})?`)) return;
        setBusyId(b.id);
        const res = await handleUpdateBookingStatus(b.id, 'paid_full');
        setBusyId(null);
        if (res?.ok) showNotice('success', `${b.bookingCode} settled in full`);
    };

    const markPlayed = async (b, played = true) => {
        if (busyId) return;
        setBusyId(b.id);
        const res = await handleMarkPlayed(b.id, played);
        setBusyId(null);
        if (res?.ok) showNotice('success', played ? `${b.bookingCode} marked as played` : `${b.bookingCode} play flag removed`);
    };

    const cancelBooking = async (b) => {
        if (busyId) return;
        if (!confirm(`Cancel booking ${b.bookingCode}?${Number(b.advanceAmount) > 0 ? ` ৳${Number(b.advanceAmount).toLocaleString()} will go to the refund queue.` : ''}`)) return;
        setBusyId(b.id);
        await handleCancelBooking(b.id);
        setBusyId(null);
    };

    return (<div className="space-y-4 animate-fade-in font-sans">

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by code, name, phone, team or date..." className="w-full bg-[#0c131a] border border-white/10 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 outline-none transition-colors"/>
        </div>

        <input type="month" value={month} onChange={e => { setMonth(e.target.value); setPage(1); }} title="Filter by month" className="bg-[#0c131a] border border-white/10 focus:border-lime-400 rounded-xl py-2.5 px-3 text-xs text-white font-mono outline-none [color-scheme:dark]"/>

        <select value={customer} onChange={e => { setCustomer(e.target.value); setPage(1); }} title="Filter by customer" className="bg-[#0c131a] border border-white/10 focus:border-lime-400 rounded-xl py-2.5 px-3 text-xs text-white outline-none max-w-full sm:max-w-[220px]">
          <option value="">All customers</option>
          {customers.map(c => (<option key={c.key} value={c.key}>{c.name}{c.phone ? ` · ${c.phone}` : ''} ({c.count})</option>))}
        </select>

        {!isDefaultView && (<button type="button" onClick={resetAll} className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer">
            Reset
          </button>)}

        <div className="app-tab-strip text-xs">
          {FILTERS.map(f => (<button key={f.key} type="button" onClick={() => changeFilter(f.key)} className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold transition-colors cursor-pointer ${filterStatus === f.key
                ? 'bg-lime-400 text-slate-950 font-black'
                : 'bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white'}`}>
              {f.label}
            </button>))}
        </div>
      </div>

      <div className="text-[11px] font-mono text-slate-500">
        {filteredBookings.length} booking{filteredBookings.length === 1 ? '' : 's'} · {month ? monthLabel(month) : 'all time'}{month && (<button type="button" onClick={() => { setMonth(''); setPage(1); }} className="ml-2 text-lime-400 hover:underline cursor-pointer">show all time</button>)} · newest play date first
      </div>

      {/* BOOKINGS LIST */}
      <div className="space-y-1.5">
        {isLoadingData && bookings.length === 0 ? (Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-[#0c131a] border border-white/5 animate-pulse"/>))
        : filteredBookings.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs">
            No bookings found for the selected filters.
          </div>) : (visibleBookings.map(b => {
            const isCancelled = b.paymentStatus === 'cancelled';
            const isHold = b.paymentStatus === 'pending_payment';
            const due = Number(b.dueAmount) || 0;
            const paid = Number(b.advanceAmount) || 0;
            const total = Number(b.totalPrice) || 0;
            const d = parseLocalDate(b.date);
            const isBusy = busyId === b.id;
            return (<div key={b.id} className={`p-3 sm:p-3.5 rounded-2xl bg-[#0c131a] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${isCancelled ? 'border-white/5 opacity-60' : isHold ? 'border-white/10 border-dashed' : 'border-white/5 hover:border-lime-400/30'}`}>
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center font-mono shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase leading-none">
                      {d.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xs font-black text-white leading-none mt-0.5">
                      {d.getDate()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-white truncate text-xs sm:text-sm">
                        {b.captainName}
                      </span>
                      {b.teamName && (<span className="text-slate-400 truncate hidden sm:inline text-xs">
                          · {b.teamName}
                        </span>)}
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        ({b.bookingCode})
                      </span>
                      {b.isRecurring && (<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 shrink-0" title={b.seriesLabel || 'Part of a fixed weekly series'}>FIXED</span>)}
                      {b.isWalkIn && !b.isRecurring && (<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 shrink-0">WALK-IN</span>)}
                      {b.paymentGateway === 'eps' && (<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shrink-0">EPS</span>)}
                      {b.paymentGateway === 'sslcommerz' && (<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 shrink-0">SSL</span>)}
                    </div>

                    <div className="text-[12px] font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>{b.date} ({d.toLocaleDateString('en-US', { weekday: 'short' })}) · {b.displayTime || `${b.startTime} - ${b.endTime}`}</span>
                      <span>·</span>
                      <span className="text-slate-300">{b.captainPhone}</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-bold">
                        ৳{paid.toLocaleString()} of ৳{total.toLocaleString()}
                      </span>
                      {due > 0 && !isCancelled && !isHold ? (<span className="text-amber-400 font-bold">
                          (Due ৳{due.toLocaleString()})
                        </span>) : null}
                      {(b.gatewayCardType || b.paymentMethod) && (
                        <span className="text-slate-400">· {b.gatewayCardType || String(b.paymentMethod).replaceAll('_', ' ')}</span>
                      )}
                      {(b.epsTransactionId || b.transactionId) && (
                        <span className="text-[11px] text-slate-500" title="Transaction ID">· Txn: {b.epsTransactionId || b.transactionId}</span>
                      )}
                      {isHold && <span className="text-slate-500">gateway hold</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                  {statusPill(b)}

                  <div className="flex flex-wrap items-center gap-1.5">
                    {!isHold && (
                      <button
                        type="button"
                        onClick={() => openInvoice(buildBookingInvoice(b, siteSettings))}
                        className="px-2.5 py-1.5 sm:py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-[12px] font-bold border border-white/10 transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Preview & print booking invoice"
                      >
                        <FileText className="w-3.5 h-3.5 text-lime-400"/>
                        <span>Invoice</span>
                      </button>
                    )}

                    {!isHold && (
                      <button
                        type="button"
                        onClick={() => downloadInvoice(buildBookingInvoice(b, siteSettings))}
                        className="p-1.5 rounded-lg bg-lime-400/15 hover:bg-lime-400 text-lime-300 hover:text-slate-950 border border-lime-400/25 transition-colors cursor-pointer"
                        title="Download Booking Invoice PDF"
                        aria-label="Download Booking Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5"/>
                      </button>
                    )}

                    {!isCancelled && !isHold && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setRescheduleError('');
                          setReschedulingBooking({
                            id: b.id,
                            bookingCode: b.bookingCode,
                            teamName: b.teamName,
                            captainName: b.captainName,
                            date: b.date,
                            slotNumber: Number(b.slotNumber),
                            keepPrice: Boolean(b.isRecurring)
                          });
                        }}
                        className="px-2.5 py-1.5 sm:py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-[12px] font-bold border border-white/10 transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                        title="Edit booking Date & Time Slot"
                      >
                        <Pencil className="w-3 h-3 text-emerald-400"/>
                        <span>Date/Time</span>
                      </button>
                    )}

                    {due > 0 && !isCancelled && !isHold && (<button type="button" disabled={isBusy} onClick={() => openCollect(b)} className="px-2.5 py-1.5 sm:py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-[12px] font-bold border border-amber-400/20 transition-colors cursor-pointer disabled:opacity-50" title="Record a partial or full cash payment">
                        Collect
                      </button>)}

                    {due > 0 && !isCancelled && !isHold && (<button type="button" disabled={isBusy} onClick={() => settleInFull(b)} className="px-2.5 py-1.5 sm:py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[12px] font-bold transition-colors cursor-pointer disabled:opacity-50" title="Collect the entire remaining due">
                        Settle
                      </button>)}

                    {!isCancelled && !isHold && !b.played && (<button type="button" disabled={isBusy} onClick={() => markPlayed(b, true)} className="px-2.5 py-1.5 sm:py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[12px] font-bold transition-colors cursor-pointer disabled:opacity-50" title="Mark the match as played (does not change payment)">
                        Played
                      </button>)}

                    {!isCancelled && b.played && (<button type="button" disabled={isBusy} onClick={() => markPlayed(b, false)} className="px-2.5 py-1.5 sm:py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50" title="Undo played">
                        Undo
                      </button>)}

                    {!isCancelled && (<button type="button" disabled={isBusy} onClick={() => cancelBooking(b)} className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-50" title="Cancel booking">
                        <XCircle className="w-4 h-4"/>
                      </button>)}
                  </div>
                </div>

              </div>);
        }))}

        {totalPages > 1 && (<div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono text-slate-500">
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredBookings.length)} of {filteredBookings.length}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
              {pageNumbers.map((n, i) => n === '…'
                ? <span key={`e${i}`} className="px-1 text-slate-500">…</span>
                : <button key={n} type="button" onClick={() => setPage(n)} className={`min-w-8 px-2 py-1.5 rounded-lg font-bold cursor-pointer border ${n === safePage ? 'bg-lime-400 text-slate-950 border-lime-400' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'}`}>{n}</button>)}
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>)}
      </div>

      {/* RESCHEDULE DATE & TIME MODAL */}
      {reschedulingBooking && (<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
          <div className="bg-[#0c131a] border-t sm:border border-lime-400/30 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 max-w-sm w-full space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Edit Booking Date &amp; Time</h3>
            <p className="text-slate-400">
              {reschedulingBooking.captainName} ({reschedulingBooking.teamName}) · <span className="font-mono text-white">{reschedulingBooking.bookingCode}</span>
            </p>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Match Date ({parseLocalDate(reschedulingBooking.date).toLocaleDateString('en-US', { weekday: 'long' })})
              </label>
              <input
                type="date"
                value={reschedulingBooking.date}
                onChange={e => setReschedulingBooking(r => ({ ...r, date: e.target.value }))}
                className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Kickoff Time Slot</label>
              <select
                value={reschedulingBooking.slotNumber}
                onChange={e => setReschedulingBooking(r => ({ ...r, slotNumber: Number(e.target.value) }))}
                className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              >
                {slotDefs.map(s => (
                  <option key={s.slotNumber} value={s.slotNumber}>
                    Slot #{s.slotNumber} · {s.displayTime}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reschedulingBooking.keepPrice}
                onChange={e => setReschedulingBooking(r => ({ ...r, keepPrice: e.target.checked }))}
                className="accent-lime-400 w-4 h-4"
              />
              <span>Keep existing court price</span>
            </label>
            {rescheduleError && (<div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">{rescheduleError}</div>)}
            <div className="flex gap-2">
              <button type="button" disabled={isSubmitting} onClick={() => setReschedulingBooking(null)} className="flex-1 py-2 bg-white/5 text-slate-300 font-bold rounded-xl disabled:opacity-50 cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  setRescheduleError('');
                  const r = await handleRescheduleBooking(reschedulingBooking.id, {
                    date: reschedulingBooking.date,
                    slotNumber: Number(reschedulingBooking.slotNumber),
                    keepPrice: reschedulingBooking.keepPrice
                  });
                  setIsSubmitting(false);
                  if (r?.ok) setReschedulingBooking(null);
                  else setRescheduleError(r?.error || 'Could not reschedule booking.');
                }}
                className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? 'Saving…' : 'Save Date & Time'}
              </button>
            </div>
          </div>
        </div>)}

      {/* COLLECT BALANCE MODAL */}
      {collectingBooking && (<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
          <div className="bg-[#0c131a] border-t sm:border border-emerald-500/30 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 max-w-sm w-full space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95">
            <h3 className="text-base font-bold text-white">Collect Due Balance</h3>
            <p className="text-xs text-slate-400">
              {collectingBooking.captainName} ({collectingBooking.teamName}) · {collectingBooking.bookingCode}
            </p>
            <p className="text-xs font-mono text-slate-300">
              Paid ৳{(Number(collectingBooking.advanceAmount) || 0).toLocaleString()} · Due <span className="text-amber-300 font-bold">৳{(Number(collectingBooking.dueAmount) || 0).toLocaleString()}</span>
            </p>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Amount to Collect (৳)</label>
              <input type="number" min={1} max={Number(collectingBooking.dueAmount) || 0} value={collectAmount} onChange={e => { setCollectAmount(Number(e.target.value)); setCollectError(''); }} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm"/>
              <span className="text-[10px] text-slate-500">Partial amounts are fine; the status updates from what has been paid.</span>
            </div>
            {collectError && (<div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">{collectError}</div>)}
            <div className="flex gap-2">
              <button type="button" disabled={isSubmitting} onClick={() => setCollectingBooking(null)} className="flex-1 py-2 bg-white/5 text-slate-300 font-bold rounded-xl text-xs disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={isSubmitting} onClick={submitCollect} className="flex-1 py-2 bg-lime-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-60">
                {isSubmitting ? 'Saving…' : 'Record payment'}
              </button>
            </div>
          </div>
        </div>)}

    </div>);
}
