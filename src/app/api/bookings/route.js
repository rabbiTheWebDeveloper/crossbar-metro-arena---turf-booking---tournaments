import { readJson } from '@/lib/validate';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { optionalAuth, requireAdmin, escapeRegex, cleanPhone } from '@/lib/apiAuth';
import {
    loadPricing, slotDefinition, slotPrice, resolveAddOns, validateBookingDate, generateBookingCode,
    expireStaleHolds, findActiveBooking, statusFromPayment, publicBookingView, todayDhaka, addDays, isIsoDate
} from '@/lib/booking';

/**
 * GET /api/bookings
 *  - admin: every booking (filters: date, month, status, q, from, to)
 *  - signed-in player/investor: public availability view + full details of their own bookings
 *  - anonymous: public availability view only (no names/phones)
 *  - ?mine=1 : only the caller's own bookings (full details)
 */
export async function GET(request) {
    try {
        await connectToDatabase();
        await expireStaleHolds();
        const user = await optionalAuth(request);
        const isAdmin = user?.role === 'admin';
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const month = searchParams.get('month');
        const status = searchParams.get('status');
        const search = (searchParams.get('q') || '').slice(0, 60);
        const mine = searchParams.get('mine') === '1';
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const query = {};
        if (date && isIsoDate(date)) query.date = date;
        if (month && /^\d{4}-\d{2}$/.test(month)) query.date = { $regex: `^${escapeRegex(month)}` };
        if (status) query.paymentStatus = status;
        if (from && isIsoDate(from)) query.date = { ...(typeof query.date === 'object' ? query.date : {}), $gte: from };
        if (to && isIsoDate(to)) query.date = { ...(typeof query.date === 'object' ? query.date : {}), $lte: to };
        if (search && isAdmin) {
            const re = { $regex: escapeRegex(search), $options: 'i' };
            query.$or = [{ bookingCode: re }, { captainName: re }, { captainPhone: re }, { teamName: re }];
        }

        const myPhone = user ? cleanPhone(user.phone) : '';
        const myId = user ? String(user.userId || user.id || '') : '';

        if (mine) {
            if (!user || !myPhone) return NextResponse.json({ success: true, count: 0, bookings: [] });
            const own = await Booking.find({ ...query, $or: [{ captainPhone: myPhone }, ...(myId ? [{ userId: myId }] : [])] }).sort({ date: -1, slotNumber: 1 }).lean({ virtuals: false });
            return NextResponse.json({ success: true, count: own.length, bookings: own.map(toJson) });
        }

        if (isAdmin) {
            const bookings = await Booking.find(query).sort({ date: -1, slotNumber: 1 }).lean();
            return NextResponse.json({ success: true, count: bookings.length, bookings: bookings.map(toJson) });
        }

        // Public: default to the booking window so the payload stays small
        if (!query.date) {
            const { bookingWindowDays } = await loadPricing();
            query.date = { $gte: addDays(todayDhaka(), -1), $lte: addDays(todayDhaka(), bookingWindowDays + 1) };
        }
        query.paymentStatus = status || { $ne: 'cancelled' };
        const bookings = await Booking.find(query).sort({ date: 1, slotNumber: 1 }).lean();
        const list = bookings.map(b => {
            const own = user && ((myPhone && cleanPhone(b.captainPhone) === myPhone) || (myId && b.userId === myId));
            return own ? toJson(b) : publicBookingView(toJson(b));
        });
        return NextResponse.json({ success: true, count: list.length, bookings: list });
    } catch (err) {
        console.error('GET /api/bookings error:', err);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

function toJson(b) {
    const j = { ...b, id: String(b._id) };
    delete j.__v;
    return j;
}

/**
 * POST /api/bookings  (admin only: walk-in / counter bookings)
 * Online customer bookings are created by /api/payment/sslcommerz/init and confirmed by the gateway callback.
 * Prices are always computed on the server; an admin may override the court price for a counter deal.
 */
export async function POST(request) {
    try {
        const { user, denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        await expireStaleHolds();
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { date, captainName, captainPhone, teamName } = body;
        const slotNumber = Number(body.slotNumber);
        if (!date || !slotNumber || !captainName || !captainPhone || !teamName) {
            return NextResponse.json({ error: 'Date, slot number, captain name, mobile, and team name are required.' }, { status: 400 });
        }
        const phone = cleanPhone(captainPhone);
        if (!/^01[3-9]\d{8}$/.test(phone)) {
            return NextResponse.json({ error: 'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).' }, { status: 400 });
        }

        const pricing = await loadPricing();
        const dateError = validateBookingDate(date, pricing.bookingWindowDays, { allowPast: body.allowPast === true });
        if (dateError) return NextResponse.json({ error: dateError }, { status: 400 });
        const def = slotDefinition(pricing.slotPrices, slotNumber);
        if (!def) return NextResponse.json({ error: 'Invalid slot number.' }, { status: 400 });

        const conflict = await findActiveBooking(date, slotNumber);
        if (conflict) {
            return NextResponse.json({
                error: `Slot #${slotNumber} on ${date} is already booked by ${conflict.teamName} (${conflict.bookingCode}).`
            }, { status: 409 });
        }

        const listPrice = slotPrice(pricing, date, slotNumber);
        const override = body.courtPrice !== undefined && body.courtPrice !== null ? Number(body.courtPrice) : (body.totalPrice !== undefined ? Number(body.totalPrice) : NaN);
        const courtPrice = !Number.isNaN(override) && override >= 0 ? override : listPrice;
        const { addOns, addOnsPrice } = resolveAddOns(body.addOns);
        const totalPrice = courtPrice + addOnsPrice;
        const advance = Math.min(Math.max(0, Number(body.advanceAmount ?? body.collected ?? 0) || 0), totalPrice);
        const paymentStatus = statusFromPayment(advance, totalPrice);
        const method = ['pay_at_turf', 'bkash', 'nagad', 'rocket', 'upay', 'card', 'cash'].includes(body.paymentMethod) ? body.paymentMethod : (advance > 0 ? 'cash' : 'pay_at_turf');

        let booking = null;
        for (let attempt = 0; attempt < 3 && !booking; attempt++) {
            try {
                booking = await Booking.create({
                    bookingCode: generateBookingCode(body.isWalkIn === false ? 'CMA' : 'CMA-W'),
                    courtId: 'main-turf',
                    courtName: 'Crossbar Metro Arena (Main Turf)',
                    date,
                    slotNumber,
                    startTime: def.startTime,
                    endTime: def.endTime,
                    displayTime: def.displayTime,
                    captainName: String(captainName).trim(),
                    captainPhone: phone,
                    teamName: String(teamName).trim(),
                    playerCount: Number(body.playerCount) || 14,
                    matchType: ['friendly', 'competitive', 'practice', 'corporate'].includes(body.matchType) ? body.matchType : 'friendly',
                    addOns,
                    courtPrice,
                    addOnsPrice,
                    totalPrice,
                    paymentType: advance >= totalPrice ? 'full_payment' : (advance > 0 ? 'advance_500' : 'pay_at_turf'),
                    advanceAmount: advance,
                    dueAmount: Math.max(0, totalPrice - advance),
                    paymentMethod: method,
                    paymentStatus,
                    transactionId: body.transactionId ? String(body.transactionId).trim() : `COUNTER-${Date.now().toString().slice(-6)}`,
                    paidAt: advance > 0 ? new Date() : undefined,
                    isWalkIn: body.isWalkIn !== false,
                    notes: body.notes ? String(body.notes).trim() : `Counter booking recorded by ${user.name || 'admin'}`
                });
            } catch (e) {
                if (e && e.code === 11000 && String(e.message).includes('bookingCode')) continue; // regenerate code
                if (e && e.code === 11000) return NextResponse.json({ error: 'That slot was booked a moment ago by someone else.' }, { status: 409 });
                throw e;
            }
        }
        if (!booking) return NextResponse.json({ error: 'Could not allocate a booking code, please retry.' }, { status: 500 });

        return NextResponse.json({ success: true, message: 'Booking created successfully!', booking: booking.toJSON() }, { status: 201 });
    } catch (err) {
        console.error('POST /api/bookings error:', err);
        return NextResponse.json({ error: err.message || 'Failed to create booking' }, { status: 500 });
    }
}
