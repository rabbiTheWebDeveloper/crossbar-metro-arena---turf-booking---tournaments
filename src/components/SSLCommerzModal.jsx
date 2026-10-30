'use client';
import React, { useState, useMemo, useRef } from 'react';
import { useArena } from '../context/ArenaContext';
import { COURTS, SCHEDULE_SLOTS_DEFINITION, BOOKING_ADDONS } from '../data/initialData';
import { isWeekendDate, formatIsoDate } from '../lib/dateUtils';
import { X, AlertTriangle, ExternalLink, Loader2, ShieldCheck, MessageCircle, Phone, Lock } from 'lucide-react';

const MATCH_TYPE_LABEL = { friendly: 'Friendly Scrimmage', competitive: 'Competitive Match', practice: 'Tactical Training', corporate: 'Corporate Game' };

const classifyError = (message) => {
    const m = String(message || '').toLowerCase();
    if (m.includes('not configured')) return 'gateway_unavailable';
    if (m.includes('another customer') || m.includes('already been reserved') || m.includes('taken a moment ago') || m.includes('could not reserve')) return 'slot_conflict';
    if (m.includes('already passed') || m.includes('days ahead') || m.includes('invalid date')) return 'bad_date';
    return 'generic';
};

/**
 * Step 2 of the public online booking: confirm the summary, create the server-side
 * payment hold (server prices everything) and redirect to the hosted SSLCommerz page.
 */
export const SSLCommerzModal = () => {
    const {
        setShowSSLCommerzModal, pendingBookingData, setPendingBookingData,
        startOnlinePayment, pricing, siteSettings, handleReleaseSlotHold, refreshBookings
    } = useArena();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverQuote, setServerQuote] = useState(null); // { amount, totalPrice, dueAfterPayment, bookingCode, holdExpiresAt }
    const [errorMessage, setErrorMessage] = useState('');
    const [errorKind, setErrorKind] = useState('');
    const redirectedRef = useRef(false);

    const pb = pendingBookingData;
    const courtId = COURTS[0].id;

    // Client-side estimate shown before the server quote arrives (server amounts replace it)
    const estimate = useMemo(() => {
        if (!pb) return null;
        const defs = Array.isArray(pricing.slotPrices) && pricing.slotPrices.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        const def = defs.find(d => Number(d.slotNumber) === Number(pb.slotNumber)) || {};
        const weekend = isWeekendDate(pb.date, pricing.weekendDays);
        const courtPrice = Number(weekend ? def.weekendPrice : def.weekdayPrice) || 0;
        const addOns = BOOKING_ADDONS.filter(a => (pb.addOns || []).includes(a.id));
        const addOnsPrice = addOns.reduce((s, a) => s + a.price, 0);
        const totalPrice = courtPrice + addOnsPrice;
        const advanceSetting = Number(pricing.advanceAmount) > 0 ? Number(pricing.advanceAmount) : 500;
        const amount = pb.paymentType === 'full_payment' ? totalPrice : Math.min(advanceSetting, totalPrice);
        return { displayTime: def.displayTime || `Slot #${pb.slotNumber}`, courtPrice, addOns, addOnsPrice, totalPrice, amount, dueAfterPayment: Math.max(0, totalPrice - amount) };
    }, [pb, pricing.slotPrices, pricing.weekendDays, pricing.advanceAmount]);

    if (!pb || !estimate) return null;

    const payable = serverQuote ? Number(serverQuote.amount) : estimate.amount;
    const total = serverQuote ? Number(serverQuote.totalPrice) : estimate.totalPrice;
    const dueAfter = serverQuote ? Number(serverQuote.dueAfterPayment) : estimate.dueAfterPayment;

    const closeModal = () => {
        if (isSubmitting || redirectedRef.current) return;
        // No redirect happened: free the cosmetic local hold so the grid is accurate
        handleReleaseSlotHold(courtId, pb.date, pb.slotNumber);
        setShowSSLCommerzModal(false);
        setPendingBookingData(null);
    };

    const handleConfirmAndPay = async () => {
        if (isSubmitting || redirectedRef.current) return;
        setIsSubmitting(true);
        setErrorMessage('');
        setErrorKind('');
        const r = await startOnlinePayment(pb);
        if (r.ok && r.gatewayUrl) {
            setServerQuote({ amount: r.amount, totalPrice: r.totalPrice, dueAfterPayment: r.dueAfterPayment, bookingCode: r.bookingCode, holdExpiresAt: r.holdExpiresAt });
            redirectedRef.current = true;
            // Keep the spinner on while the browser navigates away
            window.location.href = r.gatewayUrl;
            return;
        }
        setIsSubmitting(false);
        setErrorKind(classifyError(r.error));
        setErrorMessage(r.error || 'Could not start the payment. Please try again.');
        if (classifyError(r.error) === 'slot_conflict') refreshBookings().catch(() => { /* ignore */ });
    };

    const whatsappUrl = siteSettings?.whatsappUrl || '';
    const phoneHref = siteSettings?.phone ? `tel:${String(siteSettings.phone).replace(/[^0-9+]/g, '')}` : '';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="relative bg-[#0c131c] border border-emerald-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-[#101b2b] px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                            <Lock className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-white">Confirm &amp; pay securely</div>
                            <div className="text-[12px] text-slate-400">You will be redirected to SSLCommerz (bKash, Nagad, Rocket, cards)</div>
                        </div>
                    </div>
                    <button type="button" onClick={closeModal} disabled={isSubmitting} aria-label="Close" className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Booking summary */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/40 to-slate-900 border-b border-white/10 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs text-slate-400">Slot #{pb.slotNumber} · {estimate.displayTime}</div>
                            <div className="text-sm font-bold text-white mt-0.5">{formatIsoDate(pb.date)}</div>
                            <div className="text-xs text-slate-300 mt-1">
                                {pb.teamName} · {pb.captainName} · {pb.captainPhone}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{MATCH_TYPE_LABEL[pb.matchType] || 'Friendly Scrimmage'}</div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-xs text-slate-400 font-medium">{serverQuote ? 'Amount (confirmed)' : 'Pay now'}</div>
                            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">৳{payable.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-black/30 border border-white/10 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-300">
                            <span>Slot price</span>
                            <span className="font-mono text-white">৳{estimate.courtPrice.toLocaleString()}</span>
                        </div>
                        {estimate.addOns.map(a => (
                            <div key={a.id} className="flex items-center justify-between text-slate-400">
                                <span>+ {a.name}</span>
                                <span className="font-mono">৳{a.price.toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between text-white font-bold border-t border-white/10 pt-1">
                            <span>Total</span>
                            <span className="font-mono">৳{total.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-300 font-bold">
                            <span>{pb.paymentType === 'full_payment' ? 'Full payment online' : 'Advance online'}</span>
                            <span className="font-mono">৳{payable.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                            <span>Due at the arena desk</span>
                            <span className="font-mono">৳{dueAfter.toLocaleString()}</span>
                        </div>
                        {serverQuote?.bookingCode && (
                            <div className="flex items-center justify-between text-slate-400 pt-1">
                                <span>Booking code</span>
                                <span className="font-mono text-white">{serverQuote.bookingCode}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">

                    {errorMessage && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                                <span>{errorMessage}</span>
                            </div>
                            {errorKind === 'gateway_unavailable' && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {whatsappUrl && (
                                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold hover:bg-emerald-500/30">
                                            <MessageCircle className="w-3.5 h-3.5" /> Book on WhatsApp
                                        </a>
                                    )}
                                    {phoneHref && (
                                        <a href={phoneHref} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/10 font-bold hover:bg-white/15">
                                            <Phone className="w-3.5 h-3.5" /> Call {siteSettings.phoneFormatted || siteSettings.phone}
                                        </a>
                                    )}
                                </div>
                            )}
                            {(errorKind === 'slot_conflict' || errorKind === 'bad_date') && (
                                <button type="button" onClick={closeModal} className="px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/10 font-bold hover:bg-white/15 cursor-pointer">
                                    Pick another slot
                                </button>
                            )}
                        </div>
                    )}

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-[#0e1724] border border-emerald-500/40 space-y-3">
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>SSLCommerz secure checkout</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                The slot is held for you for {Number(pricing.holdMinutes) || 10} minutes once you continue. Complete the payment on the SSLCommerz page and you will be brought back here with your booking confirmation.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleConfirmAndPay}
                            disabled={isSubmitting || errorKind === 'gateway_unavailable'}
                            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{serverQuote ? 'Redirecting to SSLCommerz…' : 'Reserving your slot…'}</span>
                                </>
                            ) : (
                                <>
                                    <span>Pay ৳{payable.toLocaleString()} with SSLCommerz</span>
                                    <ExternalLink className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                    <button type="button" onClick={closeModal} disabled={isSubmitting} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50">
                        Go back
                    </button>
                </div>
            </div>
        </div>
    );
};
