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

        // The admin UI sends `status` + `collectedCash`; public callers send `paymentStatus`.
        const nextStatus = body.paymentStatus || body.status;
        if (body.collectedCash && Number(body.collectedCash) > 0) {
            booking.advanceAmount = (booking.advanceAmount || 0) + Number(body.collectedCash);
            booking.dueAmount = Math.max(0, (booking.totalPrice || 0) - booking.advanceAmount);
        }
        if (nextStatus) {
            booking.paymentStatus = nextStatus;
            if (nextStatus === 'paid_full') {
                booking.advanceAmount = booking.totalPrice;
                booking.dueAmount = 0;
            }
        }
        if (body.dueAmount !== undefined) booking.dueAmount = body.dueAmount;
        if (body.advanceAmount !== undefined) booking.advanceAmount = body.advanceAmount;
        if (body.captainName) booking.captainName = String(body.captainName).trim();
        if (body.captainPhone) booking.captainPhone = String(body.captainPhone).trim();
        if (body.teamName) booking.teamName = String(body.teamName).trim();
        if (body.paymentMethod) booking.paymentMethod = body.paymentMethod;
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
