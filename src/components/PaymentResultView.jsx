'use client';
import React, { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useArena } from '@/context/ArenaContext';
import { formatIsoDate } from '@/lib/dateUtils';
import { formatMoney, paymentMethodLabel } from '@/data/finance';
import { buildBookingInvoice } from '@/lib/invoice';
import {
    CheckCircle2, XCircle, Ban, AlertTriangle, Loader2, Ticket, Copy, Check,
    Calendar, Clock, MapPin, Users, Shield, MessageCircle, Phone, ArrowRight,
    RotateCcw, Home, Printer, Share2, Sparkles, Download, FileText
} from 'lucide-react';

const PAID_STATUSES = ['paid_advance', 'paid_full'];

const REASON_MESSAGES = {
    rejected: {
        title: 'Payment Rejected',
        subtitle: 'Your bank, card issuer, or mobile wallet rejected this transaction.',
        detail: 'No booking was confirmed and the slot hold has been released. Check your card/wallet limit, OTP, or balance and try again with another payment method.'
    },
    validation_failed: {
        title: 'Payment Verification Failed',
        subtitle: 'We could not confirm a successful payment from the gateway.',
        detail: 'Your slot was not locked. If money was deducted from your account, please contact our arena desk on WhatsApp with the Transaction ID below so we can verify or refund it right away.'
    },
    slot_lost: {
        title: 'Slot Taken — Refund Queued',
        subtitle: 'Your payment arrived after the hold expired and another squad booked this slot.',
        detail: 'Do not worry — your payment is recorded and has been automatically queued for a full refund. Contact the arena desk on WhatsApp with your Transaction ID to speed up the refund or pick another slot.'
    },
    unknown_transaction: {
        title: 'Transaction Not Found',
        subtitle: 'We could not match this payment reference to a booking.',
        detail: 'If you completed a payment and money left your account, share the Transaction ID below with our arena desk on WhatsApp.'
    },
    server_error: {
        title: 'Could Not Process Gateway Response',
        subtitle: 'A temporary server error occurred while confirming your payment.',
        detail: 'If your account was charged, please contact the arena desk on WhatsApp with your Transaction ID — our team can verify and confirm your slot manually.'
    },
    default_failed: {
        title: 'Payment Failed',
        subtitle: 'The transaction could not be completed at the payment gateway.',
        detail: 'Your slot hold has been released so you can pick a slot and try again. You can pay with bKash, Nagad, Rocket, OKWallet, or Visa/Mastercard.'
    }
};

function PaymentResultContent({ variant }) {
    const searchParams = useSearchParams();
    const {
        lookupBooking, setActiveTicketPass, openInvoice, downloadInvoice, refreshBookings,
        siteSettings, currentUser, isVisitor
    } = useArena();

    const bookingCodeParam = (searchParams.get('bookingCode') || '').trim().toUpperCase();
    const tranId = (searchParams.get('tranId') || searchParams.get('merchantTransactionId') || '').trim();
    const gateway = (searchParams.get('gateway') || 'eps').trim().toLowerCase();
    const reason = (searchParams.get('reason') || '').trim().toLowerCase();
    const gatewayLabel = gateway === 'sslcommerz' ? 'SSLCommerz' : 'EPS (Easy Payment System)';

    const [verifyState, setVerifyState] = useState(variant === 'success' ? 'verifying' : 'idle');
    const [booking, setBooking] = useState(null);
    const [copiedField, setCopiedField] = useState('');
    const confettiFired = useRef(false);

    const verifySuccessBooking = useCallback(async () => {
        if (variant !== 'success') return;
        if (!bookingCodeParam) {
            setVerifyState('unverified');
            return;
        }
        setVerifyState('verifying');
        const r = await lookupBooking(bookingCodeParam, '', tranId);
        const b = r.ok ? r.booking : null;
        if (b && PAID_STATUSES.includes(b.paymentStatus)) {
            setBooking(b);
            setVerifyState('verified');
            refreshBookings().catch(() => {});
            if (!confettiFired.current) {
                confettiFired.current = true;
                try {
                    confetti({ particleCount: 95, spread: 78, origin: { y: 0.45 } });
                } catch {
                    // ignore
                }
            }
        } else {
            setBooking(b || null);
            setVerifyState('unverified');
        }
    }, [variant, bookingCodeParam, tranId, lookupBooking, refreshBookings]);

    useEffect(() => {
        if (variant === 'success') {
            verifySuccessBooking();
        }
    }, [variant, verifySuccessBooking]);

    const copyValue = async (field, text) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(prev => (prev === field ? '' : prev)), 2000);
        } catch {
            // ignore
        }
    };

    const venueName = siteSettings?.businessName || 'Crossbar Metro Arena';
    const venueAddress = siteSettings?.address || 'Uttara Metro Center, Sector 17, Dhaka';
    const hotlineDisplay = siteSettings?.phoneFormatted || siteSettings?.phone || '+880 1796-337133';
    const hotlineHref = siteSettings?.phone ? `tel:${String(siteSettings.phone).replace(/[^0-9+]/g, '')}` : 'tel:+8801796337133';
    const baseWhatsapp = siteSettings?.whatsappUrl || '';

    const buildSupportWhatsappUrl = () => {
        if (!baseWhatsapp) return '';
        const text = `Hello ${venueName}, I need help with my payment (${variant}${reason ? ` - ${reason}` : ''}).${bookingCodeParam ? ` Booking: ${bookingCodeParam}.` : ''}${tranId ? ` TranID: ${tranId}.` : ''}`;
        const sep = baseWhatsapp.includes('?') ? '&' : '?';
        return `${baseWhatsapp}${sep}text=${encodeURIComponent(text)}`;
    };

    const shareMatchPassOnWhatsApp = () => {
        if (!booking) return;
        const paid = Number(booking.advanceAmount ?? 0);
        const due = Number(booking.dueAmount ?? Math.max(0, (booking.totalPrice || 0) - paid));
        const text =
            `⚽ MATCH DAY PASS - ${venueName.toUpperCase()} 🏟️\n\n` +
            `Booking Code: ${booking.bookingCode || bookingCodeParam}\n` +
            `Squad: ${booking.teamName || '-'}\n` +
            `Date: ${booking.date || '-'}\n` +
            `Kickoff: ${booking.displayTime || '-'}\n` +
            `Paid: ${formatMoney(paid)} · Due at Arena: ${formatMoney(due)}\n` +
            `Venue: ${venueAddress}\n\n` +
            `See you on the pitch 15 minutes before kickoff!`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    };

    // ==================== SUCCESS / THANK YOU PAGE ====================
    if (variant === 'success') {
        if (verifyState === 'verifying') {
            return (
                <section className="py-16 sm:py-24 px-4">
                    <div className="max-w-xl mx-auto rounded-3xl bg-[#0c131a] border border-emerald-500/25 p-8 sm:p-10 text-center space-y-4 shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin"/>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-white font-display uppercase">
                            Confirming Your Payment…
                        </h1>
                        <p className="text-sm text-slate-400">
                            Verifying your transaction with {venueName}. This takes just a moment.
                        </p>
                    </div>
                </section>
            );
        }

        if (verifyState === 'verified' && booking) {
            const total = Number(booking.totalPrice || 0);
            const paid = Number(booking.advanceAmount || 0);
            const due = Number(booking.dueAmount ?? Math.max(0, total - paid));
            const addOns = Array.isArray(booking.addOns) ? booking.addOns : [];
            const code = booking.bookingCode || bookingCodeParam;
            const isFull = booking.paymentStatus === 'paid_full' || due <= 0;

            return (
                <section className="py-10 sm:py-16 px-4">
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* HERO THANK-YOU CARD */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-950/70 via-[#0c131a] to-[#0b1016] border border-emerald-500/40 shadow-2xl">
                            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/20 blur-3xl pointer-events-none"/>

                            {/* Header */}
                            <div className="relative p-6 sm:p-8 text-center border-b border-white/10 space-y-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
                                    <Sparkles className="w-3.5 h-3.5"/>
                                    <span>Payment Verified · {isFull ? 'Paid in Full' : 'Advance Confirmed'}</span>
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
                                    <CheckCircle2 className="w-9 h-9"/>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black text-white font-display uppercase tracking-tight">
                                    Thank You! Slot Locked
                                </h1>
                                <p className="text-sm text-slate-300 max-w-md mx-auto">
                                    Your turf booking at <strong className="text-white">{venueName}</strong> is confirmed. Save your booking code and show your Match Pass at reception.
                                </p>
                            </div>

                            {/* Body */}
                            <div className="p-6 sm:p-8 space-y-5">
                                {/* Booking Code & Squad */}
                                <div className="p-4 rounded-2xl bg-white/[0.04] border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Booking Reference Code</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-emerald-400 select-all">
                                                {code}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => copyValue('code', code)}
                                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
                                                title="Copy booking code"
                                                aria-label="Copy booking code"
                                            >
                                                {copiedField === 'code' ? <Check className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4"/>}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="sm:text-right">
                                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Squad / Team</div>
                                        <div className="text-lg font-bold text-white mt-0.5">{booking.teamName || '—'}</div>
                                    </div>
                                </div>

                                {/* Match Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/10 space-y-1">
                                        <div className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-emerald-400"/> Match Date</div>
                                        <div className="text-sm font-bold text-white">{booking.date ? formatIsoDate(booking.date) : '—'}</div>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/10 space-y-1">
                                        <div className="text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400"/> Kickoff Time</div>
                                        <div className="text-sm font-bold text-emerald-300 font-mono">
                                            Slot #{booking.slotNumber} · {booking.displayTime || '—'}
                                        </div>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/10 space-y-1">
                                        <div className="text-slate-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-emerald-400"/> Captain / Contact</div>
                                        <div className="text-sm font-bold text-white">{booking.captainName || '—'}</div>
                                        {booking.captainPhone && <div className="text-[11px] font-mono text-slate-400">{booking.captainPhone}</div>}
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-white/[0.025] border border-white/10 space-y-1">
                                        <div className="text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400"/> Venue</div>
                                        <div className="text-sm font-bold text-white">{booking.courtName || venueName}</div>
                                        <div className="text-[11px] text-slate-400">{venueAddress}</div>
                                    </div>
                                </div>

                                {/* Payment Summary */}
                                <div className="p-4 rounded-2xl bg-[#080d12] border border-white/10 text-xs space-y-2">
                                    <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold pb-1 border-b border-white/10">
                                        Payment Receipt
                                    </div>
                                    <div className="flex items-center justify-between text-slate-300">
                                        <span>Turf Slot Price</span>
                                        <span className="font-mono text-white">{formatMoney(booking.courtPrice ?? total)}</span>
                                    </div>
                                    {addOns.map(a => (
                                        <div key={a.id || a.name} className="flex items-center justify-between text-slate-400">
                                            <span>+ {a.name}</span>
                                            <span className="font-mono">{formatMoney(a.price)}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between text-white font-bold pt-2 border-t border-white/10">
                                        <span>Total Booking Value</span>
                                        <span className="font-mono">{formatMoney(total)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-emerald-400 font-bold text-sm">
                                        <span>Paid Online ({paymentMethodLabel(booking.paymentMethod) || gatewayLabel})</span>
                                        <span className="font-mono">{formatMoney(paid)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-300">
                                        <span>Due at Arena Desk</span>
                                        <span className={`font-mono font-bold ${due > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                                            {due > 0 ? formatMoney(due) : '৳0 (Settled)'}
                                        </span>
                                    </div>
                                    {(tranId || booking.epsTransactionId || booking.transactionId) && (
                                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-400">
                                            <span>Transaction ID</span>
                                            <button
                                                type="button"
                                                onClick={() => copyValue('tran', tranId || booking.epsTransactionId || booking.transactionId)}
                                                className="font-mono text-slate-200 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>{tranId || booking.epsTransactionId || booking.transactionId}</span>
                                                {copiedField === 'tran' ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3 opacity-60"/>}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Primary Actions */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 print:hidden">
                                    {!booking.isPublicView && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTicketPass(booking)}
                                            className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-500/20"
                                        >
                                            <Ticket className="w-4 h-4"/>
                                            <span>Open Match Pass</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={shareMatchPassOnWhatsApp}
                                        className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                    >
                                        <Share2 className="w-4 h-4 text-emerald-400"/>
                                        <span>Share with Squad</span>
                                    </button>
                                    {!booking.isPublicView && (
                                        <button
                                            type="button"
                                            onClick={() => downloadInvoice(buildBookingInvoice(booking, siteSettings))}
                                            className="py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-lime-400/20"
                                        >
                                            <Download className="w-4 h-4"/>
                                            <span>Download Invoice (PDF)</span>
                                        </button>
                                    )}
                                    {!booking.isPublicView && (
                                        <button
                                            type="button"
                                            onClick={() => openInvoice(buildBookingInvoice(booking, siteSettings))}
                                            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                        >
                                            <FileText className="w-4 h-4 text-emerald-400"/>
                                            <span>View Full Invoice</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                    >
                                        <Printer className="w-4 h-4"/>
                                        <span>Print Receipt</span>
                                    </button>
                                    <Link
                                        href={!isVisitor && currentUser?.role === 'player' ? '/customer' : '/booking'}
                                        className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <span>{!isVisitor && currentUser?.role === 'player' ? 'View My Bookings' : 'Book Another Slot'}</span>
                                        <ArrowRight className="w-4 h-4"/>
                                    </Link>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-[12px] text-slate-300 flex items-start gap-2.5">
                                    <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
                                    <span>Please arrive <strong>15 minutes before kickoff</strong> with turf shoes (TF) or rubber molded studs (AG). Metal studs are not permitted.</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center print:hidden">
                            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold">
                                <Home className="w-3.5 h-3.5"/> Return to Crossbar Metro Arena Home
                            </Link>
                        </div>
                    </div>
                </section>
            );
        }

        // Success URL visited, but booking is not yet verified as paid on server
        const waUrl = buildSupportWhatsappUrl();
        return (
            <section className="py-14 sm:py-20 px-4">
                <div className="max-w-xl mx-auto rounded-3xl bg-[#0c131a] border border-amber-500/40 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 mx-auto">
                        <AlertTriangle className="w-8 h-8"/>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-white font-display uppercase">Payment Verification Pending</h1>
                        <p className="text-sm text-slate-300">
                            We could not confirm the paid booking yet{bookingCodeParam ? <> for <span className="font-mono text-white font-bold">{bookingCodeParam}</span></> : ''}.
                            If you just completed payment, tap retry below or contact our arena desk with your Transaction ID.
                        </p>
                    </div>
                    {tranId && (
                        <div className="p-3 rounded-xl bg-[#080d12] border border-white/10 inline-flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500">Transaction ID:</span>
                            <span className="text-white font-bold">{tranId}</span>
                            <button type="button" onClick={() => copyValue('tran', tranId)} className="text-slate-400 hover:text-white cursor-pointer" aria-label="Copy transaction ID">
                                {copiedField === 'tran' ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                            </button>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                        {bookingCodeParam && (
                            <button
                                type="button"
                                onClick={verifySuccessBooking}
                                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4"/> Retry Verification
                            </button>
                        )}
                        {waUrl && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2">
                                <MessageCircle className="w-4 h-4 text-emerald-400"/> WhatsApp Desk
                            </a>
                        )}
                    </div>
                    <div className="pt-1">
                        <Link href="/booking" className="inline-block py-2 text-xs text-emerald-400 hover:underline font-semibold">
                            Go to Booking Page &amp; Find My Booking →
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    // ==================== CANCELLED PAGE ====================
    if (variant === 'cancelled') {
        const waUrl = buildSupportWhatsappUrl();
        return (
            <section className="py-14 sm:py-20 px-4">
                <div className="max-w-xl mx-auto rounded-3xl bg-[#0c131a] border border-amber-500/35 p-6 sm:p-9 text-center space-y-5 shadow-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                        <Ban className="w-3.5 h-3.5"/>
                        <span>Payment Cancelled</span>
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center text-amber-400 mx-auto">
                        <Ban className="w-8 h-8"/>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-black text-white font-display uppercase">
                            Payment Cancelled
                        </h1>
                        <p className="text-sm text-slate-300">
                            You cancelled the checkout at {gatewayLabel}. Your slot hold has been released and <strong>nothing was charged</strong>.
                        </p>
                    </div>

                    {tranId && (
                        <div className="p-3 rounded-xl bg-[#080d12] border border-white/10 inline-flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500">Reference ID:</span>
                            <span className="text-slate-200">{tranId}</span>
                            <button type="button" onClick={() => copyValue('tran', tranId)} className="text-slate-400 hover:text-white cursor-pointer" aria-label="Copy reference ID">
                                {copiedField === 'tran' ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                        <Link
                            href="/booking"
                            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4"/>
                            <span>Pick a Slot Again</span>
                        </Link>
                        <Link
                            href="/"
                            className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors"
                        >
                            <Home className="w-4 h-4"/>
                            <span>Back to Home</span>
                        </Link>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                        {waUrl && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline font-semibold">
                                <MessageCircle className="w-3.5 h-3.5"/> Need help? WhatsApp Desk
                            </a>
                        )}
                        <a href={hotlineHref} className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-mono">
                            <Phone className="w-3.5 h-3.5"/> {hotlineDisplay}
                        </a>
                    </div>
                </div>
            </section>
        );
    }

    // ==================== FAILED / REJECTED PAGE ====================
    const effectiveKey = variant === 'rejected'
        ? 'rejected'
        : (REASON_MESSAGES[reason] ? reason : 'default_failed');
    const copy = REASON_MESSAGES[effectiveKey];
    const waUrl = buildSupportWhatsappUrl();

    return (
        <section className="py-14 sm:py-20 px-4">
            <div className="max-w-xl mx-auto rounded-3xl bg-gradient-to-b from-rose-950/40 via-[#0c131a] to-[#0b1016] border border-rose-500/40 p-6 sm:p-9 text-center space-y-5 shadow-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider">
                    <XCircle className="w-3.5 h-3.5"/>
                    <span>{variant === 'rejected' ? 'Transaction Rejected' : reason === 'slot_lost' ? 'Refund Queued' : 'Payment Unsuccessful'}</span>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/35 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
                    <XCircle className="w-9 h-9"/>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-white font-display uppercase">
                        {copy.title}
                    </h1>
                    <p className="text-sm text-rose-200/90 font-medium">{copy.subtitle}</p>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">{copy.detail}</p>
                </div>

                {tranId && (
                    <div className="p-3.5 rounded-2xl bg-[#080d12] border border-white/10 text-xs font-mono flex items-center justify-between gap-2 text-left">
                        <div className="min-w-0">
                            <div className="text-[10px] uppercase text-slate-500">Transaction ID ({gatewayLabel})</div>
                            <div className="text-white font-bold truncate">{tranId}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => copyValue('tran', tranId)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 inline-flex items-center gap-1 cursor-pointer shrink-0"
                        >
                            {copiedField === 'tran' ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                            <span>{copiedField === 'tran' ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <Link
                        href="/booking"
                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4"/>
                        <span>Try Booking Again</span>
                    </Link>
                    {waUrl ? (
                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors"
                        >
                            <MessageCircle className="w-4 h-4 text-emerald-400"/>
                            <span>Contact Desk</span>
                        </a>
                    ) : (
                        <a
                            href={hotlineHref}
                            className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors"
                        >
                            <Phone className="w-4 h-4 text-emerald-400"/>
                            <span>Call Desk</span>
                        </a>
                    )}
                </div>

                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                    <a href={hotlineHref} className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-mono">
                        <Phone className="w-3.5 h-3.5"/> Hotline: {hotlineDisplay}
                    </a>
                    <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white">
                        <Home className="w-3.5 h-3.5"/> Back to Home
                    </Link>
                </div>
            </div>
        </section>
    );
}

export function PaymentResultView({ variant = 'success' }) {
    return (
        <Suspense
            fallback={
                <section className="py-20 px-4">
                    <div className="max-w-xl mx-auto rounded-3xl bg-[#0c131a] border border-white/10 p-10 text-center flex items-center justify-center gap-2 text-sm text-slate-400">
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin"/>
                        <span>Loading payment details…</span>
                    </div>
                </section>
            }
        >
            <PaymentResultContent variant={variant}/>
        </Suspense>
    );
}

export default PaymentResultView;
