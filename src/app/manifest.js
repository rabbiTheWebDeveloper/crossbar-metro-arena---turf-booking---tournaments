import { siteConfig } from '../lib/seo';

export default function manifest() {
    return {
        name: siteConfig.name,
        short_name: siteConfig.shortName,
        description: siteConfig.description,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: siteConfig.backgroundColor,
        theme_color: siteConfig.themeColor,
        lang: 'en',
        categories: ['sports', 'lifestyle'],
        icons: [
            { src: '/brand/crossbar-metro-arena-logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/brand/crossbar-metro-arena-logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/brand/crossbar-metro-arena-logo.png', sizes: '1024x1024', type: 'image/png', purpose: 'any maskable' }
        ],
        shortcuts: [
            { name: 'Book a slot', url: '/booking', description: 'Book a 90-minute turf slot' },
            { name: 'Match results', url: '/results', description: 'Scores and standings' }
        ]
    };
}
