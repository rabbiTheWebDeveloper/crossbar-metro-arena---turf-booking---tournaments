import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { initiateSSLSession, publicBaseUrl, isGatewayConfigured } from '@/lib/sslcommerz';
import { optionalAuth, cleanPhone, rateLimit } from '@/lib/apiAuth';
import {
    loadPricing, slotDefinition, slotPrice, resolveAddOns, validateBookingDate,
    generateBookingCode, generateTranId, expireStaleHolds, findActiveBooking
} from '@/lib/booking';

/**
 * POST /api/payment/sslcommerz/init
 * Creates a server-priced booking in `pending_payment` (a hold that expires after holdMinutes)
 * and opens an SSLCommerz session for exactly the amount the server computed.
 * Body: { pendingBooking: { date, slotNumber, captainName, captainPhone, teamName, playerCount, matchType, addOns: [ids], paymentType, notes } }
 */
export async function POST(request) {
    try {
        const limited = rateLimit(request, 'payment-init', 12, 10 * 60 * 1000);
        if (limited) return limited;

        const body = await request.json();
        const pb = body.pendingBooking || body;
        const slotNumber = Number(pb.slotNumber);
        const captainName = String(pb.captainName || '').trim();
        const teamName = String(pb.teamName || '').trim();
        const phone = cleanPhone(pb.captainPhone);

        if (!pb.date || !slotNumber || !captainName || !teamName) {
            return NextResponse.json({ error: 'Match date, slot, captain name and team name are required.' }, { status: 400 });
        }
        if (!/^01[3-9]\d{8}$/.test(phone)) {
            return NextResponse.json({ error: 'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).' }, { status: 400 });
        }
        if (!isGatewayConfigured()) {
            return NextResponse.json({ error: 'Online payment is not configured yet. Please book by phone or pay at the arena counter.' }, { status: 503 });
        }

        await connectToDatabase();
        await expireStaleHolds();
        const pricing = await loadPricing();

        const dateError = validateBookingDate(pb.date, pricing.bookingWindowDays);
        if (dateError) return NextResponse.json({ error: dateError }, { status: 400 });
        const def = slotDefinition(pricing.slotPrices, slotNumber);
        if (!def) return NextResponse.json({ error: 'Invalid slot number.' }, { status: 400 });

        const existing = await findActiveBooking(pb.date, slotNumber);
        if (existing) {
            const held = existing.paymentStatus === 'pending_payment';
            return NextResponse.json({
                error: held
                    ? 'Another customer is paying for this slot right now. Please try again in a few minutes or pick another slot.'
                    : 'This slot has already been reserved by another squad. Please select an alternate slot.'
            }, { status: 409 });
        }

        // Server-side money: nothing from the client is trusted
        const courtPrice = slotPrice(pricing, pb.date, slotNumber);
        const { addOns, addOnsPrice } = resolveAddOns(pb.addOns);
        const totalPrice = courtPrice + addOnsPrice;
        const paymentType = pb.paymentType === 'full_payment' ? 'full_payment' : 'advance_500';
        const payableAmount = paymentType === 'full_payment' ? totalPrice : Math.min(pricing.advanceAmount, totalPrice);

        const user = await optionalAuth(request);
        const tranId = generateTranId();
        const holdExpiresAt = Date.now() + pricing.holdMinutes * 60 * 1000;

        let booking = null;
        for (let attempt = 0; attempt < 3 && !booking; attempt++) {
            try {
                booking = await Booking.create({
                    bookingCode: generateBookingCode('CMA'),
                    courtId: 'main-turf',
                    courtName: 'Crossbar Metro Arena (Main Turf)',
                    date: pb.date,
                    slotNumber,
                    startTime: def.startTime,
                    endTime: def.endTime,
                    displayTime: def.displayTime,
                    captainName,
                    captainPhone: phone,
                    userId: user ? String(user.userId || user.id || '') : undefined,
                    teamName,
                    playerCount: Number(pb.playerCount) || 14,
                    matchType: ['friendly', 'competitive', 'practice', 'corporate'].includes(pb.matchType) ? pb.matchType : 'friendly',
                    addOns,
                    courtPrice,
                    addOnsPrice,
                    totalPrice,
                    paymentType,
                    advanceAmount: 0,
                    dueAmount: totalPrice,
                    paymentMethod: 'bkash',
                    paymentStatus: 'pending_payment',
                    transactionId: tranId,
                    gatewayTranId: tranId,
                    expectedAmount: payableAmount,
                    holdExpiresAt,
                    isWalkIn: false,
                    notes: pb.notes ? String(pb.notes).slice(0, 300) : ''
                });
            } catch (e) {
                if (e && e.code === 11000 && String(e.message).includes('bookingCode')) continue;
                if (e && e.code === 11000) return NextResponse.json({ error: 'That slot was taken a moment ago. Please choose another slot.' }, { status: 409 });
                throw e;
            }
        }
        if (!booking) return NextResponse.json({ error: 'Could not reserve the slot, please retry.' }, { status: 500 });

        let session;
        try {
            session = await initiateSSLSession({
                totalAmount: payableAmount,
                tranId,
                customerName: captainName,
                customerPhone: phone,
                customerEmail: user?.email || `${phone}@bookcrossbar.com`,
                productName: `Crossbar Metro Slot #${slotNumber} (${pb.date})`,
                baseUrl: publicBaseUrl(request.url)
            });
        } catch (gwErr) {
            // Release the hold so the slot is not blocked by a failed gateway call
            booking.paymentStatus = 'cancelled';
            booking.notes = `Gateway init failed: ${gwErr.message}`;
            await booking.save();
            throw gwErr;
        }

        return NextResponse.json({
            success: true,
            gatewayUrl: session.gatewayUrl,
            sessionkey: session.sessionkey,
            tranId,
            bookingCode: booking.bookingCode,
            amount: payableAmount,
            totalPrice,
            dueAfterPayment: Math.max(0, totalPrice - payableAmount),
            holdExpiresAt
        });
    } catch (err) {
        console.error('SSLCommerz Session Init Error:', err);
        return NextResponse.json({ error: err.message || 'Failed to initiate payment gateway' }, { status: 500 });
    }
}
