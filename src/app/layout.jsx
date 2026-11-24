import './globals.css';
import Script from 'next/script';
import { Plus_Jakarta_Sans, Montserrat, Teko } from 'next/font/google';
import { ArenaProvider } from '../context/ArenaContext';
import { GlobalModals } from '../components/GlobalModals';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';
import { JsonLd } from '../components/JsonLd';
import { siteConfig, defaultOgImages, siteGraphSchema, geoFromMapsUrl } from '../lib/seo';
import { VENUE_INFO } from '../data/initialData';

// Self-hosted Google fonts (no render-blocking <link> to fonts.googleapis.com).
// globals.css maps --font-sans / --font-display / --font-sport onto these variables.
const fontSans = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-sans-next' });
const fontDisplay = Montserrat({ subsets: ['latin'], weight: ['600', '700', '800', '900'], display: 'swap', variable: '--font-display-next' });
const fontSport = Teko({ subsets: ['latin'], weight: ['500', '600', '700'], display: 'swap', variable: '--font-sport-next' });

const geo = geoFromMapsUrl(VENUE_INFO.googleMapsUrl);

export const metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
        default: siteConfig.defaultTitle,
        template: `%s | ${siteConfig.name}`
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    applicationName: siteConfig.name,
    generator: 'Next.js',
    category: 'sports',
    classification: 'Football turf booking, sports venue, tournaments',
    referrer: 'strict-origin-when-cross-origin',
    manifest: '/manifest.webmanifest',
    alternates: { canonical: '/' },
    openGraph: {
        title: siteConfig.defaultTitle,
        description: siteConfig.description,
        type: 'website',
        locale: siteConfig.locale,
        siteName: siteConfig.name,
        url: '/',
        images: defaultOgImages,
        countryName: 'Bangladesh',
        emails: [VENUE_INFO.email],
        phoneNumbers: [VENUE_INFO.phoneFormatted]
    },
    twitter: {
        card: 'summary_large_image',
        title: siteConfig.defaultTitle,
        description: siteConfig.description,
        images: [siteConfig.ogImage]
    },
    icons: {
        icon: [
            { url: '/brand/logo-192.png', sizes: '192x192', type: 'image/png' },
            { url: '/brand/logo-512.png', sizes: '512x512', type: 'image/png' }
        ],
        apple: [{ url: '/brand/logo-192.png', sizes: '192x192', type: 'image/png' }],
        shortcut: '/brand/logo-192.png'
    },
    appleWebApp: {
        capable: true,
        title: siteConfig.shortName,
        statusBarStyle: 'black-translucent'
    },
    formatDetection: { telephone: true, email: true, address: false },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 }
    },
    verification: {
        google: siteConfig.googleSiteVerification || undefined,
        other: siteConfig.bingSiteVerification ? { 'msvalidate.01': siteConfig.bingSiteVerification } : undefined
    },
    // Local SEO hints (geo tags are read by several directories and map crawlers)
    other: {
        'geo.region': siteConfig.region,
        'geo.placename': `${siteConfig.area}, ${siteConfig.city}`,
        'geo.position': `${geo.latitude};${geo.longitude}`,
        ICBM: `${geo.latitude}, ${geo.longitude}`,
        'format-detection': 'telephone=yes'
    }
};

export const viewport = {
    themeColor: siteConfig.themeColor,
    width: 'device-width',
    initialScale: 1,
    colorScheme: 'dark'
};

const GA_ID = siteConfig.gaMeasurementId;

export default function RootLayout({ children }) {
    return (<html lang="en" data-scroll-behavior="smooth" className={`dark scroll-smooth ${fontSans.variable} ${fontDisplay.variable} ${fontSport.variable}`}>
      <body className="bg-[#070b0e] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black min-h-screen flex flex-col font-sans">
        {/* Organization + WebSite + Venue (LocalBusiness) graph shared by every page */}
        <JsonLd id="site-graph" data={siteGraphSchema()}/>
        <ArenaProvider>
          {children}
          <GlobalModals />
          <FloatingWhatsApp />
        </ArenaProvider>
        {GA_ID && (<>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive"/>
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true, page_path: window.location.pathname });
            `}</Script>
          </>)}
      </body>
    </html>);
}
