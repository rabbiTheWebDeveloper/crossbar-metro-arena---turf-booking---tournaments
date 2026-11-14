'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Award } from 'lucide-react';
import { useArena, todayDhaka } from '../../context/ArenaContext';
import { tournamentAvailability } from '../TournamentSection';
import { Container, Eyebrow, SectionTitle, Button } from './ui';
import { bdt } from './slots';

const TournamentModal = dynamic(() => import('../TournamentModal').then(m => m.TournamentModal), { ssr: false });

/**
 * "See it under the lights": the newest gallery photos (featured first) beside the tournaments
 * card, followed by the tournaments that are open for registration.
 */
export function GallerySection() {
    const { galleryPhotos, tournaments, handleRegistrationSuccess, showNotice } = useArena();
    const [registering, setRegistering] = useState(null);
    const today = todayDhaka();

    const photos = useMemo(() => {
        const list = [...(galleryPhotos || [])].filter(p => p && p.url);
        list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
        return list.slice(0, 2);
    }, [galleryPhotos]);

    const upcoming = useMemo(() => (tournaments || [])
        .map(t => ({ t, availability: tournamentAvailability(t, today) }))
        .sort((a, b) => ({ open: 0, full: 1, closed: 2 }[a.availability] - { open: 0, full: 1, closed: 2 }[b.availability]))
        .slice(0, 3), [tournaments, today]);

    const register = async (payload) => {
        const result = await handleRegistrationSuccess(payload);
        if (result && result.ok) {
            setRegistering(null);
            showNotice('success', result.message || `${payload.teamName} is registered for ${payload.tournamentTitle}.`);
        }
        return result;
    };

    return (
        <section id="gallery" className="scroll-mt-24 bg-ink">
            <Container className="py-16 lg:py-[120px]">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Eyebrow>Gallery</Eyebrow>
                        <SectionTitle className="mt-3 text-paper">See it under the lights</SectionTitle>
                    </div>
                    <Button variant="outline" href="/gallery" className="self-start sm:self-auto">View all photos</Button>
                </div>

                <div className="mt-10 lg:mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.53fr)_minmax(0,1fr)_320px]">
                    {photos.length > 0 ? photos.map((photo, i) => (
                        <Link key={photo.id || photo.url} href="/gallery" className={`group relative block overflow-hidden rounded-[22px] bg-panel h-[280px] sm:h-[380px] lg:h-[457px] ${i === 1 ? 'hidden sm:block' : ''}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.url} alt={photo.title || photo.caption || 'Crossbar Metro Arena'} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                            {photo.title ? (
                                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-5 pt-12">
                                    <span className="block font-code text-[11px] uppercase tracking-[0.14em] text-neon">{photo.album || 'Arena'}</span>
                                    <span className="mt-1 block text-[15px] font-medium text-paper">{photo.title}</span>
                                </span>
                            ) : null}
                        </Link>
                    )) : (
                        <div className="flex items-center justify-center rounded-[22px] border border-hairline bg-panel p-8 text-center text-[15px] text-paper/60 h-[220px] lg:h-[457px] lg:col-span-2">
                            Photos from the arena will appear here as soon as they are added to the gallery.
                        </div>
                    )}

                    <div className="flex flex-col justify-between rounded-[22px] bg-neon p-8 text-ink min-h-[300px] lg:h-[457px]">
                        <div>
                            <h3 className="font-bigs text-[34px] font-bold uppercase leading-[1.05]">Tournaments &amp; corporate leagues</h3>
                            <p className="mt-4 text-[16px] leading-[1.5] text-ink/85">
                                Need an all-day booking, referees and a custom format for your company, university or friends&apos; league? Talk to the arena desk and we will put a package together.
                            </p>
                        </div>
                        <Button variant="ink" href="/events" className="mt-8 self-start">Plan an event</Button>
                    </div>
                </div>

                {upcoming.length > 0 ? (
                    <div className="mt-12">
                        <div className="flex items-baseline justify-between gap-4">
                            <h3 className="font-bigs text-[30px] sm:text-[34px] font-bold uppercase leading-none text-paper">On the calendar</h3>
                            <Link href="/events" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-neon hover:underline underline-offset-4">All events <ArrowRight className="h-4 w-4" /></Link>
                        </div>
                        <ul className="mt-5">
                            {upcoming.map(({ t, availability }) => (
                                <li key={t.id} className="flex flex-col gap-4 border-t border-hairline py-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="font-code text-[12px] uppercase tracking-[0.14em] text-paper/55">{t.dates}{t.format ? ` · ${t.format}` : ''}</div>
                                        <div className="mt-1.5 text-[20px] font-semibold text-paper">{t.title}</div>
                                        <div className="mt-1 text-[15px] text-paper/60">
                                            Entry {bdt(t.entryFee)}{Number(t.prizePool) > 0 ? ` · Prize pool ${bdt(t.prizePool)}` : ''}{Number(t.maxTeams) > 0 ? ` · ${Math.max(0, Number(t.maxTeams) - Number(t.registeredCount || 0))} of ${t.maxTeams} places left` : ''}
                                        </div>
                                    </div>
                                    {availability === 'open'
                                        ? <Button size="sm" onClick={() => setRegistering(t)} className="shrink-0 self-start sm:self-auto">Register team</Button>
                                        : <span className="shrink-0 self-start rounded-md border border-hairline px-3 py-1.5 font-code text-[12px] uppercase tracking-[0.1em] text-paper/55 sm:self-auto">{availability === 'full' ? 'Full' : 'Registration closed'}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </Container>

            {registering ? <TournamentModal tournament={registering} onClose={() => setRegistering(null)} onRegisterSuccess={register} /> : null}
        </section>
    );
}

/**
 * "Fresh from the pitch": latest published result, the golden-boot table and the open squad
 * challenges, in the three-card band of the design.
 */
export function MatchdaySection() {
    const { matchResults, teams, challenges, setShowSquadModal } = useArena();

    const latest = useMemo(() => (matchResults || []).find(m => !m.status || m.status === 'published') || null, [matchResults]);
    const scorers = useMemo(() => (teams || [])
        .flatMap(t => (t.players || []).map(p => ({ ...p, teamName: t.name })))
        .filter(p => (p.goals || 0) > 0)
        .sort((a, b) => (b.goals || 0) - (a.goals || 0))
        .slice(0, 5), [teams]);
    const open = useMemo(() => (challenges || []).filter(c => !c.status || c.status === 'open'), [challenges]);

    const card = 'flex flex-col rounded-[22px] border border-hairline bg-ink p-7 sm:p-8';
    const label = 'font-code text-[12px] uppercase tracking-[0.16em] text-neon';

    return (
        <section className="bg-panel">
            <Container className="py-16 lg:py-[100px]">
                <Eyebrow>Match day</Eyebrow>
                <SectionTitle className="mt-3 text-paper">Fresh from the pitch</SectionTitle>

                <div className="mt-10 lg:mt-12 grid gap-6 lg:grid-cols-3">
                    <article className={card}>
                        <div className={label}>Latest result</div>
                        {latest ? (
                            <>
                                <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                    <span className="text-[18px] font-semibold leading-tight text-paper">{latest.homeTeam}</span>
                                    <span className="font-bigs text-[52px] font-bold leading-none text-neon">{latest.homeScore}–{latest.awayScore}</span>
                                    <span className="text-right text-[18px] font-semibold leading-tight text-paper">{latest.awayTeam}</span>
                                </div>
                                <p className="mt-5 text-[15px] leading-[1.5] text-paper/60">
                                    {latest.date}{latest.slotDisplay ? ` · ${latest.slotDisplay}` : ''}
                                    {latest.scorers && latest.scorers.length > 0 ? ` · Goals: ${latest.scorers.map(s => `${s.playerName} (${s.minute}')`).join(', ')}` : ''}
                                </p>
                                {latest.playerOfTheMatch ? (
                                    <p className="mt-3 inline-flex items-center gap-2 text-[15px] text-ember"><Award className="h-4 w-4" /> Player of the match: {latest.playerOfTheMatch}</p>
                                ) : null}
                            </>
                        ) : (
                            <p className="mt-6 text-[16px] leading-[1.5] text-paper/60">No match scores have been posted yet. Results appear here once the arena desk publishes them.</p>
                        )}
                        <Link href="/results" className="mt-auto inline-flex items-center gap-1.5 pt-8 text-[15px] font-medium text-neon hover:underline underline-offset-4">Results &amp; standings <ArrowRight className="h-4 w-4" /></Link>
                    </article>

                    <article className={card}>
                        <div className={label}>Golden boot · Top 5</div>
                        {scorers.length > 0 ? (
                            <ol className="mt-5">
                                {scorers.map((s, i) => (
                                    <li key={s.id || `${s.name}-${i}`} className="flex items-center justify-between gap-3 border-b border-hairline py-3 last:border-b-0">
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span className={`font-code text-[13px] ${i === 0 ? 'text-neon' : 'text-paper/45'}`}>{String(i + 1).padStart(2, '0')}</span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-[16px] font-medium text-paper">{s.name}</span>
                                                <span className="block truncate text-[13px] text-paper/50">{s.teamName}</span>
                                            </span>
                                        </span>
                                        <span className="font-bigs text-[26px] font-bold leading-none text-paper">{s.goals}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="mt-6 text-[16px] leading-[1.5] text-paper/60">No goal scorers registered yet. Match statistics update after certified fixtures.</p>
                        )}
                        <Link href="/results" className="mt-auto inline-flex items-center gap-1.5 pt-8 text-[15px] font-medium text-neon hover:underline underline-offset-4">Full leaderboard <ArrowRight className="h-4 w-4" /></Link>
                    </article>

                    <article className={card}>
                        <div className={label}>Find an opponent</div>
                        <div className="mt-6 flex items-end gap-3">
                            <span className="font-bigs text-[64px] font-bold leading-none text-neon">{String(open.length).padStart(2, '0')}</span>
                            <span className="pb-2 text-[16px] text-paper/70">{open.length === 1 ? 'squad is' : 'squads are'} looking for a match</span>
                        </div>
                        {open.length > 0 ? (
                            <ul className="mt-5">
                                {open.slice(0, 2).map(c => (
                                    <li key={c.id} className="border-t border-hairline py-3">
                                        <span className="block text-[16px] font-medium text-paper">{c.teamName}</span>
                                        <span className="block text-[13px] text-paper/50">{c.date} · {c.timeSlot}{c.level ? ` · ${c.level}` : ''}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-5 text-[16px] leading-[1.5] text-paper/60">Post a challenge and let other squads pick it up.</p>
                        )}
                        <div className="mt-auto flex flex-wrap gap-3 pt-8">
                            <Button size="sm" href="/matches">Challenge board</Button>
                            <Button size="sm" variant="outline" onClick={() => setShowSquadModal(true)}>Build your squad</Button>
                        </div>
                    </article>
                </div>
            </Container>
        </section>
    );
}

/** A short row of featured shop gear that can be reserved for pickup straight from the home page. */
export function ShopStrip() {
    const { shopProducts, addToCart } = useArena();
    const items = useMemo(() => (shopProducts || []).filter(p => p.visible !== false && (p.stock ?? 0) > 0 && (p.featured || p.inStock)).slice(0, 4), [shopProducts]);
    if (items.length === 0) return null;
    return (
        <section className="bg-ink">
            <Container className="pb-16 lg:pb-[120px]">
                <div className="flex flex-col gap-4 border-t border-hairline pt-12 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Eyebrow>Arena shop</Eyebrow>
                        <h2 className="mt-3 font-bigs text-[34px] sm:text-[44px] font-bold uppercase leading-none text-paper">Kit up at the desk</h2>
                    </div>
                    <Link href="/shop" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-neon hover:underline underline-offset-4">Visit the shop <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map(p => (
                        <li key={p.id} className="flex flex-col rounded-2xl border border-hairline bg-panel p-5">
                            {p.badge ? <span className="self-start rounded-md bg-moss px-2 py-1 font-code text-[11px] uppercase tracking-[0.1em] text-neon">{p.badge}</span> : null}
                            <h3 className="mt-3 !font-body2 text-[16px] font-semibold leading-snug text-paper line-clamp-2">{p.name}</h3>
                            <p className="mt-1.5 text-[14px] leading-[1.45] text-paper/55 line-clamp-2">{p.description}</p>
                            <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                                <span className="font-code text-[16px] text-paper">{bdt(p.salePrice || p.price)}</span>
                                <button type="button" onClick={() => addToCart(p, p.sizes?.[0])} className="h-10 rounded-lg bg-neon px-4 text-[14px] font-semibold text-ink hover:bg-neon-dim transition-colors cursor-pointer">Reserve</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </Container>
        </section>
    );
}
