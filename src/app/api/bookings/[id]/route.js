import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';

export async function GET(_request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const booking = await Booking.findOne({
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingCode: id }]
        });
        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, booking: booking.toJSON() });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await request.json();

        const booking = await Booking.findOne({
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingCode: id }]
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (body.paymentStatus) {
            booking.paymentStatus = body.paymentStatus;
            if (body.paymentStatus === 'paid_full') {
                booking.dueAmount = 0;
            }
        }
        if (body.dueAmount !== undefined) booking.dueAmount = body.dueAmount;
        if (body.notes !== undefined) booking.notes = body.notes;
        if (body.transactionId) booking.transactionId = body.transactionId;

        await booking.save();

        return NextResponse.json({
            success: true,
            message: 'Booking updated successfully',
            booking: booking.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(_request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const booking = await Booking.findOne({
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingCode: id }]
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        booking.paymentStatus = 'cancelled';
        await booking.save();

        return NextResponse.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
