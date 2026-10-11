import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function PATCH(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await request.json();

        const product = await Product.findById(id);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (body.name) product.name = body.name.trim();
        if (body.price !== undefined) product.price = Number(body.price);
        if (body.salePrice !== undefined) product.salePrice = Number(body.salePrice);
        if (body.stock !== undefined) {
            product.stock = Number(body.stock);
            product.inStock = product.stock > 0;
        }
        if (body.category) product.category = body.category;
        if (body.badge !== undefined) product.badge = body.badge;
        if (body.description !== undefined) product.description = body.description;
        if (body.image) product.image = body.image;
        if (body.featured !== undefined) product.featured = body.featured;
        if (body.visible !== undefined) product.visible = body.visible;

        await product.save();

        return NextResponse.json({
            success: true,
            message: 'Product updated successfully',
            product: product.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(_request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        await Product.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Product removed from shop' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
