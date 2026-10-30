import './globals.css';
import { Plus_Jakarta_Sans, Montserrat, Teko } from 'next/font/google';
import { ArenaProvider } from '../context/ArenaContext';
import { GlobalModals } from '../components/GlobalModals';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';
import { siteConfig, defaultOgImages, venueSchema } from '../lib/seo';

// Self-hosted Google fonts (no render-blocking <link> to fonts.googleapis.com).
// globals.css maps --font-sans / --font-display / --font-sport onto these variables.
const fontSans = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-sans-next' });
const fontDisplay = Montserrat({ subsets: ['latin'], weight: ['600', '700', '800', '900'], display: 'swap', variable: '--font-display-next' });
const fontSport = Teko({ subsets: ['latin'], weight: ['500', '600', '700'], display: 'swap', variable: '--font-sport-next' });

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://bookcrossbar.com'),
    title: {
        default: 'Crossbar Metro Arena | Floodlit Football Turf beside Uttara Metro, Dhaka',
        template: '%s | Crossbar Metro Arena'
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    applicationName: siteConfig.name,
    manifest: '/manifest.webmanifest',
    alternates: { canonical: '/' },
    openGraph: {
        title: 'Crossbar Metro Arena | Floodlit Football Turf beside Uttara Metro, Dhaka',
        description: siteConfig.description,
        type: 'website',
        locale: siteConfig.locale,
        siteName: siteConfig.name,
        url: '/',
        images: defaultOgImages
    },
    icons: {
        icon: siteConfig.logo,
        apple: siteConfig.logo,
        shortcut: siteConfig.logo
    },
    twitter: {
        card: 'summary',
        title: 'Crossbar Metro Arena | Floodlit Football Turf beside Uttara Metro, Dhaka',
        description: siteConfig.description,
        images: [siteConfig.logo]
    },
    appleWebApp: {
        capable: true,
        title: siteConfig.shortName,
        statusBarStyle: 'black-translucent'
    },
    formatDetection: { telephone: true, email: true, address: false },
    robots: { index: true, follow: true }
};

export const viewport = {
    themeColor: siteConfig.themeColor,
    width: 'device-width',
    initialScale: 1,
    colorScheme: 'dark'
};

export default function RootLayout({ children }) {
    const jsonLd = JSON.stringify(venueSchema()).replace(/</g, '\\u003c');
    return (<html lang="en" className={`dark scroll-smooth ${fontSans.variable} ${fontDisplay.variable} ${fontSport.variable}`}>
      <body className="bg-[#070b0e] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black min-h-screen flex flex-col font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }}/>
        <ArenaProvider>
          {children}
          <GlobalModals />
          <FloatingWhatsApp />
        </ArenaProvider>
      </body>
    </html>);
}
