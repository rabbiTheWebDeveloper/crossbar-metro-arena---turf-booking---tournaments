import { NextResponse } from 'next/server';
import { requireAdmin, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { PRODUCT_SCHEMA, PRODUCT_CATEGORIES } from '@/lib/schemas';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const featured = searchParams.get('featured');

        const query = {};
        if (category && category !== 'all') {
            if (!PRODUCT_CATEGORIES.includes(category)) return badRequest('Unknown product category.');
            query.category = category;
        }
        if (featured === 'true') query.featured = true;

        const products = await Product.find(query).sort({ featured: -1, createdAt: -1 });
        return NextResponse.json({
            success: true,
            count: products.length,
            products: products.map(p => p.toJSON())
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/products');
    }
}

/** POST creates a product, or updates it when the body carries an existing id (used by the admin editor). */
export async function POST(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const targetId = body.id || body._id;
        if (targetId && !isObjectId(targetId)) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        await connectToDatabase();
        const existing = targetId ? await Product.findById(targetId) : null;
        if (targetId && !existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const { data, error } = validate(body, PRODUCT_SCHEMA, { partial: Boolean(existing) });
        if (error) return badRequest(error);

        const price = data.price ?? existing?.price;
        if (data.salePrice !== undefined && data.salePrice > price) return badRequest('Sale price cannot be higher than the regular price.');

        if (existing) {
            existing.set(data);
            if (data.stock !== undefined) existing.inStock = existing.stock > 0;
            await existing.save();
            return NextResponse.json({ success: true, message: 'Product updated successfully', product: existing.toJSON() });
        }

        const product = new Product({
            ...data,
            salePrice: data.salePrice ?? data.price,
            inStock: data.stock > 0,
            featured: data.featured ?? false,
            visible: data.visible ?? true,
            image: data.image || DEFAULT_IMAGE
        });
        await product.save();

        return NextResponse.json({
            success: true,
            message: 'Product added to inventory',
            product: product.toJSON()
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/products');
    }
}
