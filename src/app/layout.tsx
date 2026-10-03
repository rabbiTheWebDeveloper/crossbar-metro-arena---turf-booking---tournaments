import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ArenaProvider } from '../context/ArenaContext';
import { GlobalModals } from '../components/GlobalModals';

export const metadata: Metadata = {
  title: 'Crossbar Metro Arena | Premium Outdoor Turf & Tournaments | Uttara, Dhaka',
  description: 'Book your football slot and register tournaments at Crossbar Metro Arena. Premium outdoor turf right next to Uttara Metro Center, Sector 17, Dhaka.',
  keywords: ['crossbar metro arena', 'dhaka turf booking', 'football turf uttara', 'uttara metro center', 'turf tournament bangladesh', '7v7 football turf'],
  authors: [{ name: 'Crossbar Metro Arena' }],
  openGraph: {
    title: 'Crossbar Metro Arena | Premium Outdoor Turf & Tournaments',
    description: 'Foundations going down, game day coming up! Premium outdoor turf for football & sports events at Uttara Metro Center, Dhaka.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Crossbar Metro Arena',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crossbar Metro Arena | Premium Outdoor Turf & Tournaments',
    description: 'Book your football slot and register tournaments at Crossbar Metro Arena. Next to Uttara Metro Center.',
  },
};

export const viewport: Viewport = {
  themeColor: '#070b0e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Space+Grotesk:wght@500;700;800&family=Teko:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#070b0e] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black min-h-screen flex flex-col font-sans">
        <ArenaProvider>
          {children}
          <GlobalModals />
        </ArenaProvider>
      </body>
    </html>
  );
}
