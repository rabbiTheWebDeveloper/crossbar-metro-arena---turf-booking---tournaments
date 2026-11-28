'use client';
import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { addDaysIso, nowDhakaMinutes } from '../../lib/dateUtils';
import { Container, Button } from './ui';
import { PERIODS, PRIMARY_COURT, bdt, dayParts, maxDiscount, openingWindow, periodSummary } from './slots';

const HERO_IMAGE_SRC = '/hero/hero_crossbar_arena_1795877110635.jpg';

/** Full-screen edge-to-edge arena photo behind header + hero, responsive across mobile, tablet, and desktop. */
export function HeroBackdrop() {
    return (
        <div
            className="pointer-events-none absolute inset-x-0 -top-[77px] lg:-top-[109px] bottom-0 -z-10 overflow-hidden select-none bg-ink"
            aria-hidden="true"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={HERO_IMAGE_SRC}
                alt=""
                width={1376}
                height={768}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                sizes="100vw"
                className="absolute inset-0 h-full w-full min-h-full min-w-full object-cover object-[60%_52%] sm:object-[56%_50%] md:object-[52%_48%] lg:object-[center_46%] 2xl:object-[center_44%]"
            />
            {/* Subtle top bar vignette so sticky header nav stays legible */}
            <div className="absolute inset-x-0 top-0 h-28 sm:h-32 bg-gradient-to-b from-ink/80 via-ink/30 to-transparent" />
            {/* Balanced full-cover scrim: keeps left text readable while showing pavilion, turf, players & Metro train */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,14,0.48)_0%,rgba(10,18,14,0.42)_55%,rgba(10,18,14,0.62)_100%)] lg:bg-[linear-gradient(90deg,rgba(10,18,14,0.72)_0%,rgba(10,18,14,0.50)_40%,rgba(10,18,14,0.24)_72%,rgba(10,18,14,0.18)_100%)]" />
            {/* Smooth bottom edge melt into #0a120e so the section transitions seamlessly */}
            <div className="absolute inset-x-0 bottom-0 h-36 sm:h-44 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
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
    const nowMins = nowDhakaMinutes();
    // after midnight the arena may still be finishing yesterday's last slot
    const isOpenNow = ready ? ((nowMins >= hours.open && nowMins < hours.close) || nowMins + 1440 < hours.close) : false;
    const discount = useMemo(() => maxDiscount(pricing), [pricing]);
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
        <section className="relative flex min-h-[calc(100svh-76px)] lg:min-h-[calc(100svh-108px)] flex-col justify-between">
            <HeroBackdrop />
            <Container className="relative z-10 flex flex-1 flex-col justify-between pt-6 sm:pt-10 lg:pt-12 pb-10 sm:pb-12 lg:pb-14">
                <div className="my-auto grid items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14 xl:gap-16">
                    <div>
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-neon/70 bg-ink/60 backdrop-blur-md px-3.5 sm:px-4 py-1.5 sm:py-2 font-code text-[11px] sm:text-[12px] uppercase tracking-[0.16em] text-neon">
                            <span className={`h-2 w-2 rounded-full ${isOpenNow ? 'bg-neon' : 'bg-paper/40'}`} />
                            <span>{pill}</span>
                        </div>

                        <h1 className="mt-5 sm:mt-7 font-bigs font-bold uppercase leading-[0.9] text-paper text-[44px] min-[390px]:text-[52px] sm:text-[72px] md:text-[84px] lg:text-[92px] xl:text-[108px] drop-shadow-[0_4px_28px_rgba(0,0,0,0.65)]">
                            Football turf booking in Uttara, Dhaka
                        </h1>

                        <p className="mt-5 sm:mt-7 max-w-[560px] text-[15px] sm:text-[17px] lg:text-[18px] leading-[1.55] text-paper drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]">
                            A floodlit {side}-a-side turf at Crossbar Metro Arena, right beside Uttara Center metro station. See what&apos;s free, lock your {slotMinutes}-minute slot in under a minute, and pay with bKash, Nagad or card.
                        </p>

                        {discount > 0 ? (
                            <p className="mt-5 sm:mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-neon px-4 py-2.5 text-ink shadow-lg shadow-black/30">
                                <span className="font-code text-[11px] sm:text-[12px] uppercase tracking-[0.16em]">Grand opening launch offer</span>
                                <span className="font-bigs text-[22px] sm:text-[24px] font-bold uppercase leading-none">Up to {bdt(discount)} off</span>
                            </p>
                        ) : null}

                        <div className="mt-6 sm:mt-8 flex flex-col min-[420px]:flex-row flex-wrap gap-3 sm:gap-3.5">
                            <Button onClick={() => onCheck(today, 'evening')} className="w-full min-[420px]:w-auto shadow-lg shadow-black/30">See tonight&apos;s slots</Button>
                            <Button variant="outline" onClick={onViewPricing} className="w-full min-[420px]:w-auto bg-ink/55 backdrop-blur-md">View pricing</Button>
                        </div>
                    </div>

                    <form
                        className="w-full max-w-[480px] lg:max-w-none mx-auto rounded-[22px] border border-paper/15 bg-panel/85 backdrop-blur-xl p-5 sm:p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]"
                        onSubmit={(e) => { e.preventDefault(); onCheck(date, period); }}
                    >
                        <h2 className="font-bigs text-[30px] sm:text-[34px] font-bold uppercase leading-none text-paper">Find a free slot</h2>
                        <div className="mt-5 sm:mt-6 space-y-4 sm:space-y-5">
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
                        <Button type="submit" className="mt-5 sm:mt-6 w-full">Check availability</Button>
                        <p className="mt-4 sm:mt-5 text-center font-code text-[12px] tracking-[0.04em] text-paper/70">No account needed · BDT 0 booking fee</p>
                    </form>
                </div>

                <dl className="mt-10 sm:mt-14 lg:mt-16 pt-6 sm:pt-8 border-t border-paper/15 grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-x-8 sm:gap-y-8 lg:grid-cols-4">
                    {stats.map(s => (
                        <div key={s.label}>
                            <dd className="font-bigs text-[38px] sm:text-[48px] lg:text-[52px] font-bold uppercase leading-none text-neon drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">{s.value}</dd>
                            <dt className="mt-2 sm:mt-2.5 text-[13px] sm:text-[15px] text-paper/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">{s.label}</dt>
                        </div>
                    ))}
                </dl>
            </Container>
            <div className="relative z-10 border-b border-hairline" />
        </section>
    );
}
