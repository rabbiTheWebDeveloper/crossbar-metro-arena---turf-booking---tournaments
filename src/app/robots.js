import { siteConfig } from '../lib/seo';

/**
 * /robots.txt
 * Private portals and APIs are disallowed. Auth pages are crawlable but carry noindex (so Google
 * can see the directive), which is the recommended way to keep them out of the index.
 */
const PRIVATE = ['/admin', '/admin/', '/investor', '/investor/', '/player', '/player/', '/api/', '/logout', '/_next/'];

export default function robots() {
    return {
        rules: [
            { userAgent: '*', allow: ['/', '/opengraph-image', '/brand/'], disallow: PRIVATE },
            // Google's image bot may index the brand and gallery imagery
            { userAgent: 'Googlebot-Image', allow: ['/brand/', '/opengraph-image'], disallow: PRIVATE }
        ],
        sitemap: `${siteConfig.url}/sitemap.xml`,
        host: siteConfig.url
    };
}
