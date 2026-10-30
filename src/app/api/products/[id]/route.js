import { NextResponse } from 'next/server';
import { requireAdmin, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { PRODUCT_SCHEMA } from '@/lib/schemas';

export async function PATCH(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error } = validate(body, PRODUCT_SCHEMA, { partial: true });
        if (error) return badRequest(error);

        await connectToDatabase();
        const product = await Product.findById(id);
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const price = data.price ?? product.price;
        if (data.salePrice !== undefined && data.salePrice > price) return badRequest('Sale price cannot be higher than the regular price.');

        product.set(data);
        if (data.stock !== undefined) product.inStock = product.stock > 0;
        await product.save();

        return NextResponse.json({
            success: true,
            message: 'Product updated successfully',
            product: product.toJSON()
        });
    } catch (err) {
        return errorResponse(err, 'PATCH /api/products/[id]');
    }
}

export async function DELETE(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        await connectToDatabase();
        await Product.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Product removed from shop' });
    } catch (err) {
        return errorResponse(err, 'DELETE /api/products/[id]');
    }
}
