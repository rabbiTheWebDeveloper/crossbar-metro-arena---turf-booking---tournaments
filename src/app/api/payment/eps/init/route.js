import { NextResponse } from 'next/server';
import { readJson } from '@/lib/validate';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/booking-model';
import { publicBaseUrl } from '@/lib/baseUrl';
import { getEpsConfig, initiateEpsBookingPayment } from '@/service/eps-service';
import { optionalAuth, cleanPhone, rateLimit } from '@/lib/apiAuth';
import {
    loadPricing, slotDefinition, slotPrice, resolveAddOns, validateBookingDate,
    generateBookingCode, expireStaleHolds, findActiveBooking
} from '@/lib/booking';

/**
 * POST /api/payment/eps/init
 * Creates a server-priced booking hold (`pending_payment`) and opens an EPS checkout session
 * for the exact server-computed payable amount.
 */
export async function POST(request) {
    try {
        const limited = rateLimit(request, 'eps-payment-init', 12, 10 * 60 * 1000);
        if (limited) return limited;

        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        const pb = body.pendingBooking || body;
        const slotNumber = Number(pb.slotNumber);
        const captainName = String(pb.captainName || '').trim();
        const teamName = String(pb.teamName || '').trim();
        const phone = cleanPhone(pb.captainPhone);

        if (!pb.date || !slotNumber || !captainName || !teamName) {
            return NextResponse.json(
                { error: 'Match date, slot, captain name and team name are required.' },
                { status: 400 }
            );
        }
        if (!/^01[3-9]\d{8}$/.test(phone)) {
            return NextResponse.json(
                { error: 'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).' },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const epsCfg = await getEpsConfig();
        if (!epsCfg.configured) {
            console.error('[EPS init] Not configured:', {
                source: epsCfg.source,
                missingFields: epsCfg.missingFields,
                configError: epsCfg.configError || '',
                vercelEnv: process.env.VERCEL_ENV || process.env.NODE_ENV || ''
            });
            return NextResponse.json(
                {
                    error: epsCfg.configError
                        ? `EPS gateway config is invalid: ${epsCfg.configError} Fix it in Admin Settings -> EPS Payment Gateway (or EPS_* in .env).`
                        : 'EPS online payment is not configured yet. Please configure EPS in Admin Settings or pay at the arena counter.'
                },
                { status: 503 }
            );
        }

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

        // Server-computed pricing (client prices are never trusted)
        const courtPrice = slotPrice(pricing, pb.date, slotNumber);
        const { addOns, addOnsPrice } = resolveAddOns(pb.addOns, pricing.bookingAddOns);
        const totalPrice = courtPrice + addOnsPrice;
        const paymentType = pb.paymentType === 'full_payment' ? 'full_payment' : 'advance_500';
        const payableAmount = paymentType === 'full_payment' ? totalPrice : Math.min(pricing.advanceAmount, totalPrice);

        const user = await optionalAuth(request);
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
                    paymentMethod: 'eps',
                    paymentGateway: 'eps',
                    paymentStatus: 'pending_payment',
                    expectedAmount: payableAmount,
                    holdExpiresAt,
                    isWalkIn: false,
                    notes: pb.notes ? String(pb.notes).slice(0, 300) : ''
                });
            } catch (e) {
                if (e && e.code === 11000 && String(e.message).includes('bookingCode')) continue;
                if (e && e.code === 11000) {
                    return NextResponse.json(
                        { error: 'That slot was taken a moment ago. Please choose another slot.' },
                        { status: 409 }
                    );
                }
                throw e;
            }
        }
        if (!booking) {
            return NextResponse.json({ error: 'Could not reserve the slot, please retry.' }, { status: 500 });
        }

        const forwardedFor = request.headers.get('x-forwarded-for') || '';
        const ipAddress = forwardedFor.split(',')[0].trim() || '127.0.0.1';

        let session;
        try {
            session = await initiateEpsBookingPayment({
                booking,
                payableAmount,
                customerEmail: pb.customerEmail || user?.email || '',
                baseUrl: publicBaseUrl(request.url),
                ipAddress
            });
        } catch (gwErr) {
            // Release the slot hold if EPS initialization fails
            booking.paymentStatus = 'cancelled';
            booking.notes = `EPS init failed: ${gwErr.message}`;
            await booking.save();
            throw gwErr;
        }

        return NextResponse.json({
            success: true,
            gateway: 'eps',
            gatewayUrl: session.redirectUrl,
            tranId: session.merchantTransactionId,
            merchantTransactionId: session.merchantTransactionId,
            epsTransactionId: session.epsTransactionId,
            sandbox: session.sandbox,
            bookingCode: booking.bookingCode,
            amount: payableAmount,
            totalPrice,
            dueAfterPayment: Math.max(0, totalPrice - payableAmount),
            holdExpiresAt
        });
    } catch (err) {
        console.error('EPS Session Init Error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to initiate EPS payment gateway' },
            { status: 500 }
        );
    }
}
