import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const month = searchParams.get('month'); // e.g. "2026-10"
        const status = searchParams.get('status');
        const search = searchParams.get('q');

        const query = {};
        if (date) query.date = date;
        if (month) query.date = { $regex: `^${month}` };
        if (status) query.paymentStatus = status;
        if (search) {
            query.$or = [
                { bookingCode: { $regex: search, $options: 'i' } },
                { captainName: { $regex: search, $options: 'i' } },
                { captainPhone: { $regex: search, $options: 'i' } },
                { teamName: { $regex: search, $options: 'i' } }
            ];
        }

        const bookings = await Booking.find(query).sort({ date: -1, slotNumber: 1 });
        return NextResponse.json({
            success: true,
            count: bookings.length,
            bookings: bookings.map(b => b.toJSON())
        });
    } catch (err) {
        console.error('GET /api/bookings error:', err);
        return NextResponse.json({ error: err.message || 'Failed to fetch bookings' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        const {
            date,
            slotNumber,
            startTime,
            endTime,
            displayTime,
            captainName,
            captainPhone,
            teamName,
            totalPrice,
            advanceAmount,
            dueAmount,
            courtPrice,
            paymentMethod,
            paymentStatus,
            paymentType,
            addOns,
            matchType,
            playerCount,
            isWalkIn,
            notes
        } = body;

        if (!date || !slotNumber || !captainName || !captainPhone || !teamName) {
            return NextResponse.json(
                { error: 'Date, slot number, captain name, mobile, and team name are required.' },
                { status: 400 }
            );
        }

        // Strict Check: Double-booking prevention
        const conflict = await Booking.findOne({
            date,
            slotNumber,
            paymentStatus: { $ne: 'cancelled' }
        });

        if (conflict) {
            return NextResponse.json(
                { error: `Slot #${slotNumber} on ${date} is already booked by ${conflict.teamName} (${conflict.bookingCode}). Double-booking is strictly prevented.` },
                { status: 409 }
            );
        }

        // Generate unique booking code
        const codeSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const bookingCode = body.bookingCode || `CMA-${codeSuffix}`;

        const newBooking = new Booking({
            bookingCode,
            courtId: body.courtId || 'main-turf',
            courtName: body.courtName || 'Crossbar Metro Arena (Main Turf)',
            date,
            slotNumber,
            startTime: startTime || '19:30',
            endTime: endTime || '21:00',
            displayTime: displayTime || '07:30 PM – 09:00 PM',
            captainName: captainName.trim(),
            captainPhone: captainPhone.trim(),
            teamName: teamName.trim(),
            playerCount: playerCount || 14,
            matchType: matchType || 'friendly',
            addOns: addOns || [],
            courtPrice: courtPrice || totalPrice || 3500,
            addOnsPrice: body.addOnsPrice || 0,
            totalPrice: totalPrice || 3500,
            paymentType: paymentType || 'advance_500',
            advanceAmount: advanceAmount !== undefined ? advanceAmount : 500,
            dueAmount: dueAmount !== undefined ? dueAmount : Math.max(0, (totalPrice || 3500) - (advanceAmount || 500)),
            paymentMethod: paymentMethod || 'bkash',
            paymentStatus: paymentStatus || 'paid_advance',
            transactionId: body.transactionId || `TX-${Date.now().toString().slice(-6)}`,
            isWalkIn: isWalkIn || false,
            notes: notes || ''
        });

        await newBooking.save();

        return NextResponse.json({
            success: true,
            message: 'Booking created successfully!',
            booking: newBooking.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/bookings error:', err);
        return NextResponse.json({ error: err.message || 'Failed to create booking' }, { status: 500 });
    }
}
