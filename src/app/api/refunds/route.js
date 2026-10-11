import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Refund } from '@/models/Refund';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const query = {};
        if (status) query.status = status;

        const refunds = await Refund.find(query).sort({ requestDate: -1 });
        return NextResponse.json({
            success: true,
            count: refunds.length,
            refunds: refunds.map(r => r.toJSON())
        });
    } catch (err) {
        console.error('GET /api/refunds error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { bookingId, bookingCode, customerName, customerPhone, amount, reason, refundMethod } = body;

        if (!bookingCode || !customerName || amount === undefined) {
            return NextResponse.json(
                { error: 'Booking code, customer name, and refund amount are required.' },
                { status: 400 }
            );
        }

        const newRefund = new Refund({
            bookingId: bookingId || '',
            bookingCode,
            customerName: customerName.trim(),
            customerPhone: customerPhone?.trim() || '',
            amount: Number(amount),
            reason: reason || 'player_cancelled',
            refundMethod: refundMethod || 'bkash',
            status: 'pending',
            requestDate: new Date().toISOString().split('T')[0],
            recordedBy: 'Admin Desk'
        });

        await newRefund.save();

        return NextResponse.json({
            success: true,
            message: 'Refund request created',
            refund: newRefund.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/refunds error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
