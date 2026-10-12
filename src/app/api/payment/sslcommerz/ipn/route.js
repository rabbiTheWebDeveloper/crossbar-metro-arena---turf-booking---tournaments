import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models';
import { validateSSLTransaction } from '@/lib/sslcommerz';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const payload = {};
        formData.forEach((val, key) => {
            payload[key] = val;
        });

        const tranId = payload.tran_id;
        const valId = payload.val_id;
        const status = payload.status;
        const cardType = payload.card_type || 'sslcommerz';
        const bankTranId = payload.bank_tran_id || tranId;
        const paidAmount = parseFloat(payload.amount || '0');

        if (!valId) {
            return NextResponse.json({ message: 'Missing val_id' }, { status: 400 });
        }

        // Validate with SSLCommerz server
        const validationRes = await validateSSLTransaction({ valId });
        if (validationRes.status !== 'VALID' && validationRes.status !== 'VALIDATED') {
            console.warn('IPN Validation not valid:', validationRes);
            return NextResponse.json({ message: 'Transaction not valid' }, { status: 400 });
        }

        let metadata = {};
        if (payload.value_a) {
            try {
                metadata = JSON.parse(payload.value_a);
            } catch (e) {
                console.warn('IPN value_a parse failed:', e);
            }
        }

        await connectToDatabase();

        const bookingCode = metadata.bookingCode || `CMA-${tranId.slice(-6).toUpperCase()}`;

        let booking = await Booking.findOne({
            $or: [
                { transactionId: bankTranId },
                { bookingCode: bookingCode }
            ]
        });

        if (!booking) {
            await Booking.create({
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
                notes: `IPN SSLCommerz Verified (${valId})`
            });
        }

        return NextResponse.json({ success: true, message: 'IPN processed' });
    } catch (err) {
        console.error('SSLCommerz IPN Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
