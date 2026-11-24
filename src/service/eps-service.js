import { EPS, EPSError, TransactionType, generateTransactionId } from 'eps-gateway-nodejs';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/setting-model';
import { Booking } from '@/models/booking-model';
import { Refund } from '@/models/refund-model';
import {
    createPaymentRecord,
    updatePaymentByMerchantTranId,
    findPaymentByMerchantTranId
} from '@/queries/payment-queries';
import { mapGatewayMethod, statusFromPayment } from '@/lib/booking';
import { trackCustomer } from '@/lib/customers';
import { publicBaseUrl } from '@/lib/sslcommerz';

/**
 * Load EPS gateway configuration from MongoDB Setting first, falling back to environment variables.
 * Never hardcodes credentials in source.
 */
export async function getEpsConfig() {
    let doc = null;
    try {
        await connectToDatabase();
        doc = await Setting.findOne().select('epsUsername epsPassword epsHashKey epsMerchantId epsStoreId epsSandbox').lean();
    } catch {
        // Fallback cleanly to env vars if DB is unavailable
    }

    const dbHasAny = Boolean(doc && (doc.epsUsername || doc.epsMerchantId || doc.epsStoreId));
    const username = (doc?.epsUsername || process.env.EPS_USERNAME || '').trim();
    const password = (doc?.epsPassword || process.env.EPS_PASSWORD || '').trim();
    const hashKey = (doc?.epsHashKey || process.env.EPS_HASH_KEY || '').trim();
    const merchantId = (doc?.epsMerchantId || process.env.EPS_MERCHANT_ID || '').trim();
    const storeId = (doc?.epsStoreId || process.env.EPS_STORE_ID || '').trim();
    const sandbox = dbHasAny
        ? Boolean(doc.epsSandbox)
        : process.env.EPS_SANDBOX !== 'false';

    return {
        username,
        password,
        hashKey,
        merchantId,
        storeId,
        sandbox,
        configured: Boolean(username && password && hashKey && merchantId && storeId)
    };
}

export async function isEpsConfigured() {
    const cfg = await getEpsConfig();
    return cfg.configured;
}

export async function createEpsClient() {
    const cfg = await getEpsConfig();
    if (!cfg.configured) {
        throw new Error('EPS payment gateway is not configured yet. Configure EPS credentials in Admin Settings or .env.');
    }
    const client = new EPS({
        username: cfg.username,
        password: cfg.password,
        hashKey: cfg.hashKey,
        merchantId: cfg.merchantId,
        storeId: cfg.storeId,
        sandbox: cfg.sandbox
    });
    return { client, config: cfg };
}

/**
 * Initiate an EPS payment session for a pending booking hold and log an `initiated` Payment record.
 */
export async function initiateEpsBookingPayment({
    booking,
    payableAmount,
    customerEmail,
    baseUrl,
    ipAddress = '127.0.0.1'
}) {
    const { client, config } = await createEpsClient();
    const host = (baseUrl || publicBaseUrl()).replace(/\/+$/, '');
    const merchantTransactionId = generateTransactionId(); // 17-digit timestamp-based ID (EPS requires >= 10 digits)
    const email = (customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
        ? customerEmail
        : `${booking.captainPhone}@bookcrossbar.com`;
    const productName = `Crossbar Metro Slot #${booking.slotNumber} (${booking.date})`;

    const payment = await client.initializePayment({
        customerOrderId: booking.bookingCode,
        merchantTransactionId,
        totalAmount: Number(Number(payableAmount).toFixed(2)),
        transactionTypeId: TransactionType.WEB,
        successUrl: `${host}/api/payment/eps/callback?status=success&merchantTransactionId=${encodeURIComponent(merchantTransactionId)}`,
        failUrl: `${host}/api/payment/eps/callback?status=fail&merchantTransactionId=${encodeURIComponent(merchantTransactionId)}`,
        cancelUrl: `${host}/api/payment/eps/callback?status=cancel&merchantTransactionId=${encodeURIComponent(merchantTransactionId)}`,
        customerName: booking.captainName || 'Arena Customer',
        customerEmail: email,
        customerPhone: booking.captainPhone,
        customerAddress: 'Uttara Metro Center, Sector 17',
        customerAddress2: 'Uttara',
        customerCity: 'Dhaka',
        customerState: 'Dhaka',
        customerPostcode: '1230',
        customerCountry: 'BD',
        productName,
        productProfile: 'general',
        productCategory: 'Sports & Turf Booking',
        noOfItem: 1,
        shippingMethod: 'NO',
        ipAddress,
        valueA: booking.bookingCode,
        valueB: String(booking._id),
        valueC: booking.date,
        valueD: String(booking.slotNumber)
    });

    if (!payment?.RedirectURL) {
        throw new Error(payment?.ErrorMessage || 'EPS gateway did not return a payment redirect URL.');
    }

    const epsTransactionId = String(payment.TransactionId || '');

    // Attach EPS transaction identifiers to the pending booking
    booking.paymentGateway = 'eps';
    booking.gatewayTranId = merchantTransactionId;
    booking.transactionId = merchantTransactionId;
    booking.epsTransactionId = epsTransactionId;
    await booking.save();

    // Persist an initiated Payment record (EPS best practice)
    await createPaymentRecord({
        bookingId: String(booking._id),
        bookingCode: booking.bookingCode,
        merchantTransactionId,
        gatewayTransactionId: epsTransactionId,
        gateway: 'eps',
        status: 'initiated',
        amount: Number(payableAmount),
        currency: 'BDT',
        paymentMethod: 'eps',
        customerName: booking.captainName,
        customerPhone: booking.captainPhone,
        customerEmail: email,
        teamName: booking.teamName,
        slotDate: booking.date,
        slotNumber: booking.slotNumber,
        slotDisplay: booking.displayTime,
        sandbox: config.sandbox,
        notes: `EPS checkout initiated (${config.sandbox ? 'sandbox' : 'live'})`
    });

    return {
        redirectUrl: payment.RedirectURL,
        merchantTransactionId,
        epsTransactionId,
        sandbox: config.sandbox
    };
}

/**
 * Always verify the EPS payment directly with EPS's server before confirming a booking.
 * Safe to call multiple times (idempotent across callback / manual admin re-verify).
 */
export async function verifyAndConfirmEpsPayment({ merchantTransactionId, epsTransactionId, source = 'callback' }) {
    if (!merchantTransactionId && !epsTransactionId) {
        return { ok: false, code: 'not_found', message: 'Missing transaction id' };
    }

    await connectToDatabase();

    let booking = null;
    if (merchantTransactionId) {
        booking = await Booking.findOne({ gatewayTranId: merchantTransactionId });
    }
    if (!booking && epsTransactionId) {
        booking = await Booking.findOne({ epsTransactionId });
    }
    if (!booking) {
        return { ok: false, code: 'not_found', message: 'No booking matches this EPS transaction.' };
    }

    const mTranId = merchantTransactionId || booking.gatewayTranId;

    // Already confirmed idempotency check
    if (['paid_advance', 'paid_full'].includes(booking.paymentStatus) && booking.gatewayValId) {
        return { ok: true, code: 'already_confirmed', booking };
    }

    let verification;
    try {
        const { client } = await createEpsClient();
        verification = mTranId
            ? await client.verifyPayment({ merchantTransactionId: mTranId })
            : await client.verifyPayment({ epsTransactionId: epsTransactionId || booking.epsTransactionId });
    } catch (err) {
        const msg = err instanceof EPSError ? `${err.code}: ${err.message}` : err.message;
        return { ok: false, code: 'invalid', booking, message: `EPS verification call failed: ${msg}` };
    }

    const epsStatus = String(verification?.Status || '').trim();
    const isSuccess = epsStatus.toLowerCase() === 'success';
    if (!isSuccess) {
        const nextPaymentStatus = epsStatus.toLowerCase() === 'pending' ? 'initiated' : 'failed';
        if (mTranId) {
            await updatePaymentByMerchantTranId(mTranId, {
                status: nextPaymentStatus,
                gatewayTransactionId: verification?.EpsTransactionId || booking.epsTransactionId || '',
                financialEntity: verification?.FinancialEntity || '',
                errorCode: verification?.ErrorCode || '',
                errorMessage: verification?.ErrorMessage || `EPS status: ${epsStatus || 'unknown'}`
            });
        }
        return {
            ok: false,
            code: 'invalid',
            booking,
            verification,
            message: verification?.ErrorMessage || `EPS reported status: ${epsStatus || 'Unknown'}`
        };
    }

    const paid = Number(verification.TotalAmount);
    const expected = Number(booking.expectedAmount || 0);
    if (Number.isNaN(paid) || (expected > 0 && Math.abs(paid - expected) > 0.5)) {
        const reason = `Amount mismatch (expected ${expected}, EPS reported ${verification.TotalAmount})`;
        if (mTranId) {
            await updatePaymentByMerchantTranId(mTranId, {
                status: 'failed',
                errorMessage: reason
            });
        }
        return { ok: false, code: 'invalid', booking, verification, message: reason };
    }

    const financialEntity = String(verification.FinancialEntity || 'EPS');
    const method = mapGatewayMethod(financialEntity);
    const verifiedEpsId = String(verification.EpsTransactionId || booking.epsTransactionId || mTranId);

    // Track confirmed customer
    await trackCustomer({
        name: booking.captainName,
        phone: booking.captainPhone,
        email: verification.CustomerEmail || undefined,
        source: 'online_booking'
    });

    const updated = await Booking.findOneAndUpdate(
        { _id: booking._id, paymentStatus: { $in: ['pending_payment', 'cancelled', 'confirmed_unpaid'] } },
        {
            $set: {
                advanceAmount: Math.min(paid, booking.totalPrice),
                dueAmount: Math.max(0, booking.totalPrice - paid),
                paymentStatus: statusFromPayment(paid, booking.totalPrice),
                paymentGateway: 'eps',
                paymentMethod: method,
                transactionId: verifiedEpsId,
                epsTransactionId: verifiedEpsId,
                gatewayValId: verifiedEpsId,
                gatewayCardType: financialEntity,
                paidAt: new Date(),
                holdExpiresAt: null,
                notes: `${booking.notes ? booking.notes + ' · ' : ''}EPS verified (${financialEntity}, ${source})`
            }
        },
        { new: true }
    ).catch((e) => {
        if (e && e.code === 11000) return null;
        throw e;
    });

    // Update or create Payment record
    const existingPayment = mTranId ? await findPaymentByMerchantTranId(mTranId) : null;
    if (existingPayment) {
        await updatePaymentByMerchantTranId(mTranId, {
            status: 'success',
            gatewayTransactionId: verifiedEpsId,
            amount: paid,
            paymentMethod: method,
            financialEntity,
            verifiedAt: new Date(),
            errorCode: '',
            errorMessage: '',
            notes: `EPS verified (${source})`
        });
    } else {
        await createPaymentRecord({
            bookingId: String(booking._id),
            bookingCode: booking.bookingCode,
            merchantTransactionId: mTranId || verifiedEpsId,
            gatewayTransactionId: verifiedEpsId,
            gateway: 'eps',
            status: 'success',
            amount: paid,
            currency: 'BDT',
            paymentMethod: method,
            financialEntity,
            customerName: booking.captainName,
            customerPhone: booking.captainPhone,
            customerEmail: verification.CustomerEmail || '',
            teamName: booking.teamName,
            slotDate: booking.date,
            slotNumber: booking.slotNumber,
            slotDisplay: booking.displayTime,
            verifiedAt: new Date(),
            notes: `EPS verified (${source})`
        });
    }

    if (!updated) {
        const fresh = await Booking.findById(booking._id);
        if (fresh && ['paid_advance', 'paid_full'].includes(fresh.paymentStatus)) {
            return { ok: true, code: 'already_confirmed', booking: fresh, verification };
        }
        // Money arrived after hold expired and another customer took the slot -> queue refund
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
            recordedBy: 'EPS Payment Gateway'
        }).catch((err) => console.error('Refund create failed:', err));

        await Booking.updateOne(
            { _id: booking._id },
            {
                $set: {
                    paymentStatus: 'cancelled',
                    paymentGateway: 'eps',
                    gatewayValId: verifiedEpsId,
                    epsTransactionId: verifiedEpsId,
                    transactionId: verifiedEpsId,
                    gatewayCardType: financialEntity,
                    advanceAmount: paid,
                    notes: 'Paid via EPS after hold expired; slot no longer available. Refund queued.'
                }
            }
        ).catch(() => {});

        return {
            ok: false,
            code: 'slot_lost',
            booking,
            verification,
            message: 'The slot was taken while the payment hold had expired. The amount has been queued for refund.'
        };
    }

    return { ok: true, code: 'confirmed', booking: updated, verification };
}

/**
 * Release the pending hold and mark the EPS Payment record as failed or cancelled.
 */
export async function markEpsPaymentFailedOrCancelled({ merchantTransactionId, status = 'failed' }) {
    if (!merchantTransactionId) return;
    await connectToDatabase();
    const isCancel = status === 'cancel' || status === 'cancelled';

    await Booking.updateOne(
        { gatewayTranId: merchantTransactionId, paymentStatus: 'pending_payment' },
        {
            $set: {
                paymentStatus: 'cancelled',
                notes: isCancel ? 'EPS payment cancelled by customer' : 'EPS payment failed at gateway'
            }
        }
    );

    await updatePaymentByMerchantTranId(merchantTransactionId, {
        status: isCancel ? 'cancelled' : 'failed',
        errorMessage: isCancel ? 'Cancelled by customer' : 'Payment failed at EPS gateway'
    });
}
