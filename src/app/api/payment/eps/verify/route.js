import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { readJson, errorResponse } from '@/lib/validate';
import { verifyAndConfirmEpsPayment } from '@/service/eps-service';

/**
 * POST /api/payment/eps/verify  (admin / staff with bookings or finance permission)
 * Manually re-verifies an EPS transaction against EPS's server and updates booking + payment status.
 */
export async function POST(request) {
    try {
        const { denied } = await requirePermission(request, ['bookings', 'finance']);
        if (denied) return denied;

        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const merchantTransactionId = String(body.merchantTransactionId || body.tranId || '').trim();
        const epsTransactionId = String(body.epsTransactionId || '').trim();
        if (!merchantTransactionId && !epsTransactionId) {
            return NextResponse.json(
                { error: 'merchantTransactionId or epsTransactionId is required.' },
                { status: 400 }
            );
        }

        const result = await verifyAndConfirmEpsPayment({
            merchantTransactionId,
            epsTransactionId,
            source: 'admin_verify'
        });

        return NextResponse.json({
            success: result.ok,
            code: result.code,
            message: result.ok
                ? (result.code === 'already_confirmed' ? 'Payment was already verified and confirmed.' : 'Payment verified with EPS and booking confirmed!')
                : (result.message || 'EPS did not report a successful payment.'),
            booking: result.booking ? result.booking.toJSON() : null,
            verification: result.verification || null
        }, { status: result.ok ? 200 : 400 });
    } catch (err) {
        return errorResponse(err, 'POST /api/payment/eps/verify');
    }
}
