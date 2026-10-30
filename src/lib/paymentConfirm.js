import { Booking } from '@/models/Booking';
import { Refund } from '@/models/Refund';
import { validateSSLTransaction, verifyValidation } from '@/lib/sslcommerz';
import { mapGatewayMethod, statusFromPayment } from '@/lib/booking';

/**
 * Confirm a gateway payment for the pending booking identified by tran_id.
 * Shared by the browser callback and the server-to-server IPN so both paths behave identically
 * and the second arrival is a harmless no-op.
 *
 * Returns { ok, code, booking, message }
 *   code: 'confirmed' | 'already_confirmed' | 'not_found' | 'invalid' | 'slot_lost'
 */
export async function confirmGatewayPayment({ tranId, valId, source = 'callback' }) {
    if (!tranId) return { ok: false, code: 'not_found', message: 'Missing transaction id' };

    const booking = await Booking.findOne({ gatewayTranId: tranId });
    if (!booking) return { ok: false, code: 'not_found', message: 'No booking matches this transaction' };

    if (['paid_advance', 'paid_full'].includes(booking.paymentStatus) && booking.gatewayValId) {
        return { ok: true, code: 'already_confirmed', booking };
    }

    // Always validate with SSLCommerz's own server; never trust POST parameters
    let validation;
    try {
        validation = await validateSSLTransaction({ valId });
    } catch (e) {
        return { ok: false, code: 'invalid', booking, message: `Validation call failed: ${e.message}` };
    }
    const problem = verifyValidation(validation, { tranId, amount: booking.expectedAmount });
    if (problem) {
        console.error(`[payment:${source}] rejected ${tranId}: ${problem}`);
        return { ok: false, code: 'invalid', booking, message: problem };
    }

    const paid = Number(validation.amount);
    const method = mapGatewayMethod(validation.card_type || validation.card_issuer);

    // Atomic: only the first confirmation moves the hold to paid. Expired holds are revived here too,
    // since the money has really arrived.
    const updated = await Booking.findOneAndUpdate(
        { _id: booking._id, paymentStatus: { $in: ['pending_payment', 'cancelled', 'confirmed_unpaid'] } },
        {
            $set: {
                advanceAmount: Math.min(paid, booking.totalPrice),
                dueAmount: Math.max(0, booking.totalPrice - paid),
                paymentStatus: statusFromPayment(paid, booking.totalPrice),
                paymentMethod: method,
                transactionId: validation.bank_tran_id || tranId,
                gatewayValId: validation.val_id || valId,
                gatewayCardType: validation.card_type || '',
                paidAt: new Date(),
                holdExpiresAt: null,
                notes: `${booking.notes ? booking.notes + ' · ' : ''}SSLCommerz verified (${source})`
            }
        },
        { new: true }
    ).catch(async (e) => {
        if (e && e.code === 11000) return null; // slot was re-booked while the hold was expired
        throw e;
    });

    if (!updated) {
        const fresh = await Booking.findById(booking._id);
        if (fresh && ['paid_advance', 'paid_full'].includes(fresh.paymentStatus)) {
            return { ok: true, code: 'already_confirmed', booking: fresh };
        }
        // Money arrived for a slot we can no longer give: queue a refund so the desk can return it
        await Refund.create({
            bookingId: String(booking._id),
            bookingCode: booking.bookingCode,
            customerName: booking.captainName,
            customerPhone: booking.captainPhone,
            amount: paid,
            reason: 'slot_unavailable',
            refundMethod: ['bkash', 'nagad', 'rocket'].includes(method) ? method : 'bkash',
            status: 'pending',
            requestDate: new Date().toISOString().split('T')[0],
            recordedBy: 'Payment gateway'
        }).catch(err => console.error('Refund create failed:', err));
        // Keep the record cancelled (so it does not clash with the booking that now holds the slot) but attach the payment trail
        await Booking.updateOne({ _id: booking._id }, { $set: { paymentStatus: 'cancelled', gatewayValId: validation.val_id || valId, transactionId: validation.bank_tran_id || tranId, advanceAmount: paid, notes: 'Paid after hold expired; slot no longer available. Refund queued.' } }).catch(() => { });
        return { ok: false, code: 'slot_lost', booking, message: 'The slot was taken while the payment hold had expired. The amount has been queued for refund.' };
    }

    return { ok: true, code: 'confirmed', booking: updated };
}
