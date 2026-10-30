import { getCanonicalUrl } from '../lib/seo';

const PUBLIC_ROUTES = [
    { path: '/', priority: 1, changeFrequency: 'daily' },
    { path: '/booking', priority: 0.9, changeFrequency: 'hourly' },
    { path: '/events', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/results', priority: 0.8, changeFrequency: 'daily' },
    { path: '/matches', priority: 0.7, changeFrequency: 'daily' },
    { path: '/shop', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/gallery', priority: 0.5, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/venue', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/squad-builder', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/login', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/register', priority: 0.3, changeFrequency: 'yearly' }
];

export default function sitemap() {
    const lastModified = new Date();
    return PUBLIC_ROUTES.map(r => ({
        url: getCanonicalUrl(r.path),
        lastModified,
        changeFrequency: r.changeFrequency,
        priority: r.priority
    }));
}
