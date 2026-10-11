import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ShopReservation } from '@/models/ShopReservation';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const query = {};
        if (status) query.status = status;

        const reservations = await ShopReservation.find(query).sort({ createdAt: -1 });
        return NextResponse.json({
            success: true,
            count: reservations.length,
            reservations: reservations.map(r => r.toJSON())
        });
    } catch (err) {
        console.error('GET /api/shop-orders error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { customerName, customerPhone, items, totalAmount, pickupDate, notes } = body;

        if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Customer name, phone, and at least 1 item are required.' },
                { status: 400 }
            );
        }

        const codeSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const reservationCode = body.reservationCode || `ORD-${codeSuffix}`;

        const newReservation = new ShopReservation({
            reservationCode,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            items,
            totalAmount: Number(totalAmount || items.reduce((s, i) => s + (i.price * i.quantity), 0)),
            status: 'reserved_pickup',
            pickupDate: pickupDate || new Date().toISOString().split('T')[0],
            notes: notes || ''
        });

        await newReservation.save();

        return NextResponse.json({
            success: true,
            message: 'Shop order placed successfully',
            reservation: newReservation.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/shop-orders error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
