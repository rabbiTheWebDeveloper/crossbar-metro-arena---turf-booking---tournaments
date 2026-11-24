import { NextResponse } from 'next/server';
import { publicBaseUrl } from '@/lib/sslcommerz';
import {
    verifyAndConfirmEpsPayment,
    markEpsPaymentFailedOrCancelled
} from '@/service/eps-service';

async function extractCallbackParams(request) {
    const url = new URL(request.url);
    const sp = url.searchParams;
    let bodyParams = {};

    if (request.method === 'POST') {
        const ct = request.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
            bodyParams = await request.json().catch(() => ({}));
        } else {
            const fd = await request.formData().catch(() => null);
            if (fd) {
                for (const [k, v] of fd.entries()) bodyParams[k] = String(v);
            }
        }
    }

    const pick = (...keys) => {
        for (const k of keys) {
            const v = sp.get(k) ?? bodyParams[k];
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }
        return '';
    };

    return {
        status: pick('status', 'Status').toLowerCase(),
        merchantTransactionId: pick('merchantTransactionId', 'MerchantTransactionId', 'tranId', 'tran_id'),
        epsTransactionId: pick('EPSTransactionId', 'epsTransactionId', 'EpsTransactionId', 'TransactionId')
    };
}

async function handleEpsCallback(request) {
    const base = publicBaseUrl(request.url);
    const redirect = (params) =>
        NextResponse.redirect(`${base}/booking?${new URLSearchParams(params).toString()}`, 303);

    try {
        const { status, merchantTransactionId, epsTransactionId } = await extractCallbackParams(request);
        const tranId = merchantTransactionId || epsTransactionId;

        if (status === 'cancel' || status === 'cancelled' || status === 'fail' || status === 'failed') {
            await markEpsPaymentFailedOrCancelled({
                merchantTransactionId: tranId,
                status
            });
            return redirect({
                payment: status.startsWith('cancel') ? 'cancelled' : 'failed',
                gateway: 'eps',
                tranId
            });
        }

        if (status === 'success' || (!status && tranId)) {
            // ALWAYS verify directly with EPS server — never trust callback params alone
            const result = await verifyAndConfirmEpsPayment({
                merchantTransactionId,
                epsTransactionId,
                source: 'callback'
            });

            if (result.ok) {
                return redirect({
                    payment: 'success',
                    gateway: 'eps',
                    bookingCode: result.booking.bookingCode,
                    tranId: result.booking.epsTransactionId || tranId
                });
            }
            if (result.code === 'slot_lost') {
                return redirect({ payment: 'slot_lost', gateway: 'eps', tranId });
            }
            if (result.code === 'not_found') {
                return redirect({ payment: 'error', gateway: 'eps', reason: 'unknown_transaction', tranId });
            }
            return redirect({ payment: 'failed', gateway: 'eps', reason: 'validation_failed', tranId });
        }

        return redirect({ payment: 'unknown', gateway: 'eps', tranId });
    } catch (err) {
        console.error('EPS Callback Handler Error:', err);
        return redirect({ payment: 'error', gateway: 'eps', reason: 'server_error' });
    }
}

export async function GET(request) {
    return handleEpsCallback(request);
}

export async function POST(request) {
    return handleEpsCallback(request);
}
