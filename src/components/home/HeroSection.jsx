'use client';
import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { addDaysIso, nowDhakaMinutes } from '../../lib/dateUtils';
import { Container, Button } from './ui';
import { PERIODS, PRIMARY_COURT, dayParts, openingWindow, periodSummary } from './slots';

/** Photo behind the header and hero, faded into the page colour. Rendered once at the top of the page. */
export function HeroBackdrop() {
    return (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] lg:h-[900px] overflow-hidden" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/hero-night-pitch.jpg" alt="" width={1536} height={864} fetchPriority="high" decoding="async" className="absolute right-0 top-0 h-full w-full lg:w-[72%] object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-ink" />
        </div>
    );
}

const SelectField = ({ label, value, onChange, children, disabled }) => (
    <label className="block">
        <span className="font-code text-[12px] uppercase tracking-[0.16em] text-paper/60">{label}</span>
        <span className="relative mt-2 block">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="h-[54px] w-full appearance-none rounded-xl border border-hairline bg-ink pl-4 pr-11 text-[16px] font-medium text-paper outline-none transition-colors focus:border-neon disabled:opacity-100 cursor-pointer disabled:cursor-default"
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/70" />
        </span>
    </label>
);

/**
 * Hero: headline, live status pill, the "Find a free slot" form and the key numbers.
 *   availability: result of useAvailability()      ready: client has mounted (dates are known)
 *   onCheck(date, period): jump to the slot picker with that date / period applied
 */
export function HeroSection({ availability, ready, onCheck, onViewPricing }) {
    const { pricing, isInitialized } = useArena();
    const { today, todaySlots, lastDate } = availability;
    const [date, setDate] = useState(today);
    const [period, setPeriod] = useState('all');

    const hours = useMemo(() => openingWindow(pricing), [pricing]);
    const ranges = useMemo(() => periodSummary(pricing), [pricing]);
    const freeToday = todaySlots.filter(s => s.status === 'available').length;
    const isOpenNow = ready ? (nowDhakaMinutes() >= hours.open && nowDhakaMinutes() < hours.close) : false;
    const hoursOpen = Math.round((hours.close - hours.open) / 60);

    const dateOptions = useMemo(() => {
        const out = [];
        for (let i = 0; i < 14; i++) {
            const iso = addDaysIso(today, i);
            if (iso > lastDate) break;
            const p = dayParts(iso, today);
            out.push({ iso, label: `${p.weekday}, ${p.day} ${p.month}${i === 0 ? ' — Today' : i === 1 ? ' — Tomorrow' : ''}` });
        }
        return out;
    }, [today, lastDate]);

    const pill = !ready || !isInitialized
        ? 'Live availability'
        : `${isOpenNow ? 'Open now' : `Opens ${hours.openLabel}`} · ${freeToday === 0 ? 'Fully booked today' : `${freeToday} ${freeToday === 1 ? 'slot' : 'slots'} left today`}`;

    const side = parseInt(PRIMARY_COURT.format, 10) || 7; // "7 vs 7" -> 7
    const slotMinutes = todaySlots[0]?.durationMinutes || 90;
    const stats = [
        { value: String(todaySlots.length || 12), label: `Slots a day, ${slotMinutes} minutes each` },
        { value: `${hoursOpen} HRS`, label: `Open every day, ${hours.openLabel} to ${hours.closeLabel === '12 AM' ? 'midnight' : hours.closeLabel}` },
        { value: `${side}V${side}`, label: 'One floodlit pitch — the whole turf is yours' },
        { value: 'BDT 0', label: 'Booking fee. Pay only for the slot.' }
    ];

    return (
        <section className="relative z-10">
            <Container className="pt-10 lg:pt-[72px] pb-14 lg:pb-[72px]">
                <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
                    <div>
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-neon/70 px-4 py-2 font-code text-[12px] uppercase tracking-[0.16em] text-neon">
                            <span className={`h-2 w-2 rounded-full ${isOpenNow ? 'bg-neon' : 'bg-paper/40'}`} />
                            <span>{pill}</span>
                        </div>

                        <h1 className="mt-8 font-bigs font-bold uppercase leading-[0.9] text-paper text-[58px] sm:text-[88px] lg:text-[104px] xl:text-[120px]">
                            Football turf booking in Uttara, Dhaka
                        </h1>

                        <p className="mt-8 max-w-[560px] text-[17px] sm:text-[18px] leading-[1.55] text-paper/90">
                            A floodlit {side}-a-side turf at Crossbar Metro Arena, right beside Uttara Center metro station. See what&apos;s free, lock your {slotMinutes}-minute slot in under a minute, and pay with bKash, Nagad or card.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3.5">
                            <Button onClick={() => onCheck(today, 'evening')}>See tonight&apos;s slots</Button>
                            <Button variant="outline" onClick={onViewPricing}>View pricing</Button>
                        </div>
                    </div>

                    <form
                        className="rounded-[22px] border border-hairline bg-panel/95 p-6 sm:p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
                        onSubmit={(e) => { e.preventDefault(); onCheck(date, period); }}
                    >
                        <h2 className="font-bigs text-[34px] font-bold uppercase leading-none text-paper">Find a free slot</h2>
                        <div className="mt-6 space-y-5">
                            <SelectField label="Date" value={ready ? date : ''} onChange={setDate}>
                                {/* dates depend on the visitor's clock, so they are filled in after mount */}
                                {ready ? dateOptions.map(o => <option key={o.iso} value={o.iso}>{o.label}</option>) : <option value="">Today</option>}
                            </SelectField>
                            <SelectField label="Pitch" value={PRIMARY_COURT.id} onChange={() => { }}>
                                <option value={PRIMARY_COURT.id}>Main Turf · {side}-a-side</option>
                            </SelectField>
                            <SelectField label="Kick-off" value={period} onChange={setPeriod}>
                                <option value="all">Any time · {hours.openLabel} – {hours.closeLabel}</option>
                                {PERIODS.filter(p => ranges[p.key]).map(p => <option key={p.key} value={p.key}>{p.label} · {ranges[p.key].range}</option>)}
                            </SelectField>
                        </div>
                        <Button type="submit" className="mt-6 w-full">Check availability</Button>
                        <p className="mt-5 text-center font-code text-[12px] tracking-[0.04em] text-paper/55">No account needed · BDT 0 booking fee</p>
                    </form>
                </div>

                <dl className="mt-16 lg:mt-[120px] grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
                    {stats.map(s => (
                        <div key={s.label}>
                            <dd className="font-bigs text-[44px] sm:text-[52px] font-bold uppercase leading-none text-neon">{s.value}</dd>
                            <dt className="mt-3 text-[14px] sm:text-[15px] text-paper/65">{s.label}</dt>
                        </div>
                    ))}
                </dl>
            </Container>
            <div className="border-b border-hairline" />
        </section>
    );
}
