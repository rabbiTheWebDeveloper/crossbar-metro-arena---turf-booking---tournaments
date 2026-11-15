'use client';
import React from 'react';
import { Sun, Layers, Shirt, SquareParking, TrainFront, CreditCard } from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { Container, Eyebrow, SectionTitle } from './ui';
import { bdt } from './slots';

/** "Everything sorted before kick-off": the arena's real amenities next to the match-ball photo. */
export function FacilitiesSection() {
    const { siteSettings } = useArena();
    const facilities = [
        { icon: Sun, title: 'Match floodlights', text: 'High-mast LED lighting across the pitch for evening and night matches. Even, glare-free light.' },
        { icon: Layers, title: 'Cushioned turf', text: '50mm monofilament artificial grass on a shock pad, with fast drainage so the ball runs true.' },
        { icon: Shirt, title: 'Changing room', text: 'A changing room for both squads to get kitted up before kick-off.' },
        { icon: SquareParking, title: 'Parking on site', text: 'Space for cars and motorbikes right next to the arena entrance.' },
        { icon: TrainFront, title: 'Beside the metro', text: siteSettings.metroDetails || 'Next to Uttara Center Metro Station on MRT Line-6.' },
        { icon: CreditCard, title: 'Book and pay online', text: 'Pick a slot and pay the advance with bKash, Nagad or card. No double booking.' }
    ];
    return (
        <section id="facilities" className="scroll-mt-24 bg-ink">
            <Container className="py-16 lg:py-[120px]">
                <Eyebrow>The arena</Eyebrow>
                <SectionTitle className="mt-3 max-w-[760px] text-paper">Everything sorted before kick-off</SectionTitle>

                <div className="mt-10 lg:mt-14 grid gap-8 lg:grid-cols-[440px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-[22px] bg-panel h-[320px] sm:h-[420px] lg:h-full lg:min-h-[600px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/home/match-ball.jpg" alt="Match ball on the floodlit turf beside the goal" width={1024} height={1280} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </div>
                    <ul className="grid gap-x-8 sm:grid-cols-2">
                        {facilities.map(({ icon: Icon, title, text }) => (
                            <li key={title} className="border-t border-hairline py-7 lg:py-8">
                                <Icon className="h-7 w-7 text-neon" strokeWidth={1.8} />
                                <h3 className="mt-4 font-bigs text-[30px] sm:text-[34px] font-bold uppercase leading-none text-paper">{title}</h3>
                                <p className="mt-3 text-[16px] leading-[1.5] text-paper/60">{text}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </Container>
        </section>
    );
}

/** "From sofa to kick-off in three steps". */
export function StepsSection() {
    const { pricing } = useArena();
    const advance = Number(pricing.advanceAmount) > 0 ? Number(pricing.advanceAmount) : 500;
    const steps = [
        { title: 'Pick your slot', text: 'Choose a date. Free slots show their price up front.' },
        { title: 'Pay to lock it', text: `Pay the ${bdt(advance)} advance or the full amount by bKash, Nagad or card. Your digital match pass is issued straight away.` },
        { title: 'Turn up and play', text: 'Show your pass at the arena desk, settle any balance, and walk on a few minutes early.' }
    ];
    return (
        <section className="bg-panel">
            <Container className="py-16 lg:py-[100px]">
                <Eyebrow>How booking works</Eyebrow>
                <SectionTitle className="mt-3 text-paper">From sofa to kick-off in three steps</SectionTitle>
                <ol className="mt-10 lg:mt-12 grid gap-6 lg:grid-cols-3 lg:gap-8">
                    {steps.map((step, i) => (
                        <li key={step.title} className="rounded-[22px] border border-hairline bg-ink p-7">
                            <div className="font-bigs text-[64px] sm:text-[72px] font-bold leading-none text-neon">{String(i + 1).padStart(2, '0')}</div>
                            <h3 className="mt-5 font-bigs text-[32px] font-bold uppercase leading-none text-paper">{step.title}</h3>
                            <p className="mt-4 text-[16px] leading-[1.5] text-paper/60">{step.text}</p>
                        </li>
                    ))}
                </ol>
            </Container>
        </section>
    );
}
