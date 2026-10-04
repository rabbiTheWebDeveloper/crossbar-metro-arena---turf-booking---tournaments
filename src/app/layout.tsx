import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ArenaProvider } from '../context/ArenaContext';
import { GlobalModals } from '../components/GlobalModals';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';

export const metadata: Metadata = {
  title: 'Crossbar Metro Arena | Dhaka’s Premier Floodlit Outdoor Turf | bookcrossbar.com',
  description: 'Book your football slot and register tournaments at Crossbar Metro Arena. 12 daily 90-minute slots, 60-day calendar, ৳500 advance, and live investor profit share at Uttara Metro Center, Dhaka.',
  keywords: ['crossbar metro arena', 'bookcrossbar.com', 'dhaka turf booking', 'football turf uttara', 'uttara metro center', 'turf tournament bangladesh', '7v7 football turf'],
  authors: [{ name: 'Crossbar Metro Arena' }],
  openGraph: {
    title: 'Crossbar Metro Arena | Dhaka’s Premier Floodlit Outdoor Turf',
    description: '12 daily 90-minute slots, pay online with bKash/Nagad/Card (৳500 advance or full). Live investor profit share at bookcrossbar.com.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Crossbar Metro Arena',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crossbar Metro Arena | Dhaka’s Premier Floodlit Outdoor Turf',
    description: '12 daily 90-minute slots, pay online with bKash/Nagad/Card. Next to Uttara Metro Center.',
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
          <FloatingWhatsApp />
        </ArenaProvider>
      </body>
    </html>
  );
}
