'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
export const dynamic = 'force-dynamic';

const FILTERS = [
    { key: 'reserved_pickup', label: 'Awaiting pickup' },
    { key: 'collected', label: 'Collected' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'all', label: 'All' }
];
const parseLocalDate = (iso) => {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
};

export default function AdminShopOrdersPage() {
    const { shopReservations, handleUpdateShopReservationStatus, showNotice, isLoadingData } = useArena();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('reserved_pickup');
    const [busyId, setBusyId] = useState(null);
    const [errors, setErrors] = useState({});

    const counts = useMemo(() => ({
        reserved_pickup: shopReservations.filter(r => r.status === 'reserved_pickup').length,
        collected: shopReservations.filter(r => r.status === 'collected').length,
        cancelled: shopReservations.filter(r => r.status === 'cancelled').length,
        all: shopReservations.length
    }), [shopReservations]);

    const filteredOrders = useMemo(() => {
        const q = search.trim().toLowerCase();
        return shopReservations
            .filter(res => filter === 'all' || res.status === filter)
            .filter(res => {
                if (!q) return true;
                const items = (res.items || []).map(i => i.name).join(' ');
                return [res.productName, res.customerName, res.customerPhone, res.reservationCode, items].some(v => String(v || '').toLowerCase().includes(q));
            })
            .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    }, [shopReservations, search, filter]);

    const setStatus = async (res, status) => {
        if (busyId) return;
        if (status === 'cancelled' && !confirm(`Cancel order ${res.reservationCode}?`)) return;
        if (status === 'collected' && !confirm(`Mark ${res.reservationCode} as collected and paid (৳${(Number(res.totalAmount) || 0).toLocaleString()})? Stock will be deducted and the sale recorded as income.`)) return;
        setErrors(prev => ({ ...prev, [res.id]: '' }));
        setBusyId(res.id);
        const r = await handleUpdateShopReservationStatus(res.id, status);
        setBusyId(null);
        if (r?.ok) showNotice('success', status === 'collected' ? `${res.reservationCode} collected · ৳${(Number(res.totalAmount) || 0).toLocaleString()} recorded as shop income` : `${res.reservationCode} cancelled`);
        else setErrors(prev => ({ ...prev, [res.id]: r?.error || 'Could not update the order.' }));
    };

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">
            Counter Shop Reservations &amp; Orders
          </h2>
          <p className="text-xs text-slate-400">
            Hand over reserved items at the counter. Marking an order collected deducts stock and records the sale.
          </p>
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code, customer or product..." className="bg-[#0c131a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white max-w-xs outline-none"/>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
        {FILTERS.map(f => (<button key={f.key} type="button" onClick={() => setFilter(f.key)} className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${filter === f.key ? 'bg-lime-400 text-slate-950 font-black' : 'bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white'}`}>
            <span>{f.label}</span>
            <span className={`px-1.5 rounded-full font-mono text-[10px] ${filter === f.key ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-400'}`}>{counts[f.key]}</span>
          </button>))}
      </div>

      {/* Orders Grid */}
      {isLoadingData && shopReservations.length === 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">{[0, 1, 2].map(i => <div key={i} className="h-48 rounded-3xl bg-[#0c131a] border border-white/5"/>)}</div>)
      : filteredOrders.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">
          {filter === 'reserved_pickup' ? 'No orders waiting for pickup.' : 'No shop orders found.'}
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(res => {
                const isCollected = res.status === 'collected';
                const isCancelled = res.status === 'cancelled';
                const isBusy = busyId === res.id;
                const items = Array.isArray(res.items) && res.items.length ? res.items : null;
                const total = Number(res.totalAmount ?? res.price) || 0;
                return (<div key={res.id} className={`p-5 rounded-3xl border text-xs space-y-3 transition-all ${isCollected
                        ? 'bg-[#0a1016]/60 border-white/5 opacity-80'
                        : isCancelled
                            ? 'bg-[#120a0a]/60 border-rose-500/20 opacity-60'
                            : 'bg-[#0c131a] border-lime-400/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-lime-400">{res.reservationCode}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono ${isCollected
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isCancelled
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-400/20 text-amber-300'}`}>
                    {String(res.status || '').replaceAll('_', ' ')}
                  </span>
                </div>

                <div>
                  <div className="text-slate-400 text-[12px]">
                    Customer: <span className="text-white font-medium">{res.customerName}</span> <span className="font-mono">({res.customerPhone})</span>
                  </div>
                  {res.pickupDate && (<div className="text-slate-500 text-[11px] mt-0.5">Pickup: {parseLocalDate(res.pickupDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>)}
                  {res.notes && (<div className="text-slate-500 text-[11px] mt-0.5 italic">&quot;{res.notes}&quot;</div>)}
                </div>

                {/* Itemised lines */}
                <div className="rounded-2xl bg-[#080d12] border border-white/5 divide-y divide-white/5">
                  {items ? items.map((it, i) => (<div key={i} className="flex items-center justify-between gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate">{it.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            × {it.quantity}{it.size ? ` · size ${it.size}` : ''} · ৳{(Number(it.price) || 0).toLocaleString()} each
                          </div>
                        </div>
                        <div className="font-mono text-slate-200 shrink-0">৳{((Number(it.price) || 0) * (Number(it.quantity) || 0)).toLocaleString()}</div>
                      </div>)) : (<div className="px-3 py-2">
                      <div className="text-white font-medium">{res.productName || 'Item'}</div>
                      {res.size && <div className="text-[11px] font-mono text-slate-500">Size/Variant: {res.size}</div>}
                    </div>)}
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-slate-400 font-bold uppercase text-[11px]">Total</span>
                    <span className="font-mono text-lime-400 font-bold text-base">৳{total.toLocaleString()}</span>
                  </div>
                </div>

                {errors[res.id] && (<div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">{errors[res.id]}</div>)}

                {!isCollected && !isCancelled && (<div className="pt-3 border-t border-white/10 flex gap-2">
                    <button type="button" disabled={isBusy} onClick={() => setStatus(res, 'collected')} className="flex-1 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-lime-400/10 disabled:opacity-60">
                      {isBusy ? 'Saving…' : 'Mark Collected (Paid)'}
                    </button>
                    <button type="button" disabled={isBusy} onClick={() => setStatus(res, 'cancelled')} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold text-xs cursor-pointer disabled:opacity-60">
                      Cancel
                    </button>
                  </div>)}
                {isCollected && res.collectedAt && (<div className="text-[11px] text-slate-500 font-mono">Collected {new Date(res.collectedAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</div>)}
              </div>);
            })}
        </div>)}

    </div>);
}
