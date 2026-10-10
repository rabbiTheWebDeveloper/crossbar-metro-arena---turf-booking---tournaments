'use client';
import React, { useState } from 'react';
import { useArena } from '@/context/ArenaContext';
export const dynamic = 'force-dynamic';
export default function AdminShopOrdersPage() {
    const { shopReservations, handleUpdateShopReservationStatus } = useArena();
    const [search, setSearch] = useState('');
    const filteredOrders = shopReservations.filter(res => res.productName.toLowerCase().includes(search.toLowerCase()) ||
        res.customerName.toLowerCase().includes(search.toLowerCase()) ||
        res.customerPhone.includes(search) ||
        res.reservationCode.toLowerCase().includes(search.toLowerCase()));
    return (<div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">
            Counter Shop Reservations &amp; Orders
          </h2>
          <p className="text-xs text-slate-400">
            Fulfill player grip socks, balls, and hydration orders reserved for pitch-side pickup.
          </p>
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code, customer or product..." className="bg-[#0c131a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white max-w-xs outline-none"/>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">
          No shop orders found.
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(res => {
                const isCollected = res.status === 'collected';
                const isCancelled = res.status === 'cancelled';
                return (<div key={res.id} className={`p-5 rounded-3xl border text-xs space-y-3 transition-all ${isCollected
                        ? 'bg-[#0a1016]/60 border-white/5 opacity-70'
                        : isCancelled
                            ? 'bg-[#120a0a]/60 border-rose-500/20 opacity-60'
                            : 'bg-[#0c131a] border-lime-400/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-lime-400">{res.reservationCode}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${isCollected
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isCancelled
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-400/20 text-amber-300'}`}>
                    {res.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">{res.productName}</h4>
                  <div className="text-slate-400 text-[11px] mt-1">
                    Customer: <span className="text-white font-medium">{res.customerName}</span> ({res.customerPhone})
                  </div>
                  {res.size && (<div className="text-slate-500 text-[10px] mt-0.5">Size/Variant: {res.size}</div>)}
                  <div className="font-mono text-lime-400 font-bold text-base mt-2">
                    ৳{res.price.toLocaleString()}
                  </div>
                </div>

                {!isCollected && !isCancelled && (<div className="pt-3 border-t border-white/10 flex gap-2">
                    <button type="button" onClick={() => handleUpdateShopReservationStatus(res.id, 'collected')} className="flex-1 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-lime-400/10">
                      Mark Collected (Paid)
                    </button>
                    <button type="button" onClick={() => handleUpdateShopReservationStatus(res.id, 'cancelled')} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold text-xs cursor-pointer">
                      Cancel
                    </button>
                  </div>)}
              </div>);
            })}
        </div>)}

    </div>);
}
