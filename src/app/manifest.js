import { siteConfig } from '../lib/seo';

export default function manifest() {
    return {
        id: '/',
        name: siteConfig.name,
        short_name: siteConfig.shortName,
        description: siteConfig.description,
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: siteConfig.backgroundColor,
        theme_color: siteConfig.themeColor,
        lang: 'en',
        dir: 'ltr',
        categories: ['sports', 'lifestyle', 'entertainment'],
        icons: [
            { src: '/brand/logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/brand/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/brand/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        screenshots: [
            { src: '/opengraph-image', sizes: '1200x630', type: 'image/png', form_factor: 'wide', label: 'Crossbar Metro Arena, floodlit football turf in Uttara, Dhaka' }
        ],
        shortcuts: [
            { name: 'Book a slot', url: '/booking', description: 'Book a 90-minute turf slot' },
            { name: 'Tournaments', url: '/events', description: 'Open cups and registration' },
            { name: 'Match results', url: '/results', description: 'Scores and standings' }
        ]
    };
}
