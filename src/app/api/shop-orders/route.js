import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ShopReservation } from '@/models/ShopReservation';
import { Product } from '@/models/Product';
import { requireAdmin, optionalAuth, cleanPhone, isObjectId, rateLimit } from '@/lib/apiAuth';
import { generateBookingCode } from '@/lib/booking';

/** GET /api/shop-orders  (admin: all; signed-in customer: ?mine=1 own orders) */
export async function GET(request) {
    try {
        await connectToDatabase();
        const user = await optionalAuth(request);
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const mine = searchParams.get('mine') === '1';

        if (mine) {
            if (!user) return NextResponse.json({ success: true, count: 0, reservations: [] });
            const own = await ShopReservation.find({ customerPhone: cleanPhone(user.phone), ...(status ? { status } : {}) }).sort({ createdAt: -1 });
            return NextResponse.json({ success: true, count: own.length, reservations: own.map(r => r.toJSON()) });
        }
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin login required.' }, { status: user ? 403 : 401 });

        const query = {};
        if (status) query.status = status;
        const reservations = await ShopReservation.find(query).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, count: reservations.length, reservations: reservations.map(r => r.toJSON()) });
    } catch (err) {
        console.error('GET /api/shop-orders error:', err);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

/**
 * POST /api/shop-orders  (public: reserve for pickup)
 * Body: { customerName, customerPhone, items: [{ productId, quantity, size }], pickupDate?, notes? }
 * Prices always come from the Product collection; stock and visibility are checked.
 */
export async function POST(request) {
    try {
        const limited = rateLimit(request, 'shop-order', 15, 60 * 60 * 1000);
        if (limited) return limited;
        await connectToDatabase();
        const body = await request.json();
        const customerName = String(body.customerName || '').trim();
        const customerPhone = cleanPhone(body.customerPhone);
        const rawItems = Array.isArray(body.items) ? body.items : [];

        if (customerName.length < 2 || !/^01[3-9]\d{8}$/.test(customerPhone) || rawItems.length === 0) {
            return NextResponse.json({ error: 'Your name, a valid mobile number, and at least 1 item are required.' }, { status: 400 });
        }
        if (rawItems.length > 20) return NextResponse.json({ error: 'At most 20 line items per order.' }, { status: 400 });

        const items = [];
        for (const raw of rawItems) {
            const pid = raw.productId || raw.id;
            if (!isObjectId(pid)) return NextResponse.json({ error: `Unknown product in cart (${raw.name || pid}).` }, { status: 400 });
            const product = await Product.findById(pid);
            if (!product || product.visible === false) return NextResponse.json({ error: `${raw.name || 'An item'} is no longer available.` }, { status: 400 });
            const quantity = Math.max(1, Math.min(10, Number(raw.quantity) || 1));
            if ((product.stock ?? 0) < quantity) return NextResponse.json({ error: `Only ${product.stock || 0} left of ${product.name}.` }, { status: 409 });
            const unitPrice = Number(product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? product.salePrice : product.price);
            const size = raw.size ? String(raw.size).slice(0, 10) : '';
            if (Array.isArray(product.sizes) && product.sizes.length && size && !product.sizes.includes(size)) return NextResponse.json({ error: `Size ${size} is not available for ${product.name}.` }, { status: 400 });
            items.push({ productId: String(product._id), name: product.name, price: unitPrice, quantity, size, image: product.image || '' });
        }
        const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);

        const user = await optionalAuth(request);
        let reservation = null;
        for (let attempt = 0; attempt < 3 && !reservation; attempt++) {
            try {
                reservation = await ShopReservation.create({
                    reservationCode: generateBookingCode('ORD'),
                    customerName,
                    customerPhone,
                    userId: user ? String(user.userId || user.id) : undefined,
                    items,
                    totalAmount,
                    status: 'reserved_pickup',
                    pickupDate: /^\d{4}-\d{2}-\d{2}$/.test(body.pickupDate || '') ? body.pickupDate : new Date().toISOString().split('T')[0],
                    notes: String(body.notes || '').slice(0, 300)
                });
            } catch (e) {
                if (e && e.code === 11000) continue;
                throw e;
            }
        }
        if (!reservation) return NextResponse.json({ error: 'Could not allocate an order code, please retry.' }, { status: 500 });

        return NextResponse.json({ success: true, message: 'Shop order placed successfully', reservation: reservation.toJSON() }, { status: 201 });
    } catch (err) {
        console.error('POST /api/shop-orders error:', err);
        return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
    }
}
