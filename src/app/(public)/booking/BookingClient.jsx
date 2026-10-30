'use client';
import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useArena, cleanPhone } from '../../../context/ArenaContext';
import { BookingSection } from '../../../components/BookingSection';
import { TurfWeatherWidget } from '../../../components/TurfWeatherWidget';
import { PageHero } from '../../../components/PageHero';
import { weekendDaysLabel, BD_PHONE_REGEX } from '../../../lib/dateUtils';
import { Zap, Clock, Shield, Footprints, Calendar, CheckCircle2, AlertTriangle, X, Loader2, Search, Ticket, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const PAID_STATUSES = ['paid_advance', 'paid_full'];

const STATUS_COPY = {
    failed: { title: 'Payment declined or incomplete', text: 'The payment was not completed at SSLCommerz. Your slot was released; pick it again to retry.' },
    cancelled: { title: 'Payment cancelled', text: 'You cancelled the payment at the gateway. The slot was released; nothing was charged.' },
    slot_lost: { title: 'Slot no longer available', text: 'Your payment went through but the slot was taken before it could be confirmed. The arena desk will arrange a refund — please contact them with the transaction id below.' },
    error: { title: 'Something went wrong', text: 'We could not process the gateway response. If money left your account, contact the arena desk with the transaction id below.' },
    unknown: { title: 'Payment status unknown', text: 'We could not determine the result of this payment. Use "Find my booking" below or contact the arena desk with the transaction id.' },
    pending_verification: { title: 'Payment is being verified', text: 'The gateway reported success but verification is still pending. Use "Find my booking" below in a minute, or contact the arena desk with the transaction id.' }
};

/**
 * Reads the gateway redirect params once, cleans the URL, then shows a verified result.
 * A "success" is only shown as confirmed after the server booking lookup says it is paid.
 */
function PaymentNotificationBanner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { lookupBooking, setActiveTicketPass, refreshBookings, siteSettings } = useArena();
    const [result, setResult] = useState(null); // { payment, bookingCode, tranId, reason }
    const [verifyState, setVerifyState] = useState('idle'); // idle | verifying | verified | unverified
    const [verifiedBooking, setVerifiedBooking] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const captured = useRef(false);

    // Capture the params once and clean the URL so a reload does not re-trigger anything
    useEffect(() => {
        if (captured.current) return;
        const payment = searchParams.get('payment');
        if (!payment) return;
        captured.current = true;
        setResult({
            payment,
            bookingCode: searchParams.get('bookingCode') || '',
            tranId: searchParams.get('tranId') || '',
            reason: searchParams.get('reason') || ''
        });
        router.replace('/booking');
    }, [searchParams, router]);

    // Verify a success against the server before claiming anything
    useEffect(() => {
        if (!result || result.payment !== 'success') return;
        let cancelled = false;
        (async () => {
            setVerifyState('verifying');
            const r = result.bookingCode ? await lookupBooking(result.bookingCode) : { ok: false };
            if (cancelled) return;
            const b = r.ok ? r.booking : null;
            if (b && PAID_STATUSES.includes(b.paymentStatus)) {
                setVerifiedBooking(b);
                setVerifyState('verified');
                setActiveTicketPass(b);
                refreshBookings().catch(() => { /* ignore */ });
                try { confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 } }); } catch { /* ignore */ }
            } else {
                setVerifyState('unverified');
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result]);

    if (!result || dismissed) return null;

    const dismiss = () => setDismissed(true);
    const whatsappUrl = siteSettings?.whatsappUrl || '';
    const TranId = () => (result.tranId ? (<>Transaction id: <span className="font-mono text-white font-bold">{result.tranId}</span>.</>) : null);

    if (result.payment === 'success') {
        if (verifyState === 'verifying' || verifyState === 'idle') {
            return (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                    <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 flex items-center gap-3 text-sm text-slate-300">
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
                        <span>Verifying your payment with the arena server…</span>
                    </div>
                </div>
            );
        }
        if (verifyState === 'verified' && verifiedBooking) {
            const paid = Number(verifiedBooking.advanceAmount ?? 0);
            const due = Number(verifiedBooking.dueAmount ?? Math.max(0, (verifiedBooking.totalPrice || 0) - paid));
            return (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-[#0e1724] border border-emerald-500/50 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Payment verified</span>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Paid &amp; confirmed
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-white font-display uppercase mt-0.5">
                                    Slot locked · Booking code <span className="font-mono text-emerald-400">{verifiedBooking.bookingCode}</span>
                                </h3>
                                <p className="text-xs text-slate-300 mt-1">
                                    {verifiedBooking.date} · {verifiedBooking.displayTime} · {verifiedBooking.teamName}
                                </p>
                                <p className="text-xs text-slate-300 mt-1">
                                    Paid: <span className="font-mono text-emerald-300 font-bold">৳{paid.toLocaleString()}</span>
                                    {' · '}Due at the arena: <span className="font-mono text-white font-bold">৳{due.toLocaleString()}</span>
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    <TranId /> Confirmation recorded — save your booking code and show the ticket pass at the desk.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button type="button" onClick={() => setActiveTicketPass(verifiedBooking)} className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5">
                                <Ticket className="w-4 h-4" /> Ticket pass
                            </button>
                            <button type="button" onClick={dismiss} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        // success param but the server does not show a paid booking
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="p-5 rounded-3xl bg-amber-950/50 border border-amber-500/40 shadow-xl flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                        <div>
                            <strong className="text-white text-sm">We could not verify this payment yet</strong>
                            <p className="text-xs text-amber-100 mt-1">
                                The gateway reported success but the booking {result.bookingCode ? <span className="font-mono text-white font-bold">{result.bookingCode}</span> : null} is not showing as paid. Please contact the arena desk with the transaction id <span className="font-mono text-white font-bold">{result.tranId || 'from your payment receipt'}</span>, or try "Find my booking" below in a minute.
                            </p>
                            {whatsappUrl && (
                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30">
                                    <MessageCircle className="w-3.5 h-3.5" /> Message the desk on WhatsApp
                                </a>
                            )}
                        </div>
                    </div>
                    <button type="button" onClick={dismiss} aria-label="Dismiss" className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white cursor-pointer shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    const copy = STATUS_COPY[result.payment] || STATUS_COPY.unknown;
    const isSoft = result.payment === 'cancelled';
    const needsDesk = ['slot_lost', 'error', 'unknown', 'pending_verification'].includes(result.payment);
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className={`p-5 rounded-3xl border shadow-xl flex items-start justify-between gap-4 ${isSoft ? 'bg-slate-900/80 border-white/10' : 'bg-rose-950/60 border-rose-500/40'}`}>
                <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-6 h-6 shrink-0 ${isSoft ? 'text-amber-400' : 'text-rose-400'}`} />
                    <div>
                        <strong className="text-white text-sm">{copy.title}</strong>
                        <p className={`text-xs mt-1 ${isSoft ? 'text-slate-300' : 'text-rose-200'}`}>{copy.text}</p>
                        {(result.tranId || result.reason) && (
                            <p className="text-[11px] text-slate-400 mt-1">
                                <TranId /> {result.reason ? `Reason: ${result.reason.replace(/_/g, ' ')}.` : ''}
                            </p>
                        )}
                        {needsDesk && whatsappUrl && (
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30">
                                <MessageCircle className="w-3.5 h-3.5" /> Contact the desk on WhatsApp
                            </a>
                        )}
                    </div>
                </div>
                <button type="button" onClick={dismiss} aria-label="Dismiss" className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white cursor-pointer shrink-0">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

/** Booking code + phone -> opens the ticket pass when the phone matches the captain's. */
function FindMyBooking() {
    const { lookupBooking, setActiveTicketPass, showNotice } = useArena();
    const [code, setCode] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        const c = code.trim().toUpperCase();
        const p = cleanPhone(phone);
        if (!c) { setError('Enter your booking code (e.g. CMA-XXXXXX).'); return; }
        if (!BD_PHONE_REGEX.test(p)) { setError('Enter the 11-digit mobile number used for the booking.'); return; }
        setError('');
        setIsSubmitting(true);
        const r = await lookupBooking(c, p);
        setIsSubmitting(false);
        if (!r.ok) { setError(r.error || 'Booking not found.'); return; }
        const b = r.booking;
        if (!b || b.isPublicView || !b.captainName) {
            setError('No booking matches that code and phone number. Check both and try again.');
            return;
        }
        setActiveTicketPass(b);
        showNotice('success', `Booking ${b.bookingCode} found`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 md:pb-2.5 md:min-w-[150px]">
                    <Search className="w-4 h-4" />
                    <span>Find my booking</span>
                </div>
                <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Booking code</label>
                    <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="CMA-XXXXXX" className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono uppercase placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mobile number used</label>
                    <input type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
                </div>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                    <span>Open ticket pass</span>
                </button>
                {error && <div className="w-full md:w-auto md:basis-full text-xs text-rose-300">{error}</div>}
            </form>
        </div>
    );
}

export default function BookingPage() {
    const { pricing } = useArena();
    const windowDays = Number(pricing.bookingWindowDays) > 0 ? Number(pricing.bookingWindowDays) : 60;
    const advance = Number(pricing.advanceAmount) > 0 ? Number(pricing.advanceAmount) : 500;
    const weekendLabel = weekendDaysLabel(pricing.weekendDays);

    const guidelines = [
        { icon: Clock, title: '12 Slots Daily (90 Mins Each)', text: 'Fixed 90-minute matches from 06:00 AM to 12:00 AM Midnight. No overlapping games. One slot, one team.' },
        { icon: Shield, title: `৳${advance.toLocaleString()} Advance or Full Payment`, text: `Secure your slot online with bKash, Nagad, or card via SSLCommerz. Choose a ৳${advance.toLocaleString()} advance (pay the rest at the counter) or 100% online.` },
        { icon: Calendar, title: `${windowDays}-Day Advance Booking Window`, text: `Pick any match date up to ${windowDays} days in advance. Weekend rates (${weekendLabel}) apply automatically.` },
        { icon: Footprints, title: 'Turf Footwear Guidelines', text: 'Turf shoes (TF) or rubber molded studs (AG) required. Metal studs strictly forbidden on 50mm shock-pad turf.' }
    ];

    return (
        <>
            <PageHero
                crumb="Book Slot"
                eyebrow="Official Crossbar Booking Engine"
                eyebrowIcon={Zap}
                title="Reserve Your"
                highlight="90-Min Turf Slot"
                description={`12 slots daily, 90 minutes each, from 6 AM to 12 AM. Pick any date up to ${windowDays} days ahead. Pay online with bKash, Nagad, or card via SSLCommerz (৳${advance.toLocaleString()} advance or full).`}
                stats={[
                    { label: 'Schedule', value: '12 Slots / Day', icon: Clock },
                    { label: 'Match Time', value: '90 Mins', icon: Zap },
                    { label: 'Advance Window', value: `Up to ${windowDays} Days`, icon: Calendar },
                    { label: 'Payment Gateway', value: 'SSLCommerz', icon: Shield }
                ]}
            />

            <Suspense fallback={null}>
                <PaymentNotificationBanner />
            </Suspense>

            <FindMyBooking />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <TurfWeatherWidget />
            </div>

            <BookingSection hideHeading />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                        <Shield className="w-4 h-4" />
                        <span>Crossbar Arena Match Day Regulations</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 font-display">
                        Official Booking Policies &amp; Turf Ground Rules
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {guidelines.map((g, idx) => {
                            const Icon = g.icon;
                            return (
                                <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-1.5">{g.title}</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">{g.text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}
