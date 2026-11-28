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
import { actorId, stampCreate, stampUpdate } from '@/lib/audit';
import { trackCustomer } from '@/lib/customers';
import { publicBaseUrl } from '@/lib/baseUrl';
import { notifyPaymentSuccess } from '@/service/sms-service';

const EPS_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EPS_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEpsConfigValues(cfg) {
    if (!cfg.username || !cfg.password || !cfg.hashKey || !cfg.merchantId || !cfg.storeId) {
        return 'Missing one or more required EPS credentials (username, password, hashKey, merchantId, storeId).';
    }
    if (!EPS_EMAIL_RE.test(cfg.username)) {
        return 'EPS User Name must be a valid email address.';
    }
    if (!EPS_UUID_RE.test(cfg.merchantId)) {
        return `EPS Merchant ID is ${cfg.merchantId.length} characters instead of a valid 36-character UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).`;
    }
    if (!EPS_UUID_RE.test(cfg.storeId)) {
        return `EPS Store ID is ${cfg.storeId.length} characters instead of a valid 36-character UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). Check for missing characters when copying from EPS.`;
    }
    return '';
}

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

    const base = { username, password, hashKey, merchantId, storeId, sandbox };
    const missingFields = [
        !username && 'EPS_USERNAME',
        !password && 'EPS_PASSWORD',
        !hashKey && 'EPS_HASH_KEY',
        !merchantId && 'EPS_MERCHANT_ID',
        !storeId && 'EPS_STORE_ID'
    ].filter(Boolean);
    const hasAll = missingFields.length === 0;
    const configError = hasAll ? validateEpsConfigValues(base) : '';

    return {
        ...base,
        configured: hasAll && !configError,
        hasAnyValues: Boolean(username || password || hashKey || merchantId || storeId),
        missingFields,
        configError,
        source: dbHasAny ? 'db' : 'env'
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
    let client;
    try {
        // The SDK requires merchantId/storeId to be UUIDs - EPS's server also parses them as
        // System.Guid, so a non-UUID value can never work.
        client = new EPS({
            username: cfg.username,
            password: cfg.password,
            hashKey: cfg.hashKey,
            merchantId: cfg.merchantId,
            storeId: cfg.storeId,
            sandbox: cfg.sandbox
        });
    } catch (err) {
        if (err instanceof EPSError && err.code === 'INVALID_CONFIG') {
            // Config comes from Admin Settings (DB) first, then .env - say where to fix it.
            throw new Error(`EPS gateway config is invalid: ${err.message}. Fix it in Admin Settings -> EPS Payment Gateway (or EPS_* in .env).`);
        }
        throw err;
    }
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
    }).catch((err) => {
        // EPS often answers 400 with a validation body (e.g. ASP.NET `errors`) that the SDK
        // reduces to "Request failed with status code 400" - log and surface the real reason.
        const body = err?.response;
        if (body) console.error('EPS initialize response body:', JSON.stringify(body, null, 2));
        const detail = typeof body === 'string'
            ? body
            : body?.errors
                ? Object.entries(body.errors).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join('; ')
                : (body?.title || body?.ErrorMessage || body?.errorMessage || '');
        if (detail) throw new Error(`EPS rejected the payment request: ${detail}`);
        throw err;
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
    const initiatorLabel = booking.createdBy || `${booking.captainName || 'Customer'} (Online)`;
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
        notes: `EPS checkout initiated (${config.sandbox ? 'sandbox' : 'live'})`,
        userId: booking.userId || '',
        createdBy: initiatorLabel,
        updatedBy: initiatorLabel,
        createdById: booking.createdById || '',
        updatedById: booking.updatedById || ''
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
export async function verifyAndConfirmEpsPayment({ merchantTransactionId, epsTransactionId, source = 'callback', actor = null }) {
    if (!merchantTransactionId && !epsTransactionId) {
        return { ok: false, code: 'not_found', message: 'Missing transaction id' };
    }

    await connectToDatabase();
    const verifyFallback = source === 'admin_verify' ? 'Admin Verify' : 'EPS Gateway';
    const verifyAudit = stampUpdate(actor, { fallback: verifyFallback });

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
                errorMessage: verification?.ErrorMessage || `EPS status: ${epsStatus || 'unknown'}`,
                ...verifyAudit
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
                errorMessage: reason,
                ...verifyAudit
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
        source: 'online_booking',
        actor
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
                notes: `${booking.notes ? booking.notes + ' · ' : ''}EPS verified (${financialEntity}, ${source})`,
                ...verifyAudit
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
            notes: `EPS verified (${source})`,
            ...verifyAudit
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
            notes: `EPS verified (${source})`,
            ...stampCreate(actor, { fallback: verifyFallback, userId: booking.userId || actorId(actor) })
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
            recordedBy: 'EPS Payment Gateway',
            ...stampCreate(actor, { fallback: 'EPS Payment Gateway', userId: booking.userId || actorId(actor) })
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
                    notes: 'Paid via EPS after hold expired; slot no longer available. Refund queued.',
                    ...verifyAudit
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

    // Send payment success SMS, booking confirmation email, and schedule 15-min pre-match reminder SMS
    await notifyPaymentSuccess(updated, {
        paidAmount: paid,
        customerEmail: verification.CustomerEmail || '',
        gateway: financialEntity ? `EPS (${financialEntity})` : 'EPS'
    }).catch((err) => console.error('EPS post-payment notify failed:', err?.message || err));

    return { ok: true, code: 'confirmed', booking: updated, verification };
}

/**
 * Release the pending hold and mark the EPS Payment record as failed or cancelled.
 */
export async function markEpsPaymentFailedOrCancelled({ merchantTransactionId, status = 'failed' }) {
    if (!merchantTransactionId) return;
    await connectToDatabase();
    const s = String(status || 'failed').toLowerCase();
    const isCancel = s === 'cancel' || s === 'cancelled';
    const isReject = s === 'reject' || s === 'rejected' || s === 'declined';

    await Booking.updateOne(
        { gatewayTranId: merchantTransactionId, paymentStatus: 'pending_payment' },
        {
            $set: {
                paymentStatus: 'cancelled',
                updatedBy: 'EPS Gateway',
                notes: isCancel
                    ? 'EPS payment cancelled by customer'
                    : isReject
                        ? 'EPS payment rejected at gateway'
                        : 'EPS payment failed at gateway'
            }
        }
    );

    await updatePaymentByMerchantTranId(merchantTransactionId, {
        status: isCancel ? 'cancelled' : 'failed',
        updatedBy: 'EPS Gateway',
        errorMessage: isCancel
            ? 'Cancelled by customer'
            : isReject
                ? 'Payment rejected at EPS gateway'
                : 'Payment failed at EPS gateway'
    });
}
