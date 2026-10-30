'use client';
import React, { useState } from 'react';
import { useArena } from '../context/ArenaContext';
import { CrossbarLogo } from './CrossbarLogo';
import { X, CheckCircle2, Share2, MapPin, Calendar, Clock, Users, Shield, Copy, Check, AlertCircle } from 'lucide-react';

const HEADER = {
    paid_full: { label: 'Slot Booking Confirmed', cls: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', Icon: CheckCircle2 },
    paid_advance: { label: 'Slot Booking Confirmed', cls: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', Icon: CheckCircle2 },
    confirmed_unpaid: { label: 'Confirmed · Pay at Arena', cls: 'bg-amber-500/20 border-amber-500/40 text-amber-300', Icon: CheckCircle2 },
    pending_payment: { label: 'Payment in Progress', cls: 'bg-sky-500/20 border-sky-500/40 text-sky-300', Icon: AlertCircle },
    needs_refund: { label: 'Refund Pending', cls: 'bg-violet-500/20 border-violet-500/40 text-violet-300', Icon: AlertCircle },
    cancelled: { label: 'Booking Cancelled', cls: 'bg-rose-500/20 border-rose-500/40 text-rose-300', Icon: AlertCircle }
};
const PAY_LABEL = {
    paid_full: { label: 'Paid in Full', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    paid_advance: { label: 'Advance Paid', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    confirmed_unpaid: { label: 'Pay at Arena Desk', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    pending_payment: { label: 'Payment in Progress', cls: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
    needs_refund: { label: 'Refund Pending', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
    cancelled: { label: 'Cancelled', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
};
const money = (n) => `৳${(Number(n) || 0).toLocaleString()}`;

export const TicketPassModal = ({ booking, onClose }) => {
    const { siteSettings } = useArena();
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState('');
    const b = booking || {};
    const status = b.paymentStatus || 'confirmed_unpaid';
    const header = HEADER[status] || { label: String(status).replaceAll('_', ' '), cls: 'bg-white/10 border-white/20 text-slate-200', Icon: CheckCircle2 };
    const pay = PAY_LABEL[status] || { label: String(status).replaceAll('_', ' '), cls: 'bg-white/10 text-slate-200 border-white/20' };
    const HeaderIcon = header.Icon;
    const total = Number(b.totalPrice ?? 0) || 0;
    const paid = Number(b.advanceAmount ?? 0) || 0;
    const due = Number(b.dueAmount ?? Math.max(0, total - paid)) || 0;
    const addOns = Array.isArray(b.addOns) ? b.addOns : [];
    const venueName = siteSettings?.businessName || 'Crossbar Metro Arena';
    const venueAddress = siteSettings?.address || 'Uttara, Dhaka';
    const hotline = siteSettings?.phoneFormatted || siteSettings?.phone || '';

    const shareText = `⚽ MATCH DAY PASS - ${venueName.toUpperCase()} 🏟️\n\n` +
        `Squad: ${b.teamName || '-'}\n` +
        `Court: ${b.courtName || venueName}\n` +
        `Date: ${b.date || '-'}\n` +
        `Kickoff Time: ${b.displayTime || '-'}\n` +
        `Booking Ref: ${b.bookingCode || '-'}\n` +
        `Paid: ${money(paid)} · Due at arena: ${money(due)}\n` +
        `Venue: ${venueAddress}\n\n` +
        `Be on the turf 15 minutes before kickoff for warm-up!`;

    const handleCopyInvite = async () => {
        setCopyError('');
        try {
            if (!navigator?.clipboard?.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            setCopyError('Could not copy automatically. Long-press the text to copy it manually.');
        }
    };
    const handleShareWhatsApp = () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener');
    };

    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 blur-3xl pointer-events-none"></div>

        <button type="button" onClick={onClose} aria-label="Close" className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-slate-400 hover:text-white hover:bg-black/80 transition-colors cursor-pointer">
          <X className="w-5 h-5"/>
        </button>

        <div className="bg-gradient-to-b from-emerald-950 via-[#0e171f] to-[#0b1016] p-4 sm:p-6 text-center border-b border-white/10 relative">
          <div className="flex justify-center mb-2"><CrossbarLogo size="responsive"/></div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border text-[12px] sm:text-xs font-bold uppercase tracking-wider mb-2 ${header.cls}`}>
            <HeaderIcon className="w-3.5 h-3.5"/>
            <span>{header.label}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-wide">Official Match Pass</h2>
          <div className="text-[12px] sm:text-xs text-slate-300">Show this pass on arrival at the {venueName} reception</div>
        </div>

        <div className="relative p-4 sm:p-6 space-y-3.5 sm:space-y-4">
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-black/85 border-r border-white/20"></div>
          <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-black/85 border-l border-white/20"></div>

          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-white/[0.04] border border-white/10 gap-2">
            <div>
              <div className="text-[11px] sm:text-[12px] uppercase tracking-wider text-slate-400 font-medium">Match Booking Code</div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-emerald-400">{b.bookingCode || '—'}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] sm:text-[12px] uppercase tracking-wider text-slate-400 font-medium">Squad / Team</div>
              <div className="text-base sm:text-lg font-bold text-white truncate max-w-[130px] sm:max-w-[180px]">{b.teamName || '—'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
            <div className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400 flex items-center gap-1 mb-1 text-[12px]"><Calendar className="w-3 h-3 text-emerald-400"/><span>Match Date</span></div>
              <div className="text-white font-semibold text-xs sm:text-sm">{b.date || '—'}</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400 flex items-center gap-1 mb-1 text-[12px]"><Clock className="w-3 h-3 text-emerald-400"/><span>Kickoff Slot</span></div>
              <div className="text-emerald-300 font-semibold text-xs sm:text-sm">{b.displayTime || '—'}</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400 flex items-center gap-1 mb-1 text-[12px]"><Shield className="w-3 h-3 text-emerald-400"/><span>Pitch Assigned</span></div>
              <div className="text-white font-semibold text-xs sm:text-sm truncate">{b.courtName || venueName}</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="text-slate-400 flex items-center gap-1 mb-1 text-[12px]"><Users className="w-3 h-3 text-emerald-400"/><span>Captain / Contact</span></div>
              <div className="text-white font-semibold text-xs sm:text-sm truncate">{b.captainName || '—'}</div>
              <div className="text-[11px] sm:text-[12px] text-slate-400 font-mono truncate">{b.captainPhone || ''}</div>
            </div>
          </div>

          {addOns.length > 0 && (<div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs">
              <div className="text-slate-300 font-medium mb-1">Equipment &amp; Extras Included:</div>
              <div className="flex flex-wrap gap-1.5">
                {addOns.map((a, i) => (<span key={a?.id || i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[12px]">
                    {typeof a === 'string' ? a : (a?.name || a?.id)}
                  </span>))}
              </div>
            </div>)}

          <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-400">Total Slot Fee: </span>
                <span className="text-base font-bold font-mono text-white">{money(total)}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider border ${pay.cls}`}>{pay.label}</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[12px] pt-2 border-t border-white/5">
              <span className="text-slate-400">Paid: <strong className="text-emerald-300">{money(paid)}</strong></span>
              <span className="text-slate-400">Due at arena: <strong className={due > 0 ? 'text-amber-300' : 'text-emerald-300'}>{money(due)}</strong></span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[12px] text-slate-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
            <div>
              <strong className="text-slate-200">{venueName}:</strong> {venueAddress}
              {hotline && <span className="block text-slate-400">Hotline: {hotline}</span>}
            </div>
          </div>

          {copyError && <div className="text-[11px] text-rose-300">{copyError}</div>}

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button type="button" onClick={handleShareWhatsApp} className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-green-500/20">
              <Share2 className="w-4 h-4"/>
              <span>Share Pass with Squad</span>
            </button>
            <button type="button" onClick={handleCopyInvite} className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10">
              {copied ? (<><Check className="w-4 h-4 text-emerald-400"/><span className="text-emerald-400">Copied!</span></>) : (<><Copy className="w-4 h-4"/><span>Copy Text</span></>)}
            </button>
          </div>
        </div>
      </div>
    </div>);
};
