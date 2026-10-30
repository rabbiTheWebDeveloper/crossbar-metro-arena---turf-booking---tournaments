import { siteConfig } from '../lib/seo';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/admin/', '/investor', '/investor/', '/player', '/player/', '/api', '/api/']
            }
        ],
        sitemap: `${siteConfig.url}/sitemap.xml`,
        host: siteConfig.url
    };
}
