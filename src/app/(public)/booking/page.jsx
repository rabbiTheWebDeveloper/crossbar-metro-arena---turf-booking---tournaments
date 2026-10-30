'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useArena } from '../../../context/ArenaContext';
import { BookingSection } from '../../../components/BookingSection';
import { TurfWeatherWidget } from '../../../components/TurfWeatherWidget';
import { PageHero } from '../../../components/PageHero';
import { Zap, Clock, Shield, Footprints, Calendar, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const GUIDELINES = [
    {
        icon: Clock,
        title: '12 Slots Daily (90 Mins Each)',
        text: 'Fixed 90-minute matches from 06:00 AM to 12:00 AM Midnight. No overlapping games. One slot, one team.'
    },
    {
        icon: Shield,
        title: '৳500 Advance or Full Payment',
        text: 'Secure your slot online with bKash, Nagad, or Card via SSLCommerz. Choose between a ৳500 advance (pay rest at counter) or 100% full online clearance.'
    },
    {
        icon: Calendar,
        title: '60-Day Advance Booking Window',
        text: 'Pick any match date up to 60 days in advance. Weekend rates (Friday & Saturday) apply automatically.'
    },
    {
        icon: Footprints,
        title: 'Turf Footwear Guidelines',
        text: 'Turf shoes (TF) or rubber molded studs (AG) required. Metal studs strictly forbidden on 50mm shock-pad turf.'
    }
];

function PaymentNotificationBanner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const payment = searchParams.get('payment');
    const bookingCode = searchParams.get('bookingCode');
    const tranId = searchParams.get('tranId');
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (payment === 'success') {
            try {
                confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 } });
            } catch { }
        }
    }, [payment]);

    if (!payment || dismissed) return null;

    if (payment === 'success') {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-[#0e1724] border border-emerald-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                    SSLCommerz Sandbox Verified
                                </span>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Paid &amp; Confirmed
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-white font-display uppercase mt-0.5">
                                Turf Slot Locked! Booking Code: <span className="font-mono text-emerald-400">{bookingCode}</span>
                            </h3>
                            <p className="text-xs text-slate-300 mt-0.5">
                                Transaction ID: <span className="font-mono text-white font-bold">{tranId}</span>. Match details and SMS confirmation dispatched.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setDismissed(true);
                            router.replace('/booking');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                    >
                        Dismiss &amp; Continue
                    </button>
                </div>
            </div>
        );
    }

    if (payment === 'failed' || payment === 'cancelled') {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="p-5 rounded-3xl bg-rose-950/60 border border-rose-500/40 shadow-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                        <div>
                            <strong className="text-white text-sm">
                                Payment {payment === 'cancelled' ? 'Cancelled by User' : 'Declined / Incomplete'}
                            </strong>
                            <p className="text-xs text-rose-300">
                                Your payment was not completed on SSLCommerz Sandbox. Please select your slot and try again.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setDismissed(true);
                            router.replace('/booking');
                        }}
                        className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

export default function BookingPage() {
    const { bookings, handleBookingSuccess } = useArena();
    return (
        <>
            <PageHero
                crumb="Book Slot"
                eyebrow="Official Crossbar Booking Engine"
                eyebrowIcon={Zap}
                title="Reserve Your"
                highlight="90-Min Turf Slot"
                description="12 slots daily, 90 minutes each, from 6 AM to 12 AM. Pick any date up to 60 days ahead. Pay online with bKash, Nagad, or Card via SSLCommerz (৳500 advance or full)."
                stats={[
                    { label: 'Schedule', value: '12 Slots / Day', icon: Clock },
                    { label: 'Match Time', value: '90 Mins', icon: Zap },
                    { label: 'Advance Window', value: 'Up to 60 Days', icon: Calendar },
                    { label: 'Payment Gateway', value: 'SSLCommerz Sandbox', icon: Shield }
                ]}
            />

            <Suspense fallback={null}>
                <PaymentNotificationBanner />
            </Suspense>

            {/* Live weather */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <TurfWeatherWidget />
            </div>

            <BookingSection bookings={bookings} onBookingSuccess={handleBookingSuccess} hideHeading />

            {/* Guidelines */}
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
                        {GUIDELINES.map((g, idx) => {
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
