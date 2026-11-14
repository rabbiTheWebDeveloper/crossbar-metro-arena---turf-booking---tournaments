'use client';
import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { weekendDaysLabel } from '../../lib/dateUtils';
import { Container, Eyebrow, SectionTitle, Button } from './ui';
import { bdt, periodSummary, periodTiers } from './slots';

/** Card order follows the design: cheapest, the featured prime-time card in the middle, then the rest. */
const CARD_ORDER = ['morning', 'evening', 'afternoon'];
const PERIOD_NAMES = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };

/**
 * "Pay for the slot. Nothing else." — one card per part of the day, priced from the admin's
 * slot matrix (weekday rate, with the weekend rate underneath).
 *   onBook(period): jump to the slot picker filtered to that period
 */
export function PricingSection({ onBook }) {
    const { pricing } = useArena();
    const summary = useMemo(() => periodSummary(pricing), [pricing]);
    const tiers = useMemo(() => periodTiers(pricing), [pricing]);
    const weekendLabel = weekendDaysLabel(pricing.weekendDays);
    const advance = Number(pricing.advanceAmount) > 0 ? Number(pricing.advanceAmount) : 500;
    const windowDays = Number(pricing.bookingWindowDays) > 0 ? Number(pricing.bookingWindowDays) : 60;

    const points = {
        morning: [`Daylight kick-offs from ${summary.morning?.range.split(' – ')[0] || '6 AM'}`, `${summary.morning?.count || 4} slots of 90 minutes`, 'Good for training sessions'],
        evening: ['Full floodlights', `${summary.evening?.count || 4} slots of 90 minutes`, `Book up to ${windowDays} days ahead`],
        afternoon: ['Midday to sunset kick-offs', `${summary.afternoon?.count || 4} slots of 90 minutes`, 'Add a referee, bibs or water at checkout']
    };

    const cards = CARD_ORDER.filter(key => summary[key]).map(key => ({ key, ...summary[key], tier: tiers[key], featured: tiers[key] === 'Peak' }));

    return (
        <section id="pricing" className="scroll-mt-24 bg-paper text-ink">
            <Container className="py-16 lg:py-[120px]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Eyebrow tone="pitch">Pricing</Eyebrow>
                        <SectionTitle className="mt-3">Pay for the slot. Nothing else.</SectionTitle>
                    </div>
                    <p className="max-w-[380px] text-[16px] leading-[1.55] text-ink/70 lg:pb-3">
                        Rates are for the whole pitch, per 90-minute slot — split it between the squad. {bdt(advance)} advance locks any slot; weekend rates apply on {weekendLabel}.
                    </p>
                </div>

                <div className="mt-10 lg:mt-12 grid gap-6 lg:grid-cols-3">
                    {cards.map(card => {
                        const dark = card.featured;
                        const from = card.weekdayMin !== card.weekdayMax;
                        return (
                            <article key={card.key} className={`flex flex-col rounded-[22px] border p-7 sm:p-8 ${dark ? 'border-ink bg-ink text-paper' : 'border-sage bg-white text-ink'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="font-bigs text-[34px] font-bold uppercase leading-none">{card.tier}</h3>
                                    {dark ? <span className="rounded-md bg-neon-dim px-2.5 py-1 font-code text-[12px] tracking-[0.04em] text-ink">Prime time</span> : null}
                                </div>
                                <div className={`mt-9 font-code text-[12px] uppercase tracking-[0.16em] ${dark ? 'text-paper/60' : 'text-ink/60'}`}>{PERIOD_NAMES[card.key]} · {card.range}</div>
                                <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                                    <span className={`font-bigs text-[60px] sm:text-[72px] font-bold leading-none ${dark ? 'text-neon' : 'text-ink'}`}>{bdt(card.weekdayMin)}</span>
                                    <span className={`text-[16px] ${dark ? 'text-paper/60' : 'text-ink/55'}`}>/ slot</span>
                                </div>
                                <div className={`mt-2 text-[14px] ${dark ? 'text-paper/60' : 'text-ink/60'}`}>
                                    {from ? `Up to ${bdt(card.weekdayMax)} on weekdays · ` : ''}{card.weekendMin === card.weekendMax ? bdt(card.weekendMin) : `${bdt(card.weekendMin)} – ${bdt(card.weekendMax).replace('BDT ', '')}`} on {weekendLabel}
                                </div>
                                <ul className="mt-8 space-y-3.5 text-[16px]">
                                    {points[card.key].map(point => (
                                        <li key={point} className="flex items-start gap-3">
                                            <Check className={`mt-1 h-4 w-4 shrink-0 ${dark ? 'text-neon' : 'text-pitch'}`} strokeWidth={2.4} />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button variant={dark ? 'neon' : 'ink'} onClick={() => onBook(card.key)} className="mt-9 w-full">
                                    Book {PERIOD_NAMES[card.key].toLowerCase()} slot
                                </Button>
                            </article>
                        );
                    })}
                </div>
            </Container>
        </section>
    );
}
