import { getCanonicalUrl } from '../lib/seo';
import { fetchLastModified } from '../lib/seoData';

// Re-generate at most once an hour so <lastmod> follows real content changes without hammering the DB.
export const revalidate = 3600;

/** Bump this when evergreen copy (about, venue, squad builder) changes. */
const EVERGREEN_UPDATED = new Date('2026-11-04T00:00:00Z');

export default async function sitemap() {
    const now = new Date();
    const mod = await fetchLastModified();
    const latest = (...dates) => dates.filter(Boolean).sort((a, b) => b - a)[0] || EVERGREEN_UPDATED;

    const routes = [
        { path: '/', lastModified: now, priority: 1, changeFrequency: 'daily' },
        { path: '/booking', lastModified: now, priority: 0.9, changeFrequency: 'hourly' },
        { path: '/events', lastModified: latest(mod.events), priority: 0.8, changeFrequency: 'weekly' },
        { path: '/results', lastModified: now, priority: 0.8, changeFrequency: 'daily' },
        { path: '/matches', lastModified: now, priority: 0.7, changeFrequency: 'daily' },
        { path: '/shop', lastModified: latest(mod.products), priority: 0.6, changeFrequency: 'weekly' },
        { path: '/gallery', lastModified: latest(mod.gallery), priority: 0.5, changeFrequency: 'weekly' },
        { path: '/about', lastModified: EVERGREEN_UPDATED, priority: 0.7, changeFrequency: 'monthly' },
        { path: '/venue', lastModified: EVERGREEN_UPDATED, priority: 0.6, changeFrequency: 'monthly' },
        { path: '/squad-builder', lastModified: EVERGREEN_UPDATED, priority: 0.4, changeFrequency: 'monthly' }
    ];

    return routes.map(r => ({
        url: getCanonicalUrl(r.path),
        lastModified: r.lastModified,
        changeFrequency: r.changeFrequency,
        priority: r.priority
    }));
}
