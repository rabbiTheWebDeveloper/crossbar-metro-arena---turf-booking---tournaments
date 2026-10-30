'use client';
import React, { useMemo } from 'react';
import { X, Ticket, Calendar, Clock, ChevronRight } from 'lucide-react';

const STATUS_BADGE = {
    paid_full: { label: 'Paid', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
    paid_advance: { label: 'Advance paid', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
    confirmed_unpaid: { label: 'Pay at arena', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
    pending_payment: { label: 'Payment in progress', cls: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
    needs_refund: { label: 'Refund pending', cls: 'bg-violet-500/10 text-violet-300 border-violet-500/30' }
};
const badge = (s) => STATUS_BADGE[s] || { label: String(s || 'confirmed').replaceAll('_', ' '), cls: 'bg-white/5 text-slate-300 border-white/10' };
const money = (n) => `৳${(Number(n) || 0).toLocaleString()}`;

/** Drawer listing the signed-in user's own (non-cancelled) bookings. Receives `myBookings` from the context. */
export const MyPassesDrawer = ({ bookings, onClose, onSelectBooking, onBookMore }) => {
    const visible = useMemo(() => (Array.isArray(bookings) ? bookings : [])
        .filter(b => b && b.paymentStatus !== 'cancelled')
        .slice()
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (Number(b.slotNumber) || 0) - (Number(a.slotNumber) || 0)), [bookings]);

    return (<div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-md bg-[#0c1218] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Ticket className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase font-display">My Match Passes</h3>
              <p className="text-xs text-slate-400">Your slots at Crossbar Metro Arena</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {visible.length === 0 ? (<div className="text-center py-16 text-slate-400">
              <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-2"/>
              <div className="text-white font-bold text-sm">No Active Match Passes</div>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Book an open slot for your squad to get a matchday pass you can share on WhatsApp.
              </p>
              <button type="button" onClick={() => { onClose(); onBookMore(); }} className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer">
                Book Playing Slot
              </button>
            </div>) : (visible.map((b) => {
                const s = badge(b.paymentStatus);
                const paid = Number(b.advanceAmount) || 0;
                const due = Number(b.dueAmount) || 0;
                return (<div key={b.id} role="button" tabIndex={0} onClick={() => onSelectBooking(b)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectBooking(b); } }} className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="font-mono font-bold text-xs text-emerald-400">{b.bookingCode}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border uppercase font-semibold ${s.cls}`}>{s.label}</span>
                </div>
                <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">{b.teamName || 'My squad'}</div>
                <div className="text-xs text-slate-400 mt-0.5">{b.courtName}</div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-emerald-400"/><span>{b.date}</span></span>
                  <span className="flex items-center gap-1 font-mono text-emerald-300"><Clock className="w-3.5 h-3.5"/><span>{b.displayTime}</span></span>
                </div>
                <div className="mt-2 text-[11px] font-mono text-slate-400">
                  Paid {money(paid)} · Due <span className={due > 0 ? 'text-amber-300' : 'text-emerald-300'}>{money(due)}</span>
                </div>
              </div>);
            }))}
        </div>

        <div className="p-4 border-t border-white/10 bg-slate-950/50">
          <button type="button" onClick={() => { onClose(); onBookMore(); }} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer">
            <span>Book Another Slot</span>
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>);
};
