'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { Search, XCircle } from 'lucide-react';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;
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
    const { bookings, handleUpdateBookingStatus, handleMarkPlayed, handleCancelBooking, showNotice, isLoadingData } = useArena();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [collectingBooking, setCollectingBooking] = useState(null);
    const [collectAmount, setCollectAmount] = useState(0);
    const [collectError, setCollectError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtered and sorted (newest play date first, then slot)
    const filteredBookings = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = bookings.filter(b => {
            if (b.isPublicView) return false;
            if (q) {
                const hay = [b.teamName, b.captainName, b.captainPhone, b.bookingCode, b.date, b.seriesLabel].map(x => String(x || '').toLowerCase());
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
    }, [bookings, search, filterStatus]);

    const visibleBookings = filteredBookings.slice(0, visibleCount);

    const changeFilter = (key) => { setFilterStatus(key); setVisibleCount(PAGE_SIZE); };

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
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Search by code, name, phone, team or date..." className="w-full bg-[#0c131a] border border-white/10 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 outline-none transition-colors"/>
        </div>

        {search && (<button type="button" onClick={() => setSearch('')} className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer">
            Reset
          </button>)}

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {FILTERS.map(f => (<button key={f.key} type="button" onClick={() => changeFilter(f.key)} className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold transition-colors cursor-pointer ${filterStatus === f.key
                ? 'bg-lime-400 text-slate-950 font-black'
                : 'bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white'}`}>
              {f.label}
            </button>))}
        </div>
      </div>

      <div className="text-[11px] font-mono text-slate-500">
        {filteredBookings.length} booking{filteredBookings.length === 1 ? '' : 's'} · newest play date first
      </div>

      {/* BOOKINGS LIST */}
      <div className="space-y-1.5">
        {isLoadingData && bookings.length === 0 ? (Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-[#0c131a] border border-white/5 animate-pulse"/>))
        : filteredBookings.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs">
            No bookings found matching your search.
          </div>) : (visibleBookings.map(b => {
            const isCancelled = b.paymentStatus === 'cancelled';
            const isHold = b.paymentStatus === 'pending_payment';
            const due = Number(b.dueAmount) || 0;
            const paid = Number(b.advanceAmount) || 0;
            const total = Number(b.totalPrice) || 0;
            const d = parseLocalDate(b.date);
            const isBusy = busyId === b.id;
            return (<div key={b.id} className={`p-3 sm:p-3.5 rounded-2xl bg-[#0c131a] border transition-all flex items-center justify-between gap-3 text-xs ${isCancelled ? 'border-white/5 opacity-60' : isHold ? 'border-white/10 border-dashed' : 'border-white/5 hover:border-lime-400/30'}`}>
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
                    </div>

                    <div className="text-[12px] font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>{b.displayTime || `${b.startTime} - ${b.endTime}`}</span>
                      <span>·</span>
                      <span className="text-slate-300">{b.captainPhone}</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-bold">
                        ৳{paid.toLocaleString()} of ৳{total.toLocaleString()}
                      </span>
                      {due > 0 && !isCancelled && !isHold ? (<span className="text-amber-400 font-bold">
                          (Due ৳{due.toLocaleString()})
                        </span>) : null}
                      {isHold && <span className="text-slate-500">gateway hold</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {statusPill(b)}

                  {due > 0 && !isCancelled && !isHold && (<button type="button" disabled={isBusy} onClick={() => openCollect(b)} className="px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-[12px] font-bold border border-amber-400/20 transition-colors cursor-pointer disabled:opacity-50" title="Record a partial or full cash payment">
                      Collect
                    </button>)}

                  {due > 0 && !isCancelled && !isHold && (<button type="button" disabled={isBusy} onClick={() => settleInFull(b)} className="hidden sm:inline-flex px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[12px] font-bold transition-colors cursor-pointer disabled:opacity-50" title="Collect the entire remaining due">
                      Settle in full
                    </button>)}

                  {!isCancelled && !isHold && !b.played && (<button type="button" disabled={isBusy} onClick={() => markPlayed(b, true)} className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[12px] font-bold transition-colors cursor-pointer disabled:opacity-50" title="Mark the match as played (does not change payment)">
                      Mark played
                    </button>)}

                  {!isCancelled && b.played && (<button type="button" disabled={isBusy} onClick={() => markPlayed(b, false)} className="hidden sm:inline-flex px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50" title="Undo played">
                      Undo
                    </button>)}

                  {!isCancelled && (<button type="button" disabled={isBusy} onClick={() => cancelBooking(b)} className="p-1 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-50" title="Cancel booking">
                      <XCircle className="w-4 h-4"/>
                    </button>)}
                </div>

              </div>);
        }))}

        {filteredBookings.length > visibleCount && (<div className="pt-2 flex justify-center">
            <button type="button" onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold cursor-pointer">
              Show more ({filteredBookings.length - visibleCount} remaining)
            </button>
          </div>)}
      </div>

      {/* COLLECT BALANCE MODAL */}
      {collectingBooking && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
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
