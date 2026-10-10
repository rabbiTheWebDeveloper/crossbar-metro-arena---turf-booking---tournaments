'use client';

import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { Booking } from '@/types';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  Layers,
  Printer
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminAllBookingsPage() {
  const {
    bookings,
    handleUpdateBookingStatus,
    handleCancelBooking
  } = useArena();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'balance_due' | 'confirmed' | 'played' | 'cancelled'>('all');
  const [collectingBooking, setCollectingBooking] = useState<Booking | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);

  // Filtered and sorted bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch =
        b.teamName.toLowerCase().includes(search.toLowerCase()) ||
        b.captainName.toLowerCase().includes(search.toLowerCase()) ||
        b.captainPhone.includes(search) ||
        b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
        b.date.includes(search);

      if (!matchSearch) return false;

      if (filterStatus === 'balance_due') return (b.dueAmount || 0) > 0 && b.paymentStatus !== 'cancelled';
      if (filterStatus === 'confirmed') return b.paymentStatus === 'paid_advance';
      if (filterStatus === 'played') return b.paymentStatus === 'paid_full';
      if (filterStatus === 'cancelled') return b.paymentStatus === 'cancelled';
      return true;
    });
  }, [bookings, search, filterStatus]);

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      
      {/* SEARCH AND FILTER BAR (MATCHING SCREENSHOT 3) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search bookings..."
            className="w-full bg-[#0c131a] border border-white/10 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>

        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Reset
          </button>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {(['all', 'balance_due', 'confirmed', 'played', 'cancelled'] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold capitalize transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-lime-400 text-slate-950 font-black'
                  : 'bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* BOOKINGS LIST (MATCHING SCREENSHOT 3) */}
      <div className="space-y-1.5">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs">
            No bookings found matching your search.
          </div>
        ) : (
          filteredBookings.map(b => {
            const isPlayed = b.paymentStatus === 'paid_full';
            const isConfirmed = b.paymentStatus === 'paid_advance';
            const isCancelled = b.paymentStatus === 'cancelled';
            const dayNum = b.date ? new Date(b.date).getDate() : 10;

            return (
              <div
                key={b.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#0c131a] border border-white/5 hover:border-lime-400/30 transition-all flex items-center justify-between gap-3 text-xs"
              >
                {/* Left: Date Circle & Info */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center font-mono shrink-0">
                    <span className="text-[9px] text-slate-400 uppercase leading-none">
                      {b.date ? new Date(b.date).toLocaleDateString('en-US', { month: 'short' }) : 'OCT'}
                    </span>
                    <span className="text-xs font-black text-white leading-none mt-0.5">
                      {dayNum}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-white truncate text-xs sm:text-sm">
                        {b.captainName}
                      </span>
                      {b.teamName && (
                        <span className="text-slate-400 truncate hidden sm:inline text-xs">
                          · {b.teamName}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        ({b.bookingCode})
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>{b.displayTime || `${b.startTime} - ${b.endTime}`}</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-bold">
                        ৳{(b.advanceAmount || b.courtPrice).toLocaleString()} of ৳{b.totalPrice.toLocaleString()}
                      </span>
                      {b.dueAmount && b.dueAmount > 0 && !isCancelled ? (
                        <span className="text-amber-400 font-bold">
                          (Due ৳{b.dueAmount.toLocaleString()})
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPlayed && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>Played</span>
                    </span>
                  )}

                  {isConfirmed && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Confirmed</span>
                    </span>
                  )}

                  {isCancelled && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/60 text-rose-300 border border-rose-500/30">
                      Cancelled
                    </span>
                  )}

                  {/* Collect balance button */}
                  {b.dueAmount && b.dueAmount > 0 && !isCancelled ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCollectingBooking(b);
                        setCollectAmount(b.dueAmount || 0);
                      }}
                      className="px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-[11px] font-bold border border-amber-400/20 transition-colors cursor-pointer"
                    >
                      Collect
                    </button>
                  ) : null}

                  {/* Mark played button */}
                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => handleUpdateBookingStatus(b.id, 'paid_full')}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                      title="Mark Played"
                    >
                      Played
                    </button>
                  )}

                  {!isCancelled && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Cancel booking ${b.bookingCode}?`)) {
                          handleCancelBooking(b.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* COLLECT BALANCE MODAL */}
      {collectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Collect Due Balance</h3>
            <p className="text-xs text-slate-400">
              {collectingBooking.captainName} ({collectingBooking.teamName})
            </p>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Amount to Collect (৳)</label>
              <input
                type="number"
                value={collectAmount}
                onChange={e => setCollectAmount(Number(e.target.value))}
                className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCollectingBooking(null)}
                className="flex-1 py-2 bg-white/5 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateBookingStatus(collectingBooking.id, 'paid_full', collectAmount);
                  setCollectingBooking(null);
                }}
                className="flex-1 py-2 bg-lime-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
