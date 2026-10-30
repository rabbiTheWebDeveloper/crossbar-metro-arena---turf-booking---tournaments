/**
 * SSLCommerz Gateway Helper for Crossbar Metro Arena
 * Supports official Sandbox & Production environments with server validation.
 * Credentials come only from the environment; there are no built-in fallbacks.
 */

const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== 'false';

const SSL_CONFIG = {
    storeId: process.env.SSLCOMMERZ_STORE_ID || '',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
    isSandbox,
    sessionApiUrl: isSandbox
        ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php',
    validationApiUrl: isSandbox
        ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
        : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
};

/** The public origin used for gateway redirects. Never taken from a request body. */
export function publicBaseUrl(requestUrl) {
    const env = (process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || '').trim().replace(/\/+$/, '');
    if (env && /^https?:\/\//.test(env)) return env;
    if (requestUrl) {
        const u = new URL(requestUrl);
        return `${u.protocol}//${u.host}`;
    }
    return 'http://localhost:3000';
}

export function isGatewayConfigured() {
    return Boolean(SSL_CONFIG.storeId && SSL_CONFIG.storePassword);
}

/**
 * Initiates an SSLCommerz payment session.
 * Only the transaction id travels through the gateway; all booking data stays in our database.
 */
export async function initiateSSLSession({ totalAmount, tranId, customerName, customerPhone, customerEmail, productName = 'Turf Slot Booking', baseUrl }) {
    if (!isGatewayConfigured()) {
        throw new Error('Online payment is not configured yet. Please pay at the arena counter or contact the desk.');
    }
    const host = baseUrl || publicBaseUrl();

    const params = new URLSearchParams({
        store_id: SSL_CONFIG.storeId,
        store_passwd: SSL_CONFIG.storePassword,
        total_amount: Number(totalAmount).toFixed(2),
        currency: 'BDT',
        tran_id: tranId,
        success_url: `${host}/api/payment/sslcommerz/callback?status=success`,
        fail_url: `${host}/api/payment/sslcommerz/callback?status=fail`,
        cancel_url: `${host}/api/payment/sslcommerz/callback?status=cancel`,
        ipn_url: `${host}/api/payment/sslcommerz/ipn`,
        shipping_method: 'NO',
        product_name: productName,
        product_category: 'Sports & Entertainment',
        product_profile: 'general',
        cus_name: customerName || 'Arena Customer',
        cus_email: customerEmail || 'customer@bookcrossbar.com',
        cus_add1: 'Uttara',
        cus_city: 'Dhaka',
        cus_postcode: '1230',
        cus_country: 'Bangladesh',
        cus_phone: customerPhone || '',
        value_a: tranId
    });

    const response = await fetch(SSL_CONFIG.sessionApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });
    const data = await response.json();

    if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
        throw new Error(data.failedreason || 'Failed to initialize SSLCommerz gateway session.');
    }
    return { success: true, gatewayUrl: data.GatewayPageURL, sessionkey: data.sessionkey, tranId };
}

/**
 * Validates a completed SSLCommerz transaction using the validation API.
 * Returns the raw validation payload (status, tran_id, amount, currency, card_type, bank_tran_id, ...).
 */
export async function validateSSLTransaction({ valId }) {
    if (!valId) throw new Error('val_id is required for SSLCommerz transaction validation.');
    if (!isGatewayConfigured()) throw new Error('SSLCommerz store credentials are not configured.');
    const url = `${SSL_CONFIG.validationApiUrl}?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(SSL_CONFIG.storeId)}&store_passwd=${encodeURIComponent(SSL_CONFIG.storePassword)}&v=1&format=json`;
    const response = await fetch(url, { method: 'GET' });
    return response.json();
}

/**
 * Checks a validation payload against what we expect for a transaction.
 * Returns null when everything matches, otherwise a reason string.
 */
export function verifyValidation(validation, { tranId, amount }) {
    if (!validation) return 'No validation response';
    if (!['VALID', 'VALIDATED'].includes(validation.status)) return `Gateway status ${validation.status || 'unknown'}`;
    if (String(validation.tran_id) !== String(tranId)) return 'Transaction id mismatch';
    if ((validation.currency || 'BDT') !== 'BDT') return `Unexpected currency ${validation.currency}`;
    const paid = Number(validation.amount);
    if (Number.isNaN(paid) || Math.abs(paid - Number(amount)) > 0.5) return `Amount mismatch (expected ${amount}, gateway reported ${validation.amount})`;
    return null;
}

export { SSL_CONFIG };
