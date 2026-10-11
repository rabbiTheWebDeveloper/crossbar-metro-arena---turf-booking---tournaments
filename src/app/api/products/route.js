import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const featured = searchParams.get('featured');

        const query = {};
        if (category && category !== 'all') query.category = category;
        if (featured === 'true') query.featured = true;

        const products = await Product.find(query).sort({ featured: -1, createdAt: -1 });
        return NextResponse.json({
            success: true,
            count: products.length,
            products: products.map(p => p.toJSON())
        });
    } catch (err) {
        console.error('GET /api/products error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const targetId = body.id || body._id;

        if (targetId) {
            const existing = await Product.findById(targetId);
            if (existing) {
                if (body.name) existing.name = body.name.trim();
                if (body.category) existing.category = body.category;
                if (body.price !== undefined) existing.price = Number(body.price);
                if (body.salePrice !== undefined) existing.salePrice = Number(body.salePrice);
                if (body.stock !== undefined) {
                    existing.stock = Number(body.stock);
                    existing.inStock = existing.stock > 0;
                }
                if (body.sizes) existing.sizes = body.sizes;
                if (body.badge !== undefined) existing.badge = body.badge;
                if (body.description !== undefined) existing.description = body.description;
                if (body.image) existing.image = body.image;
                if (body.featured !== undefined) existing.featured = body.featured;
                if (body.visible !== undefined) existing.visible = body.visible;

                await existing.save();

                return NextResponse.json({
                    success: true,
                    message: 'Product updated successfully',
                    product: existing.toJSON()
                });
            }
        }

        const { name, category, price, salePrice, stock, sizes, badge, description, image } = body;

        if (!name || price === undefined) {
            return NextResponse.json(
                { error: 'Product name and price are required.' },
                { status: 400 }
            );
        }

        const newProduct = new Product({
            name: name.trim(),
            category: category || 'accessories',
            price: Number(price),
            salePrice: salePrice ? Number(salePrice) : Number(price),
            stock: Number(stock ?? 10),
            sizes: sizes || [],
            badge: badge || '',
            description: description || '',
            inStock: (stock ?? 10) > 0,
            featured: body.featured ?? false,
            visible: true,
            image: image || 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80'
        });

        await newProduct.save();

        return NextResponse.json({
            success: true,
            message: 'Product added to inventory',
            product: newProduct.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/products error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
