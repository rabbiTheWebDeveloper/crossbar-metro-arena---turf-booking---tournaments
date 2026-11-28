/**
 * SEO configuration and structured-data builders for Crossbar Metro Arena (bookcrossbar.com).
 *
 * - `buildMetadata()`   -> consistent <title>, description, canonical, Open Graph and Twitter cards
 * - `*Schema()` helpers -> JSON-LD objects (render them with <JsonLd data={...} />)
 *
 * Every public page should export `metadata = buildMetadata({...})` and render at least a
 * breadcrumb + WebPage schema so Google gets a clean entity graph:
 *   Organization -> WebSite -> WebPage -> (Event | Product | ImageGallery | FAQPage)
 */
import { VENUE_INFO, VENUE_COORDINATES, COURTS, SCHEDULE_SLOTS_DEFINITION } from '../data/initialData';

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://bookcrossbar.com').replace(/\/+$/, '');

/** Default map pin (Crossbar Metro Arena, Uttara Sector 17). Overridden by coordinates in googleMapsUrl when present. */
const DEFAULT_GEO = { latitude: VENUE_COORDINATES.latitude, longitude: VENUE_COORDINATES.longitude };

export const siteConfig = {
    name: 'Crossbar Metro Arena',
    shortName: 'Crossbar Metro',
    legalName: 'Crossbar Metro Arena',
    url: BASE_URL,
    domain: BASE_URL.replace(/^https?:\/\//, ''),
    tagline: 'Floodlit Outdoor Football Turf beside Uttara Metro Center, Dhaka',
    /** Keep under ~60 characters: it is the home page <title> and the social-card fallback. */
    defaultTitle: 'Football Turf Booking in Uttara, Dhaka | Crossbar Metro Arena',
    description:
        'Book 90-minute floodlit football turf slots online at Crossbar Metro Arena, Sector 17 Uttara, Dhaka. 12 slots a day, pay the advance with bKash, Nagad or card, register for tournaments and post match results.',
    keywords: [
        'crossbar metro arena', 'bookcrossbar.com', 'turf booking dhaka', 'football turf dhaka', 'football turf uttara',
        'turf uttara', 'uttara metro center turf', 'futsal dhaka', 'football ground rent dhaka', 'turf tournament bangladesh',
        '7v7 football turf dhaka', '5v5 turf dhaka', 'floodlit turf dhaka', 'online turf booking bangladesh', 'artificial turf football dhaka'
    ],
    locale: 'en_US',
    language: 'en',
    country: 'BD',
    region: 'BD-13',
    city: 'Dhaka',
    area: 'Uttara',
    logo: '/brand/crossbar-metro-arena-logo.png',
    icon512: '/brand/logo-512.png',
    /** Generated at build time by src/app/opengraph-image.jsx (1200x630). */
    ogImage: '/opengraph-image',
    themeColor: '#4cbf02',
    backgroundColor: '#070b0e',
    priceCurrency: 'BDT',
    paymentAccepted: 'bKash, Nagad, Rocket, Visa, Mastercard, Cash',
    /** Google Search Console + Bing Webmaster Tools verification tokens (optional). */
    googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    bingSiteVerification: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '',
    /** Google Analytics 4 measurement id (optional, e.g. G-XXXXXXXXXX). */
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
};

/** Absolute canonical URL for a site path. */
export const getCanonicalUrl = (path = '/') => {
    if (!path || path === '/') return `${siteConfig.url}/`;
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${siteConfig.url}${clean.replace(/\/+$/, '')}`;
};

/** Absolute URL for any site asset or page (passes through already-absolute URLs). */
export const absoluteUrl = (src) => (/^https?:\/\//i.test(src || '') ? src : `${siteConfig.url}${src?.startsWith('/') ? src : `/${src || ''}`}`);

export const defaultOgImages = [
    { url: siteConfig.ogImage, width: 1200, height: 630, alt: 'Crossbar Metro Arena, floodlit football turf beside Uttara Metro Center, Dhaka', type: 'image/png' }
];

const dedupe = (list) => Array.from(new Set(list.filter(Boolean).map(s => String(s).trim().toLowerCase())));

/**
 * Build page metadata. The root layout supplies the `%s | Crossbar Metro Arena` template,
 * so pass a short page title (<= 37 chars) or `absoluteTitle` for the home page.
 */
export function buildMetadata({
    title,
    absoluteTitle,
    description = siteConfig.description,
    path = '/',
    noIndex = false,
    keywords = [],
    images = defaultOgImages,
    type = 'website'
} = {}) {
    const canonical = getCanonicalUrl(path);
    const socialTitle = absoluteTitle || (title ? `${title} | ${siteConfig.name}` : siteConfig.defaultTitle);
    return {
        title: absoluteTitle ? { absolute: absoluteTitle } : title,
        description,
        keywords: dedupe([...siteConfig.keywords, ...keywords]),
        alternates: { canonical },
        openGraph: {
            title: socialTitle,
            description,
            url: canonical,
            siteName: siteConfig.name,
            locale: siteConfig.locale,
            type,
            images
        },
        twitter: {
            card: 'summary_large_image',
            title: socialTitle,
            description,
            images: images.map(i => (typeof i === 'string' ? i : i.url))
        },
        robots: noIndex
            ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
            : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }
    };
}

/* ------------------------------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------------------------- */

/** "01796-337133" -> "+8801796337133" (E.164 for schema.org telephone). */
export function toE164(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('880')) return `+${digits}`;
    if (digits.startsWith('0')) return `+88${digits}`;
    return `+880${digits}`;
}

/** Pull lat/lng out of a Google Maps URL ("!3d23.858!4d90.365", "?q=23.85,90.36" or "@23.85,90.36"). */
export function geoFromMapsUrl(url) {
    const raw = String(url || '');
    const pin = raw.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
    if (pin) return { latitude: Number(pin[1]), longitude: Number(pin[2]) };
    const m = raw.match(/(?:q=|@|ll=)(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/);
    if (!m) return DEFAULT_GEO;
    return { latitude: Number(m[1]), longitude: Number(m[2]) };
}

/** Escape "<" so the JSON-LD can never close its own <script> tag. */
export const serializeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

/** Parse the free-text tournament `dates` field ("12 Dec 2025", "12 - 14 Dec 2025", "2025-12-12") into ISO dates. */
export function parseDateRange(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const toIso = (d) => (d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null);
    const whole = toIso(new Date(raw));
    if (whole) return { start: whole, end: whole };
    const parts = raw.split(/\s*(?:–|—|to|-|&)\s*/i).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) return null;
    const last = parts[parts.length - 1];
    const yearMatch = last.match(/\b(20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : '';
    const monthMatch = last.match(/\b([A-Za-z]{3,9})\b/);
    const month = monthMatch ? monthMatch[1] : '';
    const first = parts[0];
    const firstFull = /\b20\d{2}\b/.test(first) ? first : /[A-Za-z]/.test(first) ? `${first} ${year}` : `${first} ${month} ${year}`;
    const start = toIso(new Date(firstFull));
    const end = toIso(new Date(last)) || start;
    return start ? { start, end } : null;
}

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** "6:30 AM – 12:30 AM Every Day" -> { opens: '06:30', closes: '00:30' } (a closing time before the opening time means "after midnight") */
function parseOpeningHours(text) {
    const fallback = { opens: '06:30', closes: '00:30' };
    const m = String(text || '').match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*(?:–|—|-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!m) return fallback;
    const to24 = (h, min, ap) => {
        let hour = Number(h);
        if (ap) {
            const p = ap.toUpperCase();
            if (p === 'PM' && hour < 12) hour += 12;
            if (p === 'AM' && hour === 12) hour = 0;
        }
        return `${String(hour).padStart(2, '0')}:${min || '00'}`;
    };
    const opens = to24(m[1], m[2], m[3]);
    let closes = to24(m[4], m[5], m[6]);
    if (closes === '00:00') closes = '24:00';
    return { opens, closes };
}

/* ------------------------------------------------------------------------------------------------
 * Entity ids shared across pages so Google can stitch the graph together
 * ---------------------------------------------------------------------------------------------- */
export const ids = {
    organization: `${siteConfig.url}/#organization`,
    website: `${siteConfig.url}/#website`,
    venue: `${siteConfig.url}/#venue`,
    logo: `${siteConfig.url}/#logo`
};

const logoObject = () => ({
    '@type': 'ImageObject',
    '@id': ids.logo,
    url: absoluteUrl(siteConfig.logo),
    contentUrl: absoluteUrl(siteConfig.logo),
    width: 1024,
    height: 1024,
    caption: siteConfig.name
});

const postalAddress = () => ({
    '@type': 'PostalAddress',
    streetAddress: 'Uttara Metro Center, Sector 17',
    addressLocality: 'Uttara, Dhaka',
    addressRegion: 'Dhaka',
    postalCode: '1230',
    addressCountry: 'BD'
});

/** Organization (publisher of the website and organizer of tournaments). */
export function organizationSchema(settings = VENUE_INFO) {
    const s = { ...VENUE_INFO, ...(settings || {}) };
    const tel = toE164(s.phoneFormatted || s.phone);
    return {
        '@type': 'Organization',
        '@id': ids.organization,
        name: s.businessName || siteConfig.name,
        legalName: siteConfig.legalName,
        alternateName: [siteConfig.shortName, siteConfig.domain],
        url: `${siteConfig.url}/`,
        logo: logoObject(),
        image: absoluteUrl(siteConfig.ogImage),
        email: s.email || undefined,
        telephone: tel || undefined,
        sameAs: [s.facebookUrl || s.facebook, s.instagramUrl].filter(Boolean),
        contactPoint: tel ? [{
            '@type': 'ContactPoint',
            telephone: tel,
            contactType: 'reservations',
            areaServed: 'BD',
            availableLanguage: ['en', 'bn']
        }] : undefined,
        address: postalAddress()
    };
}

/** WebSite entity. */
export function websiteSchema() {
    return {
        '@type': 'WebSite',
        '@id': ids.website,
        url: `${siteConfig.url}/`,
        name: siteConfig.name,
        alternateName: siteConfig.domain,
        description: siteConfig.description,
        inLanguage: siteConfig.language,
        publisher: { '@id': ids.organization }
    };
}

/** JSON-LD for the venue (SportsActivityLocation + LocalBusiness). Accepts the DB site settings, falls back to VENUE_INFO. */
export function venueSchema(settings = VENUE_INFO, slotPrices = SCHEDULE_SLOTS_DEFINITION) {
    const s = { ...VENUE_INFO, ...(settings || {}) };
    const tel = toE164(s.phoneFormatted || s.phone);
    const geo = geoFromMapsUrl(s.googleMapsUrl);
    const hours = parseOpeningHours(s.openingHours);
    const prices = (Array.isArray(slotPrices) && slotPrices.length ? slotPrices : SCHEDULE_SLOTS_DEFINITION);
    const weekday = prices.map(p => Number(p.weekdayPrice)).filter(Number.isFinite);
    const weekend = prices.map(p => Number(p.weekendPrice)).filter(Number.isFinite);
    const minPrice = Math.min(...weekday, ...weekend);
    const maxPrice = Math.max(...weekday, ...weekend);
    const court = COURTS[0] || {};
    const offer = (name, list) => ({
        '@type': 'Offer',
        name,
        url: `${siteConfig.url}/booking`,
        availability: 'https://schema.org/InStock',
        priceCurrency: siteConfig.priceCurrency,
        priceSpecification: {
            '@type': 'PriceSpecification',
            priceCurrency: siteConfig.priceCurrency,
            minPrice: list.length ? Math.min(...list) : undefined,
            maxPrice: list.length ? Math.max(...list) : undefined
        }
    });

    return {
        '@type': ['SportsActivityLocation', 'LocalBusiness'],
        '@id': ids.venue,
        name: s.businessName || siteConfig.name,
        alternateName: [siteConfig.shortName, siteConfig.domain],
        slogan: s.tagline || siteConfig.tagline,
        url: `${siteConfig.url}/`,
        logo: { '@id': ids.logo },
        image: [absoluteUrl(siteConfig.ogImage), absoluteUrl(siteConfig.logo)],
        description: s.aboutText || siteConfig.description,
        telephone: tel || undefined,
        email: s.email || undefined,
        priceRange: Number.isFinite(minPrice) && Number.isFinite(maxPrice) ? `BDT ${minPrice} - ${maxPrice} per 90 minutes` : undefined,
        currenciesAccepted: siteConfig.priceCurrency,
        paymentAccepted: siteConfig.paymentAccepted,
        address: postalAddress(),
        geo: { '@type': 'GeoCoordinates', latitude: geo.latitude, longitude: geo.longitude },
        hasMap: s.googleMapsUrl || undefined,
        openingHoursSpecification: [{
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: WEEK,
            opens: hours.opens,
            closes: hours.closes
        }],
        amenityFeature: [
            ...(court.features || []).map(name => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
            { '@type': 'LocationFeatureSpecification', name: 'Free guarded parking', value: true },
            { '@type': 'LocationFeatureSpecification', name: 'Changing rooms and restrooms', value: true },
            { '@type': 'LocationFeatureSpecification', name: `2 minute walk from ${s.metroStation || VENUE_INFO.metroStation}`, value: true }
        ],
        sport: 'Football',
        publicAccess: true,
        isAccessibleForFree: false,
        areaServed: [
            { '@type': 'City', name: 'Dhaka' },
            { '@type': 'Place', name: 'Uttara' },
            { '@type': 'Country', name: 'Bangladesh' }
        ],
        sameAs: [s.facebookUrl || s.facebook, s.instagramUrl].filter(Boolean),
        parentOrganization: { '@id': ids.organization },
        makesOffer: [
            offer('Weekday 90-minute football turf slot (Sun - Thu)', weekday),
            offer('Weekend 90-minute football turf slot (Fri - Sat)', weekend)
        ],
        potentialAction: {
            '@type': 'ReserveAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteConfig.url}/booking`,
                inLanguage: siteConfig.language,
                actionPlatform: [
                    'https://schema.org/DesktopWebPlatform',
                    'https://schema.org/MobileWebPlatform',
                    'https://schema.org/AndroidPlatform',
                    'https://schema.org/IOSPlatform'
                ]
            },
            result: { '@type': 'Reservation', name: '90-minute football turf slot' }
        }
    };
}

/** Site-wide graph rendered once in the root layout. */
export function siteGraphSchema(settings = VENUE_INFO, slotPrices) {
    return {
        '@context': 'https://schema.org',
        '@graph': [organizationSchema(settings), websiteSchema(), venueSchema(settings, slotPrices)]
    };
}

/** BreadcrumbList. `items` are [{ name, path }] without the Home entry (added automatically). */
export function breadcrumbSchema(items = []) {
    const all = [{ name: 'Home', path: '/' }, ...items];
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: all.map((it, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: it.name,
            item: getCanonicalUrl(it.path)
        }))
    };
}

/** WebPage entity linked to the site graph. */
export function webPageSchema({ path = '/', title, description = siteConfig.description, type = 'WebPage', breadcrumbs = [] } = {}) {
    const url = getCanonicalUrl(path);
    return {
        '@context': 'https://schema.org',
        '@type': type,
        '@id': `${url}#webpage`,
        url,
        name: title ? `${title} | ${siteConfig.name}` : siteConfig.defaultTitle,
        description,
        inLanguage: siteConfig.language,
        isPartOf: { '@id': ids.website },
        about: { '@id': ids.venue },
        primaryImageOfPage: { '@type': 'ImageObject', url: absoluteUrl(siteConfig.ogImage), width: 1200, height: 630 },
        breadcrumb: breadcrumbs.length ? breadcrumbSchema(breadcrumbs) : undefined,
        potentialAction: { '@type': 'ReadAction', target: [url] }
    };
}

/** FAQPage. `items` are [{ q, a }] and MUST also be visible on the page (see <ArenaFaq />). */
export function faqSchema(items = []) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a }
        }))
    };
}

/** SportsEvent for one tournament document. Returns null when the dates cannot be parsed. */
export function eventSchema(t) {
    if (!t || !t.title) return null;
    const range = parseDateRange(t.dates) || parseDateRange(t.registrationDeadline);
    if (!range) return null;
    const status = String(t.status || 'open').toLowerCase();
    const soldOut = status === 'full' || (Number(t.maxTeams) > 0 && Number(t.registeredCount) >= Number(t.maxTeams));
    const cancelled = status === 'cancelled';
    const completed = status === 'completed' || status === 'closed';
    const deadline = parseDateRange(t.registrationDeadline)?.start;
    const description = [t.edition, t.category, t.format, ...(t.highlights || [])].filter(Boolean).join(' · ')
        || `${t.title} football tournament at Crossbar Metro Arena, Uttara, Dhaka.`;
    return {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        '@id': `${siteConfig.url}/events#${t.id || encodeURIComponent(t.title)}`,
        name: t.title,
        description,
        sport: 'Football',
        image: t.bannerUrl ? [absoluteUrl(t.bannerUrl)] : [absoluteUrl(siteConfig.ogImage)],
        url: `${siteConfig.url}/events`,
        startDate: range.start,
        endDate: range.end || range.start,
        eventStatus: cancelled ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@id': ids.venue },
        organizer: { '@id': ids.organization },
        performer: { '@type': 'SportsTeam', name: 'Registered amateur football teams' },
        maximumAttendeeCapacity: Number(t.maxTeams) > 0 ? Number(t.maxTeams) : undefined,
        offers: {
            '@type': 'Offer',
            name: `Team entry fee - ${t.title}`,
            price: Number(t.entryFee) || 0,
            priceCurrency: siteConfig.priceCurrency,
            url: `${siteConfig.url}/events`,
            validThrough: deadline || undefined,
            availability: completed || soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock'
        }
    };
}

/** Product entity for one shop item. */
export function productSchema(p) {
    if (!p || !p.name) return null;
    const price = Number.isFinite(Number(p.salePrice)) && Number(p.salePrice) > 0 ? Number(p.salePrice) : Number(p.price) || 0;
    const inStock = p.inStock !== false && (p.stock === undefined || Number(p.stock) > 0);
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${siteConfig.url}/shop#${p.id || encodeURIComponent(p.name)}`,
        name: p.name,
        description: p.description || `${p.name} available at the Crossbar Metro Arena shop, Uttara, Dhaka.`,
        image: p.image ? [absoluteUrl(p.image)] : undefined,
        sku: String(p.id || ''),
        category: p.category || 'Football gear',
        brand: { '@type': 'Brand', name: siteConfig.name },
        offers: {
            '@type': 'Offer',
            url: `${siteConfig.url}/shop`,
            price,
            priceCurrency: siteConfig.priceCurrency,
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@id': ids.organization },
            availableDeliveryMethod: 'https://schema.org/OnSitePickup'
        }
    };
}

/** ItemList wrapper (used for event and product listings). */
export function itemListSchema(name, items = [], path = '/') {
    const list = items.filter(Boolean);
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': `${getCanonicalUrl(path)}#list`,
        name,
        numberOfItems: list.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: list.map((item, i) => {
            const { '@context': _ctx, ...rest } = item;
            return { '@type': 'ListItem', position: i + 1, item: rest };
        })
    };
}

/** ImageGallery for the photo gallery page. */
export function imageGallerySchema(photos = [], path = '/gallery') {
    const list = photos.filter(p => p && p.url);
    return {
        '@context': 'https://schema.org',
        '@type': 'ImageGallery',
        '@id': `${getCanonicalUrl(path)}#gallery`,
        url: getCanonicalUrl(path),
        name: `${siteConfig.name} photo gallery`,
        description: 'Photos from matches, tournaments and the floodlit turf at Crossbar Metro Arena, Uttara, Dhaka.',
        isPartOf: { '@id': ids.website },
        about: { '@id': ids.venue },
        numberOfItems: list.length,
        image: list.map(p => ({
            '@type': 'ImageObject',
            contentUrl: absoluteUrl(p.url),
            url: absoluteUrl(p.url),
            name: p.title || siteConfig.name,
            caption: p.caption || p.title || undefined,
            keywords: Array.isArray(p.tags) && p.tags.length ? p.tags.join(', ') : undefined,
            datePublished: p.uploadedAt || undefined,
            creditText: p.photographer || undefined,
            copyrightHolder: { '@id': ids.organization },
            representativeOfPage: Boolean(p.featured)
        }))
    };
}

/** Service entity for the online slot-booking product. */
export function bookingServiceSchema(slotPrices = SCHEDULE_SLOTS_DEFINITION, advance = 500) {
    const prices = Array.isArray(slotPrices) && slotPrices.length ? slotPrices : SCHEDULE_SLOTS_DEFINITION;
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${siteConfig.url}/booking#service`,
        name: '90-minute football turf slot booking',
        serviceType: 'Sports facility rental',
        description: `Online booking for 12 fixed 90-minute floodlit football turf slots per day at Crossbar Metro Arena, Uttara, Dhaka. Pay a BDT ${advance} advance or the full amount with bKash, Nagad or card.`,
        provider: { '@id': ids.venue },
        areaServed: { '@type': 'City', name: 'Dhaka' },
        url: `${siteConfig.url}/booking`,
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Daily slot rate card',
            itemListElement: prices.map(s => ({
                '@type': 'Offer',
                name: `Slot ${s.slotNumber}: ${s.displayTime}`,
                category: s.period,
                priceCurrency: siteConfig.priceCurrency,
                priceSpecification: [
                    { '@type': 'UnitPriceSpecification', name: 'Weekday (Sun - Thu)', price: s.weekdayPrice, priceCurrency: siteConfig.priceCurrency, unitText: '90 minutes' },
                    { '@type': 'UnitPriceSpecification', name: 'Weekend (Fri - Sat)', price: s.weekendPrice, priceCurrency: siteConfig.priceCurrency, unitText: '90 minutes' }
                ],
                availability: 'https://schema.org/InStock',
                url: `${siteConfig.url}/booking`
            }))
        }
    };
}
