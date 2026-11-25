import { NextResponse } from 'next/server';
import { publicBaseUrl } from '@/lib/baseUrl';
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
    const redirectTo = (path, params) => {
        const qs = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
        ).toString();
        return NextResponse.redirect(`${base}${path}${qs ? `?${qs}` : ''}`, 303);
    };

    try {
        const { status, merchantTransactionId, epsTransactionId } = await extractCallbackParams(request);
        const tranId = merchantTransactionId || epsTransactionId;

        if (status === 'cancel' || status === 'cancelled') {
            await markEpsPaymentFailedOrCancelled({ merchantTransactionId: tranId, status: 'cancelled' });
            return redirectTo('/payment/cancelled', { gateway: 'eps', tranId });
        }

        if (status === 'reject' || status === 'rejected' || status === 'declined') {
            await markEpsPaymentFailedOrCancelled({ merchantTransactionId: tranId, status: 'rejected' });
            return redirectTo('/payment/rejected', { gateway: 'eps', tranId, reason: 'rejected' });
        }

        if (status === 'fail' || status === 'failed') {
            await markEpsPaymentFailedOrCancelled({ merchantTransactionId: tranId, status: 'failed' });
            return redirectTo('/payment/failed', { gateway: 'eps', tranId, reason: 'failed' });
        }

        if (status === 'success' || (!status && tranId)) {
            // ALWAYS verify directly with EPS server — never trust callback params alone
            const result = await verifyAndConfirmEpsPayment({
                merchantTransactionId,
                epsTransactionId,
                source: 'callback'
            });

            if (result.ok) {
                return redirectTo('/payment/success', {
                    gateway: 'eps',
                    bookingCode: result.booking.bookingCode,
                    tranId: result.booking.epsTransactionId || tranId
                });
            }
            if (result.code === 'slot_lost') {
                return redirectTo('/payment/failed', { gateway: 'eps', tranId, reason: 'slot_lost' });
            }
            if (result.code === 'not_found') {
                return redirectTo('/payment/failed', { gateway: 'eps', tranId, reason: 'unknown_transaction' });
            }
            const reported = String(result.verification?.Status || '').toLowerCase();
            if (reported.includes('reject') || reported.includes('declin')) {
                return redirectTo('/payment/rejected', { gateway: 'eps', tranId, reason: 'rejected' });
            }
            if (reported.includes('cancel')) {
                return redirectTo('/payment/cancelled', { gateway: 'eps', tranId });
            }
            return redirectTo('/payment/failed', { gateway: 'eps', tranId, reason: 'validation_failed' });
        }

        return redirectTo('/payment/failed', { gateway: 'eps', tranId, reason: 'unknown_transaction' });
    } catch (err) {
        console.error('EPS Callback Handler Error:', err);
        return redirectTo('/payment/failed', { gateway: 'eps', reason: 'server_error' });
    }
}

export async function GET(request) {
    return handleEpsCallback(request);
}

export async function POST(request) {
    return handleEpsCallback(request);
}
