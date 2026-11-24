'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ShoppingBag, User, LogOut } from 'lucide-react';
import { useArena, cleanPhone } from '../../context/ArenaContext';
import { isStandaloneDisplay } from '../Navbar';
import { CrossbarLogo } from '../CrossbarLogo';
import { Container, Button, scrollToId } from './ui';

/** In-page sections, in the order of the design's navigation. */
const SECTION_LINKS = [
    { id: 'book', label: 'Book a slot' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'location', label: 'Location' }
];

/** The rest of the site, reachable from the menu. */
const SITE_LINKS = [
    { href: '/results', label: 'Match day' },
    { href: '/matches', label: 'Fixtures & challenges' },
    { href: '/events', label: 'Events & tournaments' },
    { href: '/shop', label: 'Shop' },
    { href: '/venue', label: 'Venue & metro guide' },
    { href: '/about', label: 'About & price table' }
];

/**
 * Home page header: brand, section links, hotline and the booking call-to-action from the design,
 * plus the account, shop bag and full-site menu the previous navbar offered.
 */
export function HomeHeader() {
    const { siteSettings, currentUser, isVisitor, isAdmin, isInvestor, canAccessAdmin, logout, cartItems, setShowCartDrawer, setShowInstallModal, setShowHandoverGuide } = useArena();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [canInstall, setCanInstall] = useState(false);
    // The section links scroll on the home page and lead back to it from any other page
    const pathname = usePathname() || '/';
    const router = useRouter();
    const onHome = pathname === '/';
    const sectionHref = (id) => (onHome ? `#${id}` : `/#${id}`);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    useEffect(() => { setCanInstall(!isStandaloneDisplay()); }, []);
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    const phoneLabel = siteSettings.phoneFormatted || siteSettings.phone || '';
    const telHref = siteSettings.phone ? `tel:${cleanPhone(siteSettings.phone)}` : null;
    const cartCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const accountHref = canAccessAdmin ? '/admin' : isInvestor ? '/investor' : '/customer';
    const dashboards = [
        ...(!isVisitor && !isInvestor ? [{ href: '/customer', label: 'Customer panel' }] : []),
        ...(canAccessAdmin ? [{ href: '/admin', label: 'Admin panel' }] : []),
        ...(isAdmin || isInvestor ? [{ href: '/investor', label: 'Investor dashboard' }] : [])
    ];

    const goSection = (id) => {
        setMenuOpen(false);
        if (onHome) scrollToId(id);
        else router.push(`/#${id}`);
    };

    return (
        <header className={`sticky top-0 z-40 transition-colors duration-200 ${scrolled || menuOpen ? 'bg-ink/95 backdrop-blur-md border-b border-hairline' : 'bg-transparent border-b border-transparent'}`}>
            <Container className="flex h-[76px] lg:h-[108px] items-center justify-between gap-4">
                <Link href="/" className="flex items-center shrink-0" aria-label="Crossbar Metro Arena home">
                    <CrossbarLogo size="header" />
                </Link>

                {/* the section links need a wide bar; below it they live in the menu */}
                <nav className="hidden xl:flex items-center gap-6 min-[1400px]:gap-9" aria-label="Sections">
                    {SECTION_LINKS.map(link => (
                        <a key={link.id} href={sectionHref(link.id)} onClick={(e) => { e.preventDefault(); goSection(link.id); }} className="whitespace-nowrap text-[15px] font-medium text-paper/90 hover:text-neon transition-colors">
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* the hotline shows once the bar has room for it; a signed-in name takes more of that room */}
                    {telHref ? <a href={telHref} className={`hidden ${isVisitor ? 'min-[1400px]:inline' : 'min-[1520px]:inline'} whitespace-nowrap font-code text-[15px] text-paper hover:text-neon transition-colors mr-2`}>{phoneLabel}</a> : null}

                    <button type="button" onClick={() => setShowCartDrawer(true)} className="relative hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-xl border border-hairline text-paper/80 hover:text-neon hover:border-neon/50 transition-colors cursor-pointer" aria-label={`Shop bag, ${cartCount} items`}>
                        <ShoppingBag className="w-[18px] h-[18px]" />
                        {cartCount > 0 ? <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-neon text-ink text-[11px] font-bold flex items-center justify-center">{cartCount}</span> : null}
                    </button>

                    {isVisitor ? (
                        <Link href="/login" className="hidden md:inline-flex h-11 items-center gap-2 px-4 whitespace-nowrap rounded-xl border border-hairline text-[14px] font-medium text-paper/90 hover:text-neon hover:border-neon/50 transition-colors">
                            <User className="w-4 h-4" />
                            <span>Log in</span>
                        </Link>
                    ) : (
                        <Link href={accountHref} className="hidden md:inline-flex h-11 max-w-[170px] items-center gap-2 px-4 rounded-xl border border-hairline text-[14px] font-medium text-paper/90 hover:text-neon hover:border-neon/50 transition-colors" title="Open your dashboard">
                            <span className="w-2 h-2 rounded-full bg-neon shrink-0" />
                            <span className="truncate">{currentUser.name}</span>
                        </Link>
                    )}

                    <span className="hidden sm:block"><Button onClick={() => goSection('book')} className="whitespace-nowrap">Book a slot</Button></span>

                    <button type="button" onClick={() => setMenuOpen(o => !o)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-hairline text-paper hover:border-neon/50 transition-colors cursor-pointer" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </Container>

            {menuOpen ? (
                <div className="border-t border-hairline bg-ink max-h-[calc(100dvh-76px)] overflow-y-auto">
                    <Container className="pt-6 pb-28 md:pb-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="xl:hidden">
                            <div className="font-code text-[12px] uppercase tracking-[0.18em] text-paper/50 mb-3">{onHome ? 'On this page' : 'Home page'}</div>
                            <ul className="space-y-1">
                                {SECTION_LINKS.map(link => (
                                    <li key={link.id}>
                                        <a href={sectionHref(link.id)} onClick={(e) => { e.preventDefault(); goSection(link.id); }} className="block py-2 font-bigs text-[26px] uppercase leading-none text-paper hover:text-neon">{link.label}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div className="font-code text-[12px] uppercase tracking-[0.18em] text-paper/50 mb-3">Explore</div>
                            <ul className="space-y-1">
                                {SITE_LINKS.map(link => (
                                    <li key={link.href}><Link href={link.href} onClick={() => setMenuOpen(false)} className="block py-1.5 text-[16px] text-paper/90 hover:text-neon">{link.label}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div className="font-code text-[12px] uppercase tracking-[0.18em] text-paper/50 mb-3">Account</div>
                            <ul className="space-y-1">
                                {isVisitor ? (
                                    <>
                                        <li><Link href="/login" onClick={() => setMenuOpen(false)} className="block py-1.5 text-[16px] text-paper/90 hover:text-neon">Log in</Link></li>
                                        <li><Link href="/register" onClick={() => setMenuOpen(false)} className="block py-1.5 text-[16px] text-paper/90 hover:text-neon">Create a player account</Link></li>
                                        <li><Link href="/booking" onClick={() => setMenuOpen(false)} className="block py-1.5 text-[16px] text-paper/90 hover:text-neon">Find my booking</Link></li>
                                    </>
                                ) : (
                                    <>
                                        <li className="py-1.5 text-[14px] text-paper/60">Signed in as <span className="text-paper">{currentUser.name}</span></li>
                                        {dashboards.map(d => (
                                            <li key={d.href}><Link href={d.href} onClick={() => setMenuOpen(false)} className="block py-1.5 text-[16px] text-paper/90 hover:text-neon">{d.label}</Link></li>
                                        ))}
                                        <li>
                                            <button type="button" onClick={() => { setMenuOpen(false); logout(); }} className="flex items-center gap-2 py-1.5 text-[16px] text-paper/90 hover:text-neon cursor-pointer">
                                                <LogOut className="w-4 h-4" /> Log out
                                            </button>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                        <div>
                            <div className="font-code text-[12px] uppercase tracking-[0.18em] text-paper/50 mb-3">More</div>
                            <ul className="space-y-1">
                                <li>
                                    <button type="button" onClick={() => { setMenuOpen(false); setShowCartDrawer(true); }} className="block py-1.5 text-[16px] text-paper/90 hover:text-neon cursor-pointer">
                                        Shop bag{cartCount > 0 ? ` (${cartCount})` : ''}
                                    </button>
                                </li>
                                {telHref ? <li><a href={telHref} className="block py-1.5 font-code text-[15px] text-paper/90 hover:text-neon">{phoneLabel}</a></li> : null}
                                {isAdmin ? <li><button type="button" onClick={() => { setMenuOpen(false); setShowHandoverGuide(true); }} className="block py-1.5 text-[16px] text-paper/90 hover:text-neon cursor-pointer">Handover guide</button></li> : null}
                                {canInstall ? <li><button type="button" onClick={() => { setMenuOpen(false); setShowInstallModal(true); }} className="block py-1.5 text-[16px] text-paper/90 hover:text-neon cursor-pointer">Install app</button></li> : null}
                            </ul>
                            <div className="mt-4 sm:hidden"><Button onClick={() => goSection('book')} className="w-full">Book a slot</Button></div>
                        </div>
                    </Container>
                </div>
            ) : null}
        </header>
    );
}
