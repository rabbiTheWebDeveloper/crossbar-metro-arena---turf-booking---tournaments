import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ShopReservation } from '@/models/ShopReservation';

export async function PATCH(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await request.json();

        const order = await ShopReservation.findById(id);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (body.status) order.status = body.status;
        if (body.notes !== undefined) order.notes = body.notes;

        await order.save();

        return NextResponse.json({
            success: true,
            message: 'Shop order status updated successfully',
            reservation: order.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
