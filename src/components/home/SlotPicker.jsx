'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { addDaysIso, isWeekendDate, weekendDaysLabel } from '../../lib/dateUtils';
import { TurfWeatherWidget } from '../TurfWeatherWidget';
import { Container, Eyebrow, SectionTitle, Button } from './ui';
import { PERIODS, PRIMARY_COURT, bdt, clock12, dayParts, longDate, periodSummary, periodTiers } from './slots';

// The checkout form is only needed once a slot is chosen
const BookingModal = dynamic(() => import('../BookingModal').then(m => m.BookingModal), { ssr: false });

/** One kick-off tile. */
function SlotTile({ slot, selected, onSelect }) {
    const open = slot.status === 'available';
    const tag = selected ? 'Yours' : open ? (slot.isPeak ? 'Peak' : 'Open') : slot.status === 'on_hold' ? 'On hold' : slot.status === 'time_passed' ? 'Passed' : 'Booked';
    const sub = open ? bdt(slot.price) : slot.status === 'on_hold' ? 'Being paid for' : slot.status === 'time_passed' ? 'Kick-off passed' : 'Taken';
    const base = 'flex w-full flex-col justify-between rounded-xl border px-4 py-3.5 text-left min-h-[80px] transition-colors duration-150';
    const look = selected
        ? 'bg-neon border-neon text-ink'
        : open
            ? 'bg-moss border-hairline text-paper hover:border-neon/70 cursor-pointer'
            : 'bg-panel border-hairline/70 text-paper/35';
    return (
        <button
            type="button"
            disabled={!open}
            onClick={() => onSelect(slot)}
            aria-pressed={selected}
            aria-label={`${slot.displayTime}, ${open ? `${bdt(slot.price)}${slot.actualPrice > 0 ? ` (offer price, regular ${bdt(slot.actualPrice)})` : ''}, available` : sub}`}
            className={`${base} ${look}`}
        >
            <span className="flex items-baseline justify-between gap-2">
                <span className={`font-code text-[16px] tracking-[0.02em] ${open || selected ? '' : 'line-through'}`}>{clock12(slot.startTime)}</span>
                <span className={`font-code text-[11px] uppercase tracking-[0.08em] ${selected ? 'text-ink' : open ? (slot.isPeak ? 'text-ember' : 'text-neon') : 'text-paper/35'}`}>{tag}</span>
            </span>
            <span className={`mt-2 flex flex-wrap items-baseline gap-x-2 text-[14px] ${selected ? 'text-ink font-semibold' : open ? 'text-paper/65' : 'text-paper/35'}`}>
                {open && slot.actualPrice > 0 ? <s className={`text-[12px] font-normal ${selected ? 'text-ink/60' : 'text-paper/40'}`}>{bdt(slot.actualPrice)}</s> : null}
                <span className={open && slot.actualPrice > 0 && !selected ? 'text-paper font-semibold' : ''}>{sub}</span>
            </span>
        </button>
    );
}

const SummaryRow = ({ label, value, mono }) => (
    <div className="flex items-baseline justify-between gap-4">
        <dt className="text-[16px] text-paper/60">{label}</dt>
        <dd className={`text-right text-[16px] text-paper ${mono ? 'font-code tracking-[0.04em]' : 'font-medium'}`}>{value}</dd>
    </div>
);

/**
 * "Pick your slot": date strip, the day's 12 kick-offs grouped by period, and the booking summary
 * that opens the checkout (squad details, add-ons, SSLCommerz payment).
 *   date / onDateChange: selected day (YYYY-MM-DD)      period / onPeriodChange: 'all' | period key
 */
export function SlotPicker({ availability, ready, date, onDateChange, period, onPeriodChange }) {
    const { pricing, currentUser, showNotice, isInitialized } = useArena();
    const { today, lastDate, slotsFor, secondsToRefresh, refreshing, refreshNow } = availability;
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [checkoutSlot, setCheckoutSlot] = useState(null);
    const stripRef = useRef(null);

    const slots = useMemo(() => slotsFor(date), [slotsFor, date]);
    const selected = slots.find(s => s.slotNumber === selectedNumber && s.status === 'available') || null;
    const ranges = useMemo(() => periodSummary(pricing), [pricing]);
    const tiers = useMemo(() => periodTiers(pricing), [pricing]);
    const weekend = isWeekendDate(date, pricing.weekendDays);
    const freeCount = slots.filter(s => s.status === 'available').length;

    const days = useMemo(() => {
        const out = [];
        for (let iso = today; iso <= lastDate; iso = addDaysIso(iso, 1)) out.push(dayParts(iso, today));
        return out;
    }, [today, lastDate]);

    // A slot that was just taken by someone else cannot stay selected
    useEffect(() => { if (selectedNumber && !selected) setSelectedNumber(null); }, [selectedNumber, selected]);
    // Changing the day starts a fresh choice
    useEffect(() => { setSelectedNumber(null); }, [date]);
    // Keep the chosen day visible in the strip (e.g. when it was picked from the hero form)
    useEffect(() => {
        const el = stripRef.current?.querySelector('[data-active="true"]');
        if (el && stripRef.current) stripRef.current.scrollTo({ left: Math.max(0, el.offsetLeft - 8), behavior: 'smooth' });
    }, [date, ready]);

    const scrollStrip = (dir) => stripRef.current?.scrollBy({ left: dir * 369, behavior: 'smooth' });

    const continueToPayment = () => {
        if (!selected) return;
        if (currentUser && ['admin', 'staff', 'investor'].includes(currentUser.role)) {
            showNotice('info', `${currentUser.role === 'investor' ? 'Investors' : 'Admins'} cannot book online from this account. Admins add bookings from the Schedule tab instead.`);
            return;
        }
        setCheckoutSlot(selected);
    };

    const holdMinutes = Number(pricing.holdMinutes) > 0 ? Number(pricing.holdMinutes) : 10;
    const advance = Number(pricing.advanceAmount) > 0 ? Number(pricing.advanceAmount) : 500;
    const cancelHours = Number(pricing.cancellationHours) > 0 ? Number(pricing.cancellationHours) : 24;
    const side = parseInt(PRIMARY_COURT.format, 10) || 7;
    const pitchLabel = `Main Turf · ${side}-a-side`;
    const groups = PERIODS.filter(p => (period === 'all' || period === p.key) && slots.some(s => s.period === p.key));

    return (
        <section id="book" className="scroll-mt-24 bg-ink">
            <Container className="py-16 lg:py-[120px]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Eyebrow>Live availability</Eyebrow>
                        <SectionTitle className="mt-3 text-paper">Pick your slot</SectionTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex rounded-2xl border border-hairline bg-panel p-1.5">
                            <span className="rounded-xl bg-paper px-5 py-2.5 text-[15px] font-semibold text-ink">{pitchLabel}</span>
                        </div>
                        <button type="button" onClick={refreshNow} disabled={refreshing} className="inline-flex h-[54px] items-center gap-2 rounded-2xl border border-hairline bg-panel px-4 font-code text-[12px] uppercase tracking-[0.1em] text-paper/65 hover:text-neon transition-colors cursor-pointer" title="Refresh availability now">
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>{refreshing ? 'Updating' : `Live · ${secondsToRefresh}s`}</span>
                        </button>
                    </div>
                </div>

                <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
                    {/* ---- dates + slots ---- */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div ref={stripRef} className="no-scrollbar relative flex flex-1 snap-x gap-3 overflow-x-auto">
                                {ready ? days.map(d => {
                                    const active = d.iso === date;
                                    return (
                                        <button
                                            key={d.iso}
                                            type="button"
                                            data-active={active}
                                            onClick={() => onDateChange(d.iso)}
                                            aria-pressed={active}
                                            className={`flex h-[104px] w-[104px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border transition-colors cursor-pointer ${active ? 'border-neon bg-neon text-ink' : 'border-hairline bg-panel text-paper hover:border-neon/60'}`}
                                        >
                                            <span className={`font-code text-[11px] uppercase tracking-[0.14em] ${active ? 'text-ink' : 'text-paper/60'}`}>{d.weekday}</span>
                                            <span className="font-bigs text-[36px] font-bold leading-[1.1]">{d.day}</span>
                                            <span className={`font-code text-[11px] tracking-[0.08em] ${active ? 'text-ink' : 'text-paper/60'}`}>{d.isToday ? 'Today' : d.month}</span>
                                        </button>
                                    );
                                }) : Array.from({ length: 7 }, (_, i) => <span key={i} className="h-[104px] w-[104px] shrink-0 rounded-2xl border border-hairline bg-panel animate-pulse" />)}
                            </div>
                            <div className="hidden sm:flex flex-col gap-2">
                                <button type="button" onClick={() => scrollStrip(1)} className="flex h-[48px] w-11 items-center justify-center rounded-xl border border-hairline bg-panel text-paper/70 hover:text-neon cursor-pointer" aria-label="Later dates"><ChevronRight className="h-4 w-4" /></button>
                                <button type="button" onClick={() => scrollStrip(-1)} className="flex h-[48px] w-11 items-center justify-center rounded-xl border border-hairline bg-panel text-paper/70 hover:text-neon cursor-pointer" aria-label="Earlier dates"><ChevronLeft className="h-4 w-4" /></button>
                            </div>
                        </div>

                        {period !== 'all' ? (
                            <div className="mt-6 flex flex-wrap items-center gap-3 text-[14px] text-paper/65">
                                <span>Showing {PERIODS.find(p => p.key === period)?.label.toLowerCase()} kick-offs only.</span>
                                <button type="button" onClick={() => onPeriodChange('all')} className="font-semibold text-neon underline-offset-4 hover:underline cursor-pointer">Show all 12 slots</button>
                            </div>
                        ) : null}

                        {!ready ? (
                            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {Array.from({ length: 12 }, (_, i) => <span key={i} className="h-[80px] rounded-xl border border-hairline bg-panel animate-pulse" />)}
                            </div>
                        ) : groups.map(group => (
                            <div key={group.key} className="mt-10">
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    <h3 className="font-bigs text-[30px] sm:text-[34px] font-bold uppercase leading-none text-paper">{group.label}</h3>
                                    <span className="font-code text-[12px] tracking-[0.1em] text-paper/55">{ranges[group.key]?.range} · {tiers[group.key]}</span>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {slots.filter(s => s.period === group.key).map(slot => (
                                        <SlotTile key={slot.id} slot={slot} selected={selected?.slotNumber === slot.slotNumber} onSelect={(s) => setSelectedNumber(prev => (prev === s.slotNumber ? null : s.slotNumber))} />
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px] text-paper/65">
                            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-neon" />Open</span>
                            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-ember" />Peak rate</span>
                            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-paper/35" />Booked</span>
                            {ready && isInitialized ? <span className="font-code text-[12px] tracking-[0.08em] text-paper/45">{freeCount} of {slots.length} open · {weekend ? `${weekendDaysLabel(pricing.weekendDays)} rate` : 'weekday rate'}</span> : null}
                        </div>
                    </div>

                    {/* ---- booking summary ---- */}
                    <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-28 lg:self-start">
                        <div className="rounded-[22px] border border-hairline bg-panel p-6 sm:p-8">
                            <div className="font-code text-[12px] uppercase tracking-[0.18em] text-neon">Your booking</div>
                            <dl className="mt-6 space-y-5">
                                <SummaryRow label="Pitch" value={pitchLabel} />
                                <SummaryRow label="Date" value={ready ? longDate(date) : '—'} />
                                <SummaryRow label="Kick-off" value={selected ? selected.displayTime : 'Choose a slot'} />
                                <SummaryRow label="Duration" value={`${selected?.durationMinutes || 90} minutes`} />
                            </dl>
                            <dl className="mt-6 space-y-4 border-t border-hairline pt-6">
                                {selected && selected.actualPrice > 0 ? (
                                    <>
                                        <SummaryRow label={ready && weekend ? 'Actual price (weekend)' : 'Actual price'} value={<s className="text-paper/50">{bdt(selected.actualPrice)}</s>} mono />
                                        <SummaryRow label="Launch offer" value={<span className="text-neon">− {bdt(selected.actualPrice - selected.price)}</span>} mono />
                                    </>
                                ) : (
                                    <SummaryRow label={selected?.isPeak ? 'Peak slot rate' : ready && weekend ? 'Weekend slot rate' : 'Slot rate'} value={selected ? bdt(selected.price) : '—'} mono />
                                )}
                                <SummaryRow label="Booking fee" value="BDT 0" mono />
                            </dl>
                            <div className="mt-8 flex items-end justify-between gap-4">
                                <span className="pb-1.5 text-[16px] font-medium text-paper">Total</span>
                                <span className="font-bigs text-[48px] sm:text-[56px] font-bold leading-none text-neon">{selected ? bdt(selected.price) : 'BDT —'}</span>
                            </div>
                            <Button onClick={continueToPayment} disabled={!selected} className="mt-6 w-full">
                                {selected ? 'Continue to payment' : 'Pick a slot to continue'}
                            </Button>
                            <p className="mt-5 text-[14px] leading-[1.5] text-paper/60">
                                We hold your slot for {holdMinutes} minutes while you pay. Lock it with a {bdt(advance)} advance or pay in full. Changes up to {cancelHours} hours before kick-off go through the arena desk.
                            </p>
                            <ul className="mt-5 flex flex-wrap gap-2">
                                {['bKash', 'Nagad', 'Visa / Mastercard'].map(m => (
                                    <li key={m} className="rounded-md border border-hairline px-2.5 py-1 font-code text-[12px] tracking-[0.04em] text-paper/85">{m}</li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    <div className="min-w-0 lg:col-start-1">
                        <TurfWeatherWidget />
                    </div>
                </div>
            </Container>

            {checkoutSlot ? <BookingModal court={PRIMARY_COURT} slot={checkoutSlot} selectedDate={date} onClose={() => setCheckoutSlot(null)} /> : null}
        </section>
    );
}
