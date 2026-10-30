import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { publicBaseUrl } from '@/lib/sslcommerz';
import { confirmGatewayPayment } from '@/lib/paymentConfirm';

/**
 * SSLCommerz browser redirect (success_url / fail_url / cancel_url).
 * The gateway POSTs form data here, then the customer is sent back to /booking with a status.
 * All booking data is read from our own pending record; nothing from the POST body is trusted
 * except tran_id and val_id, which are verified against SSLCommerz's validation API.
 */
export async function POST(request) {
    const base = publicBaseUrl(request.url);
    const redirect = (params) => NextResponse.redirect(`${base}/booking?${new URLSearchParams(params).toString()}`, 303);

    try {
        const url = new URL(request.url);
        const statusQuery = url.searchParams.get('status');
        const formData = await request.formData();
        const tranId = String(formData.get('tran_id') || '');
        const valId = String(formData.get('val_id') || '');

        await connectToDatabase();

        if (statusQuery === 'cancel' || statusQuery === 'fail') {
            // Release the hold right away so the slot is free again
            await Booking.updateOne(
                { gatewayTranId: tranId, paymentStatus: 'pending_payment' },
                { $set: { paymentStatus: 'cancelled', notes: `Payment ${statusQuery === 'cancel' ? 'cancelled by customer' : 'failed at gateway'}` } }
            );
            return redirect({ payment: statusQuery === 'cancel' ? 'cancelled' : 'failed', tranId });
        }

        if (statusQuery === 'success') {
            const result = await confirmGatewayPayment({ tranId, valId, source: 'callback' });
            if (result.ok) {
                return redirect({ payment: 'success', bookingCode: result.booking.bookingCode, tranId });
            }
            if (result.code === 'slot_lost') return redirect({ payment: 'slot_lost', tranId });
            if (result.code === 'not_found') return redirect({ payment: 'error', reason: 'unknown_transaction', tranId });
            return redirect({ payment: 'failed', reason: 'validation_failed', tranId });
        }

        return redirect({ payment: 'unknown', tranId });
    } catch (err) {
        console.error('SSLCommerz Callback Handler Error:', err);
        return redirect({ payment: 'error', reason: 'server_error' });
    }
}

/** Some gateway configurations hit the callback with GET after a redirect; treat it like a status check. */
export async function GET(request) {
    const base = publicBaseUrl(request.url);
    const url = new URL(request.url);
    const statusQuery = url.searchParams.get('status') || 'unknown';
    const map = { success: 'pending_verification', fail: 'failed', cancel: 'cancelled' };
    return NextResponse.redirect(`${base}/booking?payment=${map[statusQuery] || 'unknown'}`, 303);
}
