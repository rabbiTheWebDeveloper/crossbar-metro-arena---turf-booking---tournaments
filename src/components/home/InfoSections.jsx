'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Plus, Minus, ExternalLink } from 'lucide-react';
import { useArena, cleanPhone } from '../../context/ArenaContext';
import { BOOKING_FAQ } from '../../data/faq';
import { GOOGLE_MAPS_URL, getGoogleMapsEmbedUrl } from '../../data/initialData';
import { CrossbarLogo } from '../CrossbarLogo';
import { Container, Eyebrow, SectionTitle, Button, scrollToId } from './ui';

/** Contact details shared by the location block, the FAQ aside and the footer. */
function useContacts() {
    const { siteSettings } = useArena();
    const phoneLabel = siteSettings.phoneFormatted || siteSettings.phone || '';
    const telHref = siteSettings.phone ? `tel:${cleanPhone(siteSettings.phone)}` : null;
    const mapsUrl = siteSettings.googleMapsUrl || GOOGLE_MAPS_URL;
    const embedUrl = getGoogleMapsEmbedUrl(mapsUrl, siteSettings.address);
    return { siteSettings, phoneLabel, telHref, mapsUrl, embedUrl, whatsappUrl: siteSettings.whatsappUrl || '' };
}

/** Interactive Google Map embed with a quick action pill to open full directions in Google Maps. */
function MapTile({ href, embedUrl }) {
    return (
        <div className="relative h-[320px] sm:h-[420px] lg:h-[520px] overflow-hidden rounded-[22px] border border-sage bg-paper shadow-sm">
            <iframe
                src={embedUrl}
                title="Crossbar Metro Arena on Google Maps"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
            />
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Crossbar Metro Arena in Google Maps"
                className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-paper shadow-lg transition-transform hover:-translate-y-0.5 hover:text-neon"
            >
                <MapPin className="h-4 w-4 text-neon" />
                <span>Open in Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
        </div>
    );
}

/** "Find us in Uttara": address, hours, contact and directions. */
export function LocationSection() {
    const { siteSettings, phoneLabel, telHref, mapsUrl, embedUrl, whatsappUrl } = useContacts();
    const rows = [
        { label: 'Address', value: siteSettings.address, href: mapsUrl, external: true },
        { label: 'Hours', value: siteSettings.openingHours },
        { label: 'Phone & WhatsApp', value: phoneLabel, href: telHref },
        { label: 'Getting here', value: siteSettings.metroDetails || siteSettings.metroStation }
    ].filter(r => r.value);
    return (
        <section id="location" className="scroll-mt-24 bg-paper text-ink">
            <Container className="py-16 lg:py-[120px]">
                <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_600px] lg:gap-16">
                    <div>
                        <Eyebrow tone="pitch">Location</Eyebrow>
                        <SectionTitle className="mt-3">Find us in Uttara</SectionTitle>
                        <dl className="mt-8">
                            {rows.map(row => (
                                <div key={row.label} className="grid gap-1 border-t border-sage py-5 sm:grid-cols-[184px_minmax(0,1fr)] sm:gap-0">
                                    <dt className="font-code text-[12px] uppercase tracking-[0.16em] text-ink/60 sm:pt-1">{row.label}</dt>
                                    <dd className="text-[17px] font-medium text-ink">
                                        {row.href
                                            ? <a href={row.href} {...(row.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="hover:text-pitch">{row.value}</a>
                                            : row.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <div className="mt-8 flex flex-wrap gap-3.5">
                            <Button variant="ink" href={mapsUrl} external>Get directions</Button>
                            {whatsappUrl ? <Button variant="outline-ink" href={whatsappUrl} external>Message on WhatsApp</Button> : null}
                            <Button variant="outline-ink" href="/venue">Venue &amp; metro guide</Button>
                        </div>
                    </div>
                    <MapTile href={mapsUrl} embedUrl={embedUrl} />
                </div>
            </Container>
        </section>
    );
}

/** "Before you book": the booking FAQ as an accordion (first answer open, as in the design). */
export function FaqSection() {
    const { telHref, phoneLabel, whatsappUrl } = useContacts();
    const [openIndex, setOpenIndex] = useState(0);
    return (
        <section id="faq" className="scroll-mt-24 bg-ink">
            <Container className="py-16 lg:py-[120px]">
                <div className="grid gap-10 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-16">
                    <div>
                        <Eyebrow>Questions</Eyebrow>
                        <SectionTitle className="mt-3 text-paper">Before you book</SectionTitle>
                        <p className="mt-5 max-w-[440px] text-[16px] leading-[1.5] text-paper/60">
                            Can&apos;t find your answer? Call or WhatsApp the front desk any time we&apos;re open.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
                            {telHref ? <a href={telHref} className="inline-block py-1.5 font-code text-paper hover:text-neon">{phoneLabel}</a> : null}
                            {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-block py-1.5 text-neon hover:underline underline-offset-4">WhatsApp the desk</a> : null}
                        </div>
                    </div>
                    <ul className="border-b border-hairline">
                        {BOOKING_FAQ.map((item, i) => {
                            const open = openIndex === i;
                            return (
                                <li key={item.q} className="border-t border-hairline">
                                    <h3 className="m-0">
                                        <button type="button" onClick={() => setOpenIndex(open ? -1 : i)} aria-expanded={open} className="flex w-full items-center justify-between gap-6 py-7 text-left cursor-pointer">
                                            <span className="font-bigs text-[26px] sm:text-[34px] font-bold uppercase leading-[1.05] text-paper">{item.q}</span>
                                            {open ? <Minus className="h-5 w-5 shrink-0 text-neon" /> : <Plus className="h-5 w-5 shrink-0 text-paper/60" />}
                                        </button>
                                    </h3>
                                    {/* kept in the page (not unmounted) so the answers stay readable by search engines */}
                                    <p className={`max-w-[640px] pb-8 text-[16px] leading-[1.5] text-paper/60 ${open ? '' : 'hidden'}`}>{item.a}</p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </Container>
        </section>
    );
}

/**
 * Closing call-to-action on a pitch-green band.
 *   freeToday: open slots left today      ready: client has mounted
 *   onBook(date?): jump to the slot picker (optionally on another date)
 */
export function CtaBand({ freeToday, eveningFree, ready, tomorrow, onBook }) {
    const full = ready && freeToday === 0;
    const title = !ready ? 'The pitch is waiting' : full ? 'Today is fully booked' : eveningFree > 0 ? 'Tonight’s pitch is still open' : 'Today’s pitch is still open';
    const line = !ready ? 'Pick a date and lock your slot in under a minute.' : full ? 'Tomorrow still has room. Evening slots go first.' : `${freeToday} ${freeToday === 1 ? 'slot' : 'slots'} left today. Evening slots go first.`;
    return (
        <section className="bg-ink">
            <Container className="pb-16 lg:pb-[100px]">
                <div className="relative overflow-hidden rounded-[28px] bg-pitch-deep px-7 py-12 sm:px-12 lg:px-[72px] lg:py-[72px]">
                    <svg viewBox="0 0 1280 253" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                        <g stroke="#2a5f41" strokeWidth="1.5" fill="none">
                            <path d="M640 0V253" />
                            <circle cx="640" cy="126" r="76" />
                            <path d="M0 46H148V206H0M0 90H54V162H0" />
                            <path d="M1280 46H1132V206H1280M1280 90H1226V162H1280" />
                        </g>
                    </svg>
                    <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="font-bigs text-[42px] sm:text-[60px] lg:text-[72px] font-bold uppercase leading-[0.95] text-paper">{title}</h2>
                            <p className="mt-4 text-[17px] sm:text-[18px] text-paper/90">{line}</p>
                        </div>
                        <Button onClick={() => onBook(full ? tomorrow : undefined)} className="self-start lg:self-auto shrink-0">{full ? 'See tomorrow’s slots' : 'Book a slot now'}</Button>
                    </div>
                </div>
            </Container>
        </section>
    );
}

/** Footer from the design, linking to every part of the site. */
export function HomeFooter() {
    const { siteSettings, phoneLabel, telHref, mapsUrl } = useContacts();
    const { isVisitor, isAdmin, isInvestor, canAccessAdmin } = useArena();
    const onHome = (usePathname() || '/') === '/';
    // home sections: scroll in place on the home page, link back to it from any other page
    const hash = (id, label) => (onHome ? { label, onClick: (e) => { e.preventDefault(); scrollToId(id); }, href: `#${id}` } : { label, href: `/#${id}` });
    const columns = [
        { title: 'Play', links: [hash('book', 'Book a slot'), hash('pricing', 'Pricing'), { label: 'Tournaments', href: '/events' }, { label: 'Match results', href: '/results' }, { label: 'Find an opponent', href: '/matches' }] },
        { title: 'Arena', links: [hash('facilities', 'Facilities'), { label: 'Gallery', href: '/gallery' }, { label: 'Venue & metro guide', href: '/venue' }, { label: 'Shop', href: '/shop' }, { label: 'About & price table', href: '/about' }] },
        {
            title: 'Account',
            links: isVisitor
                ? [{ label: 'Log in', href: '/login' }, { label: 'Create an account', href: '/register' }, { label: 'Find my booking', href: '/booking' }]
                : [
                    ...(!isInvestor ? [{ label: 'Customer panel', href: '/customer' }] : []),
                    ...(canAccessAdmin ? [{ label: 'Admin panel', href: '/admin' }] : []),
                    ...(isAdmin || isInvestor ? [{ label: 'Investor dashboard', href: '/investor' }] : [])
                ]
        },
        {
            title: 'Contact',
            links: [
                ...(telHref ? [{ label: phoneLabel, href: telHref, external: false }] : []),
                ...(siteSettings.email ? [{ label: siteSettings.email, href: `mailto:${siteSettings.email}` }] : []),
                ...(mapsUrl ? [{ label: 'Google Maps', href: mapsUrl, external: true }] : []),
                ...(siteSettings.facebookUrl ? [{ label: 'Facebook', href: siteSettings.facebookUrl, external: true }] : []),
                ...(siteSettings.instagramUrl ? [{ label: 'Instagram', href: siteSettings.instagramUrl, external: true }] : [])
            ]
        }
    ];
    return (
        <footer className="bg-ink pb-24 md:pb-0">
            <Container className="pt-12 pb-10">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
                    <div className="max-w-[340px]">
                        <Link href="/" className="inline-block" aria-label="Crossbar Metro Arena home"><CrossbarLogo variant="stacked" size="md" /></Link>
                        <p className="mt-5 text-[16px] leading-[1.5] text-paper/60">
                            Floodlit football turf beside Uttara Center metro station, Dhaka. {siteSettings.openingHours ? `Open ${siteSettings.openingHours.replace(/\s*Every Day$/i, ', every day')}.` : ''}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-10 sm:grid-cols-4 lg:gap-x-20">
                        {columns.filter(c => c.links.length > 0).map(col => (
                            <div key={col.title}>
                                <div className="font-code text-[12px] uppercase tracking-[0.18em] text-paper/50">{col.title}</div>
                                <ul className="mt-5 space-y-2 lg:space-y-4">
                                    {col.links.map(link => (
                                        <li key={link.label}>
                                            {link.href.startsWith('/')
                                                ? <Link href={link.href} className="inline-block py-1.5 lg:py-0 text-[16px] text-paper hover:text-neon transition-colors">{link.label}</Link>
                                                : <a href={link.href} onClick={link.onClick} {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="inline-block py-1.5 lg:py-0 text-[16px] text-paper hover:text-neon transition-colors break-all lg:break-normal">{link.label}</a>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-12 flex flex-col gap-3 border-t border-hairline pt-8 font-code text-[12px] tracking-[0.06em] text-paper/60 sm:flex-row sm:items-center sm:justify-between">
                    <span>© {new Date().getFullYear()} Crossbar Metro Arena</span>
                    <span>{siteSettings.website || 'bookcrossbar.com'}</span>
                </div>
            </Container>
        </footer>
    );
}
