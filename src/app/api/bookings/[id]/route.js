import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { Refund } from '@/models/Refund';
import { optionalAuth, requireAuth, requireAdmin, isObjectId, cleanPhone } from '@/lib/apiAuth';
import { loadPricing, kickoffDate, statusFromPayment, publicBookingView } from '@/lib/booking';

async function findBooking(id) {
    return Booking.findOne(isObjectId(id) ? { _id: id } : { bookingCode: String(id).toUpperCase() });
}

const ownsBooking = (user, booking) => {
    if (!user) return false;
    const myId = String(user.userId || user.id || '');
    const myPhone = cleanPhone(user.phone);
    return (myId && booking.userId === myId) || (myPhone && cleanPhone(booking.captainPhone) === myPhone);
};

/**
 * GET /api/bookings/:idOrCode
 * Full details for admins and the owner; also for anyone presenting ?phone= matching the captain
 * (ticket lookup at the counter). Otherwise a public availability view.
 */
export async function GET(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const booking = await findBooking(id);
        if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        const user = await optionalAuth(request);
        const { searchParams } = new URL(request.url);
        const phoneParam = cleanPhone(searchParams.get('phone') || '');
        const allowed = user?.role === 'admin' || ownsBooking(user, booking) || (phoneParam && phoneParam === cleanPhone(booking.captainPhone));
        return NextResponse.json({ success: true, booking: allowed ? booking.toJSON() : publicBookingView(booking) });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * PATCH /api/bookings/:id  (admin only)
 * Collect cash (`collectedCash`), mark played, adjust details. Money status is derived from amounts.
 */
export async function PATCH(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { id } = await params;
        const { body: raw, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        const { data: body, error: inputError } = validate(raw, BOOKING_UPDATE_SCHEMA, { partial: true });
        if (inputError) return badRequest(inputError);
        await connectToDatabase();
        const booking = await findBooking(id);
        if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        if (booking.paymentStatus === 'cancelled') return NextResponse.json({ error: 'This booking is cancelled.' }, { status: 400 });

        const cash = Number(body.collectedCash || 0);
        if (cash > 0) {
            booking.advanceAmount = Math.min(booking.totalPrice, (booking.advanceAmount || 0) + cash);
            booking.paidAt = new Date();
            if (body.paymentMethod) booking.paymentMethod = body.paymentMethod;
            else if (booking.paymentMethod === 'pay_at_turf') booking.paymentMethod = 'cash';
        }
        if (body.advanceAmount !== undefined && !Number.isNaN(Number(body.advanceAmount))) {
            booking.advanceAmount = Math.min(booking.totalPrice, Math.max(0, Number(body.advanceAmount)));
        }
        const requested = body.paymentStatus || body.status;
        if (requested === 'paid_full') {
            // Explicit "settled in full": the remaining due is being collected now
            booking.advanceAmount = booking.totalPrice;
            booking.paidAt = new Date();
        } else if (requested === 'needs_refund') {
            booking.paymentStatus = 'needs_refund';
        }
        booking.dueAmount = Math.max(0, booking.totalPrice - (booking.advanceAmount || 0));
        if (booking.paymentStatus !== 'needs_refund') booking.paymentStatus = statusFromPayment(booking.advanceAmount || 0, booking.totalPrice);

        if (body.played !== undefined) booking.played = Boolean(body.played);
        if (body.notes !== undefined) booking.notes = String(body.notes).trim();
        if (body.transactionId) booking.transactionId = String(body.transactionId).trim();
        if (body.captainName) booking.captainName = String(body.captainName).trim();
        if (body.captainPhone) booking.captainPhone = cleanPhone(body.captainPhone) || String(body.captainPhone).trim();
        if (body.teamName) booking.teamName = String(body.teamName).trim();
        if (body.paymentMethod && cash <= 0) booking.paymentMethod = body.paymentMethod;

        await booking.save();
        return NextResponse.json({ success: true, message: 'Booking updated successfully', booking: booking.toJSON() });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * DELETE /api/bookings/:id  -> cancel
 * Admin: any time. Owner: only before the cancellation window closes.
 * Any money already collected goes to the refund queue.
 */
export async function DELETE(request, { params }) {
    try {
        const { user, denied } = await requireAuth(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        const booking = await findBooking(id);
        if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        if (booking.paymentStatus === 'cancelled') return NextResponse.json({ success: true, message: 'Booking already cancelled', booking: booking.toJSON() });

        const isAdmin = user.role === 'admin';
        if (!isAdmin) {
            if (!ownsBooking(user, booking)) return NextResponse.json({ error: 'You can only cancel your own bookings.' }, { status: 403 });
            const { cancellationHours } = await loadPricing();
            const hoursLeft = (kickoffDate(booking.date, booking.startTime).getTime() - Date.now()) / 36e5;
            if (hoursLeft < cancellationHours) {
                return NextResponse.json({ error: `Online cancellation closes ${cancellationHours} hours before kick-off. Please call the arena desk.` }, { status: 400 });
            }
        }

        let refund = null;
        const paid = booking.advanceAmount || 0;
        if (paid > 0 && booking.paymentStatus !== 'pending_payment') {
            refund = await Refund.create({
                bookingId: String(booking._id),
                bookingCode: booking.bookingCode,
                customerName: booking.captainName,
                customerPhone: booking.captainPhone,
                amount: paid,
                reason: isAdmin ? 'arena_cancelled' : 'player_cancelled',
                refundMethod: ['bkash', 'nagad', 'rocket'].includes(booking.paymentMethod) ? booking.paymentMethod : 'bkash',
                status: 'pending',
                requestDate: new Date().toISOString().split('T')[0],
                recordedBy: isAdmin ? (user.name || 'Admin Desk') : 'Customer (online)'
            });
        }

        booking.paymentStatus = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancelledBy = isAdmin ? `admin:${user.name || ''}` : `customer:${cleanPhone(user.phone)}`;
        await booking.save();

        return NextResponse.json({
            success: true,
            message: refund ? `Booking cancelled. ৳${paid.toLocaleString()} sent to the refund queue.` : 'Booking cancelled successfully',
            booking: booking.toJSON(),
            refund: refund ? refund.toJSON() : null
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
