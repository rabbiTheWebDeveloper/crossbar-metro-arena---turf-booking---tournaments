import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models';
import { initiateSSLSession } from '@/lib/sslcommerz';

export async function POST(request) {
    try {
        const body = await request.json();
        const { pendingBooking, baseUrl } = body;

        if (!pendingBooking) {
            return NextResponse.json({ error: 'Missing booking details' }, { status: 400 });
        }

        const {
            date,
            slotNumber,
            captainName,
            captainPhone,
            paymentType,
            advanceAmount,
            totalPrice
        } = pendingBooking;

        if (!date || !slotNumber || !captainPhone) {
            return NextResponse.json({ error: 'Match date, slot number and captain phone are required' }, { status: 400 });
        }

        await connectToDatabase();

        // Check if slot has already been confirmed by someone else
        const existing = await Booking.findOne({
            date,
            slotNumber,
            paymentStatus: { $ne: 'cancelled' }
        });

        if (existing) {
            return NextResponse.json({
                error: 'This slot has already been reserved by another squad. Please select an alternate slot.'
            }, { status: 409 });
        }

        const payableAmount = paymentType === 'full_payment'
            ? (totalPrice || 2500)
            : (advanceAmount || 500);

        const tranId = `CMA-SSL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const bookingCode = pendingBooking.bookingCode || `CMA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Prepare metadata payload to retrieve during callback
        const metadata = {
            bookingCode,
            courtId: pendingBooking.courtId || 'main-turf',
            courtName: pendingBooking.courtName || 'Crossbar Metro Arena (Main Turf)',
            date: pendingBooking.date,
            slotNumber: pendingBooking.slotNumber,
            startTime: pendingBooking.startTime,
            endTime: pendingBooking.endTime,
            displayTime: pendingBooking.displayTime,
            captainName: pendingBooking.captainName || 'Player Team',
            captainPhone: pendingBooking.captainPhone,
            teamName: pendingBooking.teamName || 'Squad FC',
            playerCount: pendingBooking.playerCount || 14,
            matchType: pendingBooking.matchType || 'friendly',
            addOns: pendingBooking.addOns || [],
            courtPrice: pendingBooking.courtPrice || 2500,
            addOnsPrice: pendingBooking.addOnsPrice || 0,
            totalPrice: pendingBooking.totalPrice || 2500,
            paymentType: pendingBooking.paymentType || 'advance_500',
            advanceAmount: payableAmount,
            dueAmount: Math.max(0, (pendingBooking.totalPrice || 2500) - payableAmount),
            notes: pendingBooking.notes || ''
        };

        const session = await initiateSSLSession({
            totalAmount: payableAmount,
            tranId,
            customerName: captainName,
            customerPhone: captainPhone,
            customerEmail: 'player@crossbarmetro.com',
            productName: `Crossbar Metro Slot #${slotNumber} (${date})`,
            metadata,
            baseUrl
        });

        return NextResponse.json({
            success: true,
            gatewayUrl: session.gatewayUrl,
            sessionkey: session.sessionkey,
            tranId,
            bookingCode
        });
    } catch (err) {
        console.error('SSLCommerz Session Init Error:', err);
        return NextResponse.json({
            error: err.message || 'Failed to initiate payment gateway'
        }, { status: 500 });
    }
}
