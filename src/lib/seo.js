/**
 * SEO configuration for Crossbar Metro Arena (bookcrossbar.com).
 * Import `buildMetadata` from server page files to get consistent titles,
 * descriptions, canonical URLs and social cards.
 */
import { VENUE_INFO } from '../data/initialData';

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://bookcrossbar.com').replace(/\/+$/, '');

export const siteConfig = {
    name: 'Crossbar Metro Arena',
    shortName: 'Crossbar Metro',
    url: BASE_URL,
    tagline: 'Floodlit Outdoor Football Turf beside Uttara Metro Center, Dhaka',
    description:
        'Book 90-minute floodlit football turf slots online at Crossbar Metro Arena, Sector 17 Uttara, Dhaka. 12 slots a day, pay the advance with bKash, Nagad or card, register for tournaments and post match results.',
    keywords: [
        'crossbar metro arena', 'bookcrossbar.com', 'dhaka turf booking', 'football turf uttara',
        'uttara metro center turf', 'turf tournament bangladesh', '7v7 football turf dhaka', 'floodlit turf dhaka'
    ],
    locale: 'en_US',
    logo: '/brand/crossbar-metro-arena-logo.png',
    themeColor: '#4cbf02',
    backgroundColor: '#070b0e'
};

/** Absolute canonical URL for a site path. */
export const getCanonicalUrl = (path = '/') => (path === '/' ? `${siteConfig.url}/` : `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`);

export const defaultOgImages = [
    { url: siteConfig.logo, width: 1024, height: 1024, alt: 'Crossbar Metro Arena logo' }
];

/**
 * Build page metadata. The root layout supplies the `%s | Crossbar Metro Arena` template,
 * so pass a short page title (or `absoluteTitle` for the home page).
 */
export function buildMetadata({ title, absoluteTitle, description = siteConfig.description, path = '/', noIndex = false, keywords = [] } = {}) {
    const canonical = getCanonicalUrl(path);
    const socialTitle = absoluteTitle || (title ? `${title} | ${siteConfig.name}` : siteConfig.name);
    return {
        title: absoluteTitle ? { absolute: absoluteTitle } : title,
        description,
        keywords: [...siteConfig.keywords, ...keywords],
        alternates: { canonical },
        openGraph: {
            title: socialTitle,
            description,
            url: canonical,
            siteName: siteConfig.name,
            locale: siteConfig.locale,
            type: 'website',
            images: defaultOgImages
        },
        twitter: {
            card: 'summary',
            title: socialTitle,
            description,
            images: [siteConfig.logo]
        },
        robots: noIndex ? { index: false, follow: false } : { index: true, follow: true }
    };
}

/** JSON-LD for the venue (SportsActivityLocation). Accepts the DB site settings, falls back to VENUE_INFO. */
export function venueSchema(settings = VENUE_INFO) {
    const s = { ...VENUE_INFO, ...(settings || {}) };
    const phone = String(s.phoneFormatted || s.phone || '').trim();
    return {
        '@context': 'https://schema.org',
        '@type': 'SportsActivityLocation',
        '@id': `${siteConfig.url}/#venue`,
        name: s.businessName || siteConfig.name,
        url: siteConfig.url,
        image: getCanonicalUrl(siteConfig.logo),
        description: s.aboutText || siteConfig.description,
        telephone: phone || undefined,
        email: s.email || undefined,
        address: {
            '@type': 'PostalAddress',
            streetAddress: s.address || undefined,
            addressLocality: 'Dhaka',
            addressCountry: 'BD'
        },
        openingHours: s.openingHours || undefined,
        sameAs: [s.facebookUrl, s.instagramUrl].filter(Boolean),
        sport: 'Football'
    };
}
