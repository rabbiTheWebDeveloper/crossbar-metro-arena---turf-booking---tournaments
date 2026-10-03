'use client';

import React from 'react';
import { Booking } from '../types';
import { X, Ticket, Calendar, Clock, MapPin, Share2, ChevronRight, CheckCircle2 } from 'lucide-react';

interface MyPassesDrawerProps {
  bookings: Booking[];
  onClose: () => void;
  onSelectBooking: (booking: Booking) => void;
  onBookMore: () => void;
}

export const MyPassesDrawer: React.FC<MyPassesDrawerProps> = ({
  bookings,
  onClose,
  onSelectBooking,
  onBookMore
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-md bg-[#0c1218] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase font-display">
                My Match Passes
              </h3>
              <p className="text-xs text-slate-400">Your confirmed slots at Crossbar Metro Arena</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {bookings.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <div className="text-white font-bold text-sm">No Active Match Passes</div>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Reserve an open slot for your squad to get instant matchday passes and WhatsApp share links.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onBookMore();
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Book Playing Slot
              </button>
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                onClick={() => onSelectBooking(b)}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    {b.bookingCode}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
                    {b.paymentStatus === 'paid_full' ? 'Paid' : 'Confirmed'}
                  </span>
                </div>

                <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {b.teamName}
                </div>

                <div className="text-xs text-slate-400 mt-0.5">
                  {b.courtName}
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{b.date}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-emerald-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{b.displayTime}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/50">
          <button
            onClick={() => {
              onClose();
              onBookMore();
            }}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Book Another Slot</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
