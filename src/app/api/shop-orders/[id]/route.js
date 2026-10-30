import { readJson } from '@/lib/validate';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ShopReservation } from '@/models/ShopReservation';
import { Product } from '@/models/Product';
import { OtherIncome } from '@/models/OtherIncome';
import { requireAdmin, isObjectId } from '@/lib/apiAuth';

/**
 * PATCH /api/shop-orders/:id  (admin)
 * Moving to "collected" decrements stock and records the sale as income (once).
 */
export async function PATCH(request, { params }) {
    try {
        const { user, denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const order = await ShopReservation.findById(id);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        const prev = order.status;

        if (body.status) {
            if (!['reserved_pickup', 'picked_up', 'collected', 'cancelled'].includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            const next = body.status === 'picked_up' ? 'collected' : body.status;
            if (next === 'collected' && prev !== 'collected') {
                // Take stock now; refuse if something sold out in the meantime
                for (const item of order.items || []) {
                    if (!isObjectId(item.productId)) continue;
                    const res = await Product.updateOne({ _id: item.productId, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } });
                    if (res.matchedCount === 0) {
                        const p = await Product.findById(item.productId).select('name stock');
                        return NextResponse.json({ error: `Not enough stock for ${p ? p.name : item.name} (have ${p ? p.stock : 0}, need ${item.quantity}).` }, { status: 409 });
                    }
                    await Product.updateOne({ _id: item.productId, stock: { $lte: 0 } }, { $set: { inStock: false } });
                }
                const existingIncome = await OtherIncome.findOne({ title: `Shop order ${order.reservationCode}` });
                if (!existingIncome) {
                    await OtherIncome.create({
                        source: 'shop_sales',
                        title: `Shop order ${order.reservationCode}`,
                        amount: Number(order.totalAmount || 0),
                        date: new Date().toISOString().split('T')[0],
                        notes: (order.items || []).map(i => `${i.name} x${i.quantity}`).join(', '),
                        recordedBy: user.name || 'Admin Desk'
                    });
                }
                order.collectedAt = new Date();
            }
            if (prev === 'collected' && next !== 'collected') {
                // Undo: put the stock back and remove the income line
                for (const item of order.items || []) {
                    if (!isObjectId(item.productId)) continue;
                    await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity }, $set: { inStock: true } });
                }
                await OtherIncome.deleteOne({ title: `Shop order ${order.reservationCode}` });
            }
            order.status = next;
        }
        if (body.notes !== undefined) order.notes = String(body.notes).slice(0, 300);
        if (body.pickupDate && /^\d{4}-\d{2}-\d{2}$/.test(body.pickupDate)) order.pickupDate = body.pickupDate;

        await order.save();
        return NextResponse.json({ success: true, message: 'Shop order updated', reservation: order.toJSON() });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
