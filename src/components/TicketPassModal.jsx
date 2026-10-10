'use client';
import React, { useState } from 'react';
import { VENUE_INFO } from '../data/initialData';
import { CrossbarLogo } from './CrossbarLogo';
import { X, CheckCircle2, Share2, MapPin, Calendar, Clock, Users, Shield, Copy, Check } from 'lucide-react';
export const TicketPassModal = ({ booking, onClose }) => {
    const [copied, setCopied] = useState(false);
    const shareText = `⚽ MATCH DAY PASS - CROSSBAR METRO ARENA 🏟️\n\n` +
        `Squad: ${booking.teamName}\n` +
        `Court: ${booking.courtName}\n` +
        `Date: ${booking.date}\n` +
        `Kickoff Time: ${booking.displayTime}\n` +
        `Booking Ref: ${booking.bookingCode}\n` +
        `Venue: Uttara Metro Center, Sector 17, Dhaka (MRT Line-6)\n\n` +
        `Squad tag: Be on turf 15 minutes before kickoff for warmup! 🔥`;
    const handleCopyInvite = () => {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };
    const handleShareWhatsApp = () => {
        const encoded = encodeURIComponent(shareText);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    };
    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Glow behind ticket */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-slate-400 hover:text-white hover:bg-black/80 transition-colors">
          <X className="w-5 h-5"/>
        </button>

        {/* Ticket Header */}
        <div className="bg-gradient-to-b from-emerald-950 via-[#0e171f] to-[#0b1016] p-4 sm:p-6 text-center border-b border-white/10 relative">
          <div className="flex justify-center mb-2">
            <CrossbarLogo size="responsive"/>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/>
            <span>Slot Booking Confirmed</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-wide">
            Official Match Pass
          </h2>
          <div className="text-[11px] sm:text-xs text-slate-300">
            Show this pass upon arrival at Crossbar Metro Arena reception
          </div>
        </div>

        {/* Ticket Body with Notches */}
        <div className="relative p-4 sm:p-6 space-y-3.5 sm:space-y-4">
          {/* Left and Right Ticket Cutout Notches */}
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-black/85 border-r border-white/20"></div>
          <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-black/85 border-l border-white/20"></div>

          {/* Booking Code & Squad Display */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-white/[0.04] border border-white/10 gap-2">
            <div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-medium">Match Booking Code</div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-emerald-400">{booking.bookingCode}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-medium">Squad / Team</div>
              <div className="text-base sm:text-lg font-bold text-white truncate max-w-[130px] sm:max-w-[180px]">{booking.teamName}</div>
            </div>
          </div>

          {/* Match Details Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
            <div className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400 flex items-center gap-1 mb-1 text-[11px]">
                <Calendar className="w-3 h-3 text-emerald-400"/>
                <span>Match Date</span>
              </div>
              <div className="text-white font-semibold text-xs sm:text-sm">{booking.date}</div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400 flex items-center gap-1 mb-1 text-[11px]">
                <Clock className="w-3 h-3 text-emerald-400"/>
                <span>Kickoff Slot</span>
              </div>
              <div className="text-emerald-300 font-semibold text-xs sm:text-sm">{booking.displayTime}</div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400 flex items-center gap-1 mb-1 text-[11px]">
                <Shield className="w-3 h-3 text-emerald-400"/>
                <span>Pitch Assigned</span>
              </div>
              <div className="text-white font-semibold text-xs sm:text-sm truncate">{booking.courtName}</div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400 flex items-center gap-1 mb-1 text-[11px]">
                <Users className="w-3 h-3 text-emerald-400"/>
                <span>Captain / Contact</span>
              </div>
              <div className="text-white font-semibold text-xs sm:text-sm truncate">{booking.captainName}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">{booking.captainPhone}</div>
            </div>
          </div>

          {/* Add-ons if any */}
          {booking.addOns.length > 0 && (<div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs">
              <div className="text-slate-300 font-medium mb-1">Equipment & Extras Included:</div>
              <div className="flex flex-wrap gap-1.5">
                {booking.addOns.map((a) => (<span key={a.id} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px]">
                    {a.name}
                  </span>))}
              </div>
            </div>)}

          {/* Pricing & Payment Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.04] border border-white/10 text-xs">
            <div>
              <span className="text-slate-400">Total Slot Fee: </span>
              <span className="text-base font-bold font-mono text-white">৳{booking.totalPrice.toLocaleString()}</span>
            </div>
            <div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${booking.paymentStatus === 'paid_full' || booking.paymentStatus === 'paid_advance'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                {booking.paymentStatus === 'paid_full'
            ? 'Paid in Full'
            : booking.paymentStatus === 'paid_advance'
                ? 'Advance Verified'
                : 'Pay at Turf Counter'}
              </span>
            </div>
          </div>

          {/* Venue Location footer */}
          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
            <div>
              <strong className="text-slate-200">Crossbar Metro Arena:</strong> Uttara Metro Center, Sector 17, Dhaka-1230.
              <span className="block text-slate-400">Hotline: {VENUE_INFO.phone}</span>
            </div>
          </div>

          {/* Action Buttons: Share with Squad & WhatsApp */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button onClick={handleShareWhatsApp} className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-green-500/20">
              <Share2 className="w-4 h-4"/>
              <span>Share Pass with Squad</span>
            </button>

            <button onClick={handleCopyInvite} className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10">
              {copied ? (<>
                  <Check className="w-4 h-4 text-emerald-400"/>
                  <span className="text-emerald-400">Copied!</span>
                </>) : (<>
                  <Copy className="w-4 h-4"/>
                  <span>Copy Text</span>
                </>)}
            </button>
          </div>
        </div>
      </div>
    </div>);
};
