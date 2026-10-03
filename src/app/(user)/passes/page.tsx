'use client';

import React from 'react';
import Link from 'next/link';
import { useArena } from '../../../context/ArenaContext';
import { PageHero } from '../../../components/PageHero';
import { Ticket, Calendar, Clock, MapPin, Share2, Trash2, QrCode, Plus, Wallet, CheckCircle2, Users } from 'lucide-react';

const STATUS: Record<string, { label: string; cls: string }> = {
  paid_full: { label: 'PAID IN FULL', cls: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' },
  paid_advance: { label: 'ADVANCE PAID', cls: 'bg-amber-500/15 border-amber-500/40 text-amber-300' },
  confirmed_unpaid: { label: 'PAY AT TURF', cls: 'bg-sky-500/15 border-sky-500/40 text-sky-300' }
};

export default function PassesPage() {
  const { bookings, setActiveTicketPass, handleCancelBooking } = useArena();
  const totalSpend = bookings.reduce((s, b) => s + b.totalPrice, 0);
  const paid = bookings.filter((b) => b.paymentStatus === 'paid_full').length;

  const handleShareSquad = (booking: (typeof bookings)[0]) => {
    const text =
      `⚽ MATCH DAY PASS - CROSSBAR METRO ARENA 🏟️\n\n` +
      `Squad: ${booking.teamName}\n` +
      `Court: ${booking.courtName}\n` +
      `Date: ${booking.date}\n` +
      `Kickoff: ${booking.displayTime}\n` +
      `Ref: ${booking.bookingCode}\n` +
      `Venue: Uttara Metro Center, Sector 17, Dhaka (MRT Line-6)\n\n` +
      `Be at the turf 15 minutes before kickoff for warmup! 🔥`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <PageHero
        crumb="My Passes"
        eyebrow="Digital Gate Passes"
        eyebrowIcon={Ticket}
        title="My Match"
        highlight="Passes"
        description="Every confirmed reservation and QR entry pass for Crossbar Metro Arena, in one wallet."
        stats={[
          { label: 'Active Passes', value: `${bookings.length}`, icon: Ticket },
          { label: 'Total Value', value: `৳${totalSpend.toLocaleString()}`, icon: Wallet },
          { label: 'Fully Paid', value: `${paid}`, icon: CheckCircle2 },
          { label: 'Venue', value: 'Uttara Sec 17', icon: MapPin }
        ]}
        actions={
          <Link href="/booking" className="btn-volt inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm">
            <Plus className="w-4 h-4" />
            <span>Book Another Slot</span>
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {bookings.length === 0 ? (
          <div className="glass text-center py-20 px-6 rounded-3xl max-w-xl mx-auto space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400 float-slow">
              <Ticket className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-white font-display uppercase">No Passes Yet</h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Reserve a slot on Pitch Alpha or Bravo to receive an instant digital entry pass.
              </p>
            </div>
            <Link href="/booking" className="btn-volt inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm">
              <Calendar className="w-4 h-4" />
              <span>Browse Turf Slots</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((b) => {
              const st = STATUS[b.paymentStatus] ?? STATUS.confirmed_unpaid;
              return (
                <article key={b.id} className="glass glass-hover rounded-2xl overflow-hidden flex flex-col group">
                  {/* Ticket top */}
                  <div className="relative p-5 pb-4 bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                        {b.bookingCode}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white font-display uppercase tracking-wide group-hover:text-emerald-300 transition-colors">
                      {b.teamName}
                    </h2>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">{b.courtName}</span>
                      <span>·</span>
                      <span className="capitalize">{b.matchType}</span>
                    </div>
                  </div>

                  {/* Perforation */}
                  <div className="relative h-0 border-t-2 border-dashed border-white/10 mx-4">
                    <span className="absolute -left-7 -top-3 w-6 h-6 rounded-full bg-[#070b0e]" />
                    <span className="absolute -right-7 -top-3 w-6 h-6 rounded-full bg-[#070b0e]" />
                  </div>

                  {/* Ticket body */}
                  <div className="p-5 pt-4 space-y-3 flex-1">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-black/30 border border-white/5 p-3">
                        <div className="flex items-center gap-1.5 text-slate-500 mb-1"><Calendar className="w-3.5 h-3.5" /> Date</div>
                        <div className="font-bold text-white">{b.date}</div>
                      </div>
                      <div className="rounded-xl bg-black/30 border border-white/5 p-3">
                        <div className="flex items-center gap-1.5 text-slate-500 mb-1"><Clock className="w-3.5 h-3.5" /> Kickoff</div>
                        <div className="font-bold text-white">{b.displayTime}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Uttara Metro Center · MRT Line-6</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Captain {b.captainName} · {b.playerCount} players</span>
                    </div>

                    {b.addOns?.length > 0 && (
                      <div className="text-[11px] text-slate-400">
                        <span className="text-slate-500">Add-ons: </span>
                        <span className="text-slate-300">{b.addOns.map((a) => a.name).join(', ')}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Total</span>
                      <span className="font-mono font-black text-white text-lg">৳{b.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveTicketPass(b)}
                      className="py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/30 transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>View Pass</span>
                    </button>
                    <button
                      onClick={() => handleShareSquad(b)}
                      className="py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#25D366]/30 transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Invite Squad</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Cancel booking for ${b.teamName} (${b.bookingCode})?`)) handleCancelBooking(b.id);
                      }}
                      className="col-span-2 py-1.5 text-[11px] text-slate-500 hover:text-rose-400 transition-colors inline-flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Cancel Slot</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
