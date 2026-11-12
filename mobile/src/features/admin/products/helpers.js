import { HTTP_URL_RE } from '../content/ImageUrlField';

export const CATEGORIES = [
    { value: 'accessories', label: 'Accessories' },
    { value: 'footwear', label: 'Footwear / Turf Shoes' },
    { value: 'balls', label: 'Match Balls' },
    { value: 'apparel', label: 'Jerseys & Apparel' },
    { value: 'drinks', label: 'Hydration & Drinks' },
    { value: 'equipment', label: 'Equipment' }
];

/** Same placeholder the server assigns to products saved without an image. */
export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80';

export const parseSizes = (s) => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const text = (v) => (v === null || v === undefined ? '' : String(v));

export const emptyProductForm = () => ({ name: '', category: 'accessories', price: '', salePrice: '', stock: '', badge: '', description: '', sizes: '', featured: false, visible: true, image: '' });

export const productToForm = (p) => ({
    name: p.name || '',
    category: p.category || 'accessories',
    price: text(p.price),
    salePrice: text(p.salePrice),
    stock: text(p.stock),
    badge: p.badge || '',
    description: p.description || '',
    sizes: (p.sizes || []).join(', '),
    featured: !!p.featured,
    visible: p.visible !== false,
    image: p.image || ''
});

export const filterProducts = (products, filter) => {
    if (filter === 'hidden') return products.filter(p => p.visible === false);
    if (filter === 'out') return products.filter(p => Number(p.stock) <= 0);
    if (filter === 'featured') return products.filter(p => p.featured);
    return products;
};

/**
 * Validates the form exactly like the website and builds the API payload.
 * Editing sends only the fields that changed. Returns { error }, { unchanged: true } or { payload }.
 */
export function buildProductPayload(form, editing) {
    const name = form.name.trim();
    const priceText = text(form.price).trim();
    const stockText = text(form.stock).trim();
    const saleText = text(form.salePrice).trim();
    const image = form.image.trim();
    const badge = form.badge.trim();
    const description = form.description.trim();
    const price = Number(priceText);
    const stock = stockText === '' ? 0 : Number(stockText);
    const salePrice = saleText === '' ? null : Number(saleText);

    if (!name) return { error: 'Product name is required.' };
    if (priceText === '' || Number.isNaN(price) || price < 0) return { error: 'Price must be ৳0 or more.' };
    if (Number.isNaN(stock) || stock < 0) return { error: 'Stock must be 0 or more.' };
    if (salePrice !== null && (Number.isNaN(salePrice) || salePrice < 0)) return { error: 'Sale price must be ৳0 or more.' };
    if (salePrice !== null && salePrice > price) return { error: 'Sale price cannot be higher than the regular price.' };
    if (image && !HTTP_URL_RE.test(image)) return { error: 'Image must be an http(s) URL.' };
    const sizes = parseSizes(form.sizes);

    if (editing) {
        const payload = { id: editing.id };
        if (name !== editing.name) payload.name = name;
        if (form.category !== editing.category) payload.category = form.category;
        if (price !== Number(editing.price)) payload.price = price;
        const prevSale = editing.salePrice ?? null;
        if ((salePrice ?? price) !== (prevSale ?? Number(editing.price))) payload.salePrice = salePrice ?? price;
        if (stock !== Number(editing.stock)) payload.stock = stock;
        if (!sameList(sizes, editing.sizes || [])) payload.sizes = sizes;
        if (badge !== (editing.badge || '')) payload.badge = badge;
        if (description !== (editing.description || '')) payload.description = description;
        if (image && image !== editing.image) payload.image = image;
        if (form.featured !== !!editing.featured) payload.featured = form.featured;
        if (form.visible !== (editing.visible !== false)) payload.visible = form.visible;
        if (Object.keys(payload).length === 1) return { unchanged: true };
        return { payload };
    }

    const payload = { name, category: form.category, price, stock, sizes, badge, description, featured: form.featured, image: image || undefined };
    if (salePrice !== null) payload.salePrice = salePrice;
    // The server defaults new products to visible; only send the flag when the admin switched it off
    if (!form.visible) payload.visible = false;
    return { payload };
}
