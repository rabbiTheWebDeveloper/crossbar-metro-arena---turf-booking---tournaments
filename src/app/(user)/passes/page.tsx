'use client';

import React from 'react';
import Link from 'next/link';
import { useArena } from '../../../context/ArenaContext';
import { Ticket, Calendar, Clock, MapPin, Share2, Trash2, Shield, QrCode, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { VENUE_INFO } from '../../../data/initialData';

export default function PassesPage() {
  const { bookings, setActiveTicketPass, handleCancelBooking } = useArena();

  const handleShareSquad = (booking: (typeof bookings)[0]) => {
    const text = `⚽ MATCH DAY PASS - CROSSBAR METRO ARENA 🏟️\n\n` +
      `Squad: ${booking.teamName}\n` +
      `Court: ${booking.courtName}\n` +
      `Date: ${booking.date}\n` +
      `Kickoff: ${booking.displayTime}\n` +
      `Ref: ${booking.bookingCode}\n` +
      `Venue: Uttara Metro Center, Sector 17, Dhaka (MRT Line-6)\n\n` +
      `Be at the turf 15 minutes before kickoff for warmup! 🔥`;
    
    if (typeof window !== 'undefined') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Ticket className="w-3.5 h-3.5" />
            <span>Digital Gate Passes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-white">
            My Match Passes
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            All your confirmed court reservations and QR passes for pitch entry at Crossbar Metro Arena.
          </p>
        </div>

        <Link
          href="/booking"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book Another Slot</span>
        </Link>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl bg-white/5 border border-white/10 max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white font-display uppercase">No Active Passes Found</h2>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              You haven&apos;t reserved a court slot yet. Book a slot on Pitch Alpha or Bravo to receive an instant digital entry pass.
            </p>
          </div>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Calendar className="w-4 h-4" />
            <span>Browse Available Turf Slots</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((b) => {
            const isPaid = b.paymentStatus === 'paid_full';
            const isAdvance = b.paymentStatus === 'paid_advance';

            return (
              <div
                key={b.id}
                className="bg-[#0b1218] border border-white/10 hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {b.bookingCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isPaid
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : isAdvance
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {isPaid ? 'PAID FULL' : isAdvance ? 'ADVANCE PAID' : 'PAY AT TURF'}
                    </span>
                  </div>

                  {/* Team & Court */}
                  <div>
                    <h2 className="text-lg font-black text-white font-display uppercase tracking-wide group-hover:text-emerald-300 transition-colors">
                      {b.teamName}
                    </h2>
                    <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">{b.courtName}</span>
                      <span>·</span>
                      <span className="capitalize">{b.matchType} Match</span>
                    </div>
                  </div>

                  {/* Match Schedule */}
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{b.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{b.displayTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Uttara Metro Center · MRT Line-6</span>
                    </div>
                  </div>

                  {/* Addons if any */}
                  {b.addOns && b.addOns.length > 0 && (
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500">Add-ons: </span>
                      <span className="text-slate-300">{b.addOns.map(a => a.name).join(', ')}</span>
                    </div>
                  )}

                  {/* Price Row */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Amount:</span>
                    <span className="font-mono font-bold text-white text-sm">৳{b.totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-white/5">
                  <button
                    onClick={() => setActiveTicketPass(b)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/30 transition-all cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Pass</span>
                  </button>

                  <button
                    onClick={() => handleShareSquad(b)}
                    className="w-full py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#25D366]/30 transition-all cursor-pointer"
                    title="Share with your squad"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Invite Squad</span>
                  </button>

                  <div className="col-span-2 pt-1 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Cancel booking for ${b.teamName} (${b.bookingCode})?`)) {
                          handleCancelBooking(b.id);
                        }
                      }}
                      className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Cancel Slot</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
