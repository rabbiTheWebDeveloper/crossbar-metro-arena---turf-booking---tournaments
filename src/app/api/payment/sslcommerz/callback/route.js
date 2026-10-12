import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models';
import { validateSSLTransaction } from '@/lib/sslcommerz';

export async function POST(request) {
    try {
        const url = new URL(request.url);
        const statusQuery = url.searchParams.get('status');

        const formData = await request.formData();
        const payload = {};
        formData.forEach((val, key) => {
            payload[key] = val;
        });

        const tranId = payload.tran_id || '';
        const valId = payload.val_id || '';
        const cardType = payload.card_type || 'sslcommerz';
        const bankTranId = payload.bank_tran_id || tranId;
        const paidAmount = parseFloat(payload.amount || '0');

        let metadata = {};
        if (payload.value_a) {
            try {
                metadata = JSON.parse(payload.value_a);
            } catch (e) {
                console.warn('Failed to parse metadata value_a:', e);
            }
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;

        // 1. Payment Cancelled
        if (statusQuery === 'cancel') {
            return NextResponse.redirect(`${baseUrl}/booking?payment=cancelled&tranId=${tranId}`, 303);
        }

        // 2. Payment Failed
        if (statusQuery === 'fail') {
            return NextResponse.redirect(`${baseUrl}/booking?payment=failed&tranId=${tranId}`, 303);
        }

        // 3. Payment Success - Verify with SSLCommerz Validation Server
        if (statusQuery === 'success') {
            let isValid = false;

            try {
                const validationRes = await validateSSLTransaction({ valId });
                if (validationRes.status === 'VALID' || validationRes.status === 'VALIDATED') {
                    isValid = true;
                } else {
                    console.error('SSLCommerz Validation Failed status:', validationRes.status);
                }
            } catch (valErr) {
                console.error('Error validating with SSLCommerz:', valErr);
            }

            if (!isValid) {
                return NextResponse.redirect(`${baseUrl}/booking?payment=failed&reason=validation_failed&tranId=${tranId}`, 303);
            }

            // Persistence in MongoDB
            await connectToDatabase();

            const bookingCode = metadata.bookingCode || `CMA-${tranId.slice(-6).toUpperCase()}`;

            // Check if booking already recorded (idempotency)
            let booking = await Booking.findOne({
                $or: [
                    { transactionId: bankTranId },
                    { bookingCode: bookingCode }
                ]
            });

            if (!booking) {
                booking = await Booking.create({
                    bookingCode,
                    courtId: metadata.courtId || 'main-turf',
                    courtName: metadata.courtName || 'Crossbar Metro Arena (Main Turf)',
                    date: metadata.date,
                    slotNumber: metadata.slotNumber,
                    startTime: metadata.startTime,
                    endTime: metadata.endTime,
                    displayTime: metadata.displayTime,
                    captainName: metadata.captainName,
                    captainPhone: metadata.captainPhone,
                    teamName: metadata.teamName || 'Squad FC',
                    playerCount: metadata.playerCount || 14,
                    matchType: metadata.matchType || 'friendly',
                    addOns: metadata.addOns || [],
                    courtPrice: metadata.courtPrice || 2500,
                    addOnsPrice: metadata.addOnsPrice || 0,
                    totalPrice: metadata.totalPrice || 2500,
                    paymentType: metadata.paymentType || 'advance_500',
                    advanceAmount: paidAmount || metadata.advanceAmount || 500,
                    dueAmount: Math.max(0, (metadata.totalPrice || 2500) - (paidAmount || metadata.advanceAmount || 500)),
                    paymentMethod: cardType,
                    paymentStatus: metadata.paymentType === 'full_payment' ? 'paid_full' : 'paid_advance',
                    transactionId: bankTranId,
                    isWalkIn: false,
                    notes: `SSLCommerz Sandbox Verified (${valId})`
                });
            } else {
                booking.paymentStatus = metadata.paymentType === 'full_payment' ? 'paid_full' : 'paid_advance';
                booking.paymentMethod = cardType;
                booking.transactionId = bankTranId;
                booking.advanceAmount = paidAmount || booking.advanceAmount;
                booking.dueAmount = Math.max(0, booking.totalPrice - (paidAmount || booking.advanceAmount));
                await booking.save();
            }

            return NextResponse.redirect(`${baseUrl}/booking?payment=success&bookingCode=${booking.bookingCode}&tranId=${bankTranId}`, 303);
        }

        return NextResponse.redirect(`${baseUrl}/booking?payment=unknown`, 303);
    } catch (err) {
        console.error('SSLCommerz Callback Handler Error:', err);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/booking?payment=error&message=${encodeURIComponent(err.message)}`, 303);
    }
}
