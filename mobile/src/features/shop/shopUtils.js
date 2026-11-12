/**
 * Shop helpers shared by the shop tab, the product sheet and the cart.
 * Prices and stock always come from the server; these only mirror its rules for display.
 */
import { cleanPhone } from '@/lib/phone';
import { BD_PHONE_REGEX } from '@/lib/dateUtils';

export const SHOP_CATEGORIES = [
    { id: 'all', label: 'All Match Gear' },
    { id: 'accessories', label: 'Grip Socks & Guards' },
    { id: 'balls', label: 'FIFA Balls' },
    { id: 'apparel', label: 'Arena Jerseys' },
    { id: 'footwear', label: 'Turf Boots (TF/AG)' },
    { id: 'drinks', label: 'Hydration & Drinks' }
];

/** Most units of one product a single order line may hold (server rule). */
export const MAX_LINE_QTY = 10;

export const stockOf = (p) => Math.max(0, Number(p?.stock ?? 0) || 0);

/** A product can be reserved when it is listed and has stock. */
export const canReserve = (p) => !!p && p.visible !== false && stockOf(p) > 0;

/** Largest quantity selectable for a product (1..10, capped by stock). */
export const maxQty = (p) => Math.max(1, Math.min(MAX_LINE_QTY, stockOf(p)));

/** { price, sale, hasSale, unit }: `unit` is what the counter charges (same rule as the API). */
export function priceInfo(p) {
    const price = Number(p?.price) || 0;
    const sale = Number(p?.salePrice) || 0;
    const hasSale = sale > 0 && sale < price;
    return { price, sale, hasSale, unit: hasSale ? sale : price };
}

export const unitPriceOf = (p) => priceInfo(p).unit;

/** WhatsApp deep link to the arena desk with a prefilled message ('' when no number is configured). */
export function whatsappLink(siteSettings, text) {
    const base = String(siteSettings?.whatsappUrl || '').split('?')[0];
    if (!base) return '';
    return `${base}?text=${encodeURIComponent(text)}`;
}

/**
 * Validates the pickup contact (same rules and copy as the website).
 * Returns { name, phone, error } where `error` is '' when both are valid.
 */
export function validatePickupCustomer(customerName, customerPhone) {
    const name = String(customerName || '').trim();
    const phone = cleanPhone(customerPhone);
    if (!name) return { name, phone, error: 'Please enter your name for the pickup.' };
    if (!BD_PHONE_REGEX.test(phone)) return { name, phone, error: 'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).' };
    return { name, phone, error: '' };
}

/** Total of a saved reservation (falls back to summing its line items). */
export function reservationTotal(reservation) {
    if (!reservation) return 0;
    const fromItems = (reservation.items || []).reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
    return Number(reservation.totalAmount ?? reservation.price ?? fromItems) || 0;
}
