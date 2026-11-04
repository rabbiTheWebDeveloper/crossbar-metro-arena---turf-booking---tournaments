/**
 * Server-only helpers that read public catalogue data for structured data (JSON-LD) and the sitemap.
 * Every helper swallows errors and returns an empty result, so pages still render (and still build)
 * when MongoDB is unreachable or MONGODB_CONNECTION_STRING is not set.
 */
import { connectToDatabase } from './mongodb';
import { Tournament } from '../models/Tournament';
import { Product } from '../models/Product';
import { GalleryPhoto } from '../models/GalleryPhoto';
import { Setting } from '../models/Setting';

const plain = (doc) => {
    if (!doc) return null;
    const { _id, __v, ...rest } = doc;
    return { id: _id ? String(_id) : undefined, ...rest };
};

const quiet = async (label, fn, fallback) => {
    try {
        await connectToDatabase();
        return await fn();
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.warn(`[seoData] ${label} skipped: ${err?.message || err}`);
        return fallback;
    }
};

/** Site settings + slot prices saved by the admin (null -> callers fall back to VENUE_INFO). */
export const fetchSiteSettings = () => quiet('settings', async () => {
    const doc = await Setting.findOne().lean();
    return doc ? plain(doc) : null;
}, null);

/** Tournaments that should be visible to the public (newest first). */
export const fetchPublicTournaments = (limit = 20) => quiet('tournaments', async () => {
    const docs = await Tournament.find({ status: { $nin: ['archived', 'draft', 'hidden'] } }).sort({ createdAt: -1 }).limit(limit).lean();
    return docs.map(plain);
}, []);

/** Visible shop products (featured first). */
export const fetchPublicProducts = (limit = 48) => quiet('products', async () => {
    const docs = await Product.find({ visible: { $ne: false } }).sort({ featured: -1, createdAt: -1 }).limit(limit).lean();
    return docs.map(plain);
}, []);

/** Gallery photos (featured first, then newest). */
export const fetchGalleryPhotos = (limit = 40) => quiet('gallery', async () => {
    const docs = await GalleryPhoto.find().sort({ featured: -1, createdAt: -1 }).limit(limit).lean();
    return docs.map(plain);
}, []);

/** Latest updatedAt per collection, used for sitemap <lastmod>. */
export const fetchLastModified = () => quiet('lastModified', async () => {
    const latest = async (Model) => {
        const doc = await Model.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
        return doc?.updatedAt ? new Date(doc.updatedAt) : null;
    };
    const [events, products, gallery] = await Promise.all([latest(Tournament), latest(Product), latest(GalleryPhoto)]);
    return { events, products, gallery };
}, { events: null, products: null, gallery: null });
