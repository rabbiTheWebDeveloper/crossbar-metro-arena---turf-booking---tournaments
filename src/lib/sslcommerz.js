/**
 * SSLCommerz Gateway Helper for Crossbar Metro Arena
 * Supports official Sandbox & Production environments with server validation.
 */

const SSL_CONFIG = {
    storeId: process.env.SSLCOMMERZ_STORE_ID || 'fajra6aa249a39ddb2',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || 'fajra6aa249a39ddb2@ssl',
    isSandbox: process.env.SSLCOMMERZ_IS_SANDBOX !== 'false',
    sessionApiUrl: process.env.SSLCOMMERZ_IS_SANDBOX !== 'false'
        ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php',
    validationApiUrl: process.env.SSLCOMMERZ_IS_SANDBOX !== 'false'
        ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
        : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
};

/**
 * Initiates an SSLCommerz payment session
 */
export async function initiateSSLSession({
    totalAmount,
    tranId,
    customerName,
    customerPhone,
    customerEmail,
    productName = 'Turf Slot Booking',
    metadata = {},
    baseUrl
}) {
    if (!SSL_CONFIG.storeId || !SSL_CONFIG.storePassword) {
        throw new Error('SSLCommerz store credentials are not configured.');
    }

    const host = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const params = new URLSearchParams({
        store_id: SSL_CONFIG.storeId,
        store_passwd: SSL_CONFIG.storePassword,
        total_amount: String(totalAmount),
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
        cus_email: customerEmail || 'customer@crossbarmetro.com',
        cus_add1: 'Sector 17, Uttara',
        cus_city: 'Dhaka',
        cus_postcode: '1230',
        cus_country: 'Bangladesh',
        cus_phone: customerPhone || '01796-337133',
        value_a: JSON.stringify(metadata)
    });

    const response = await fetch(SSL_CONFIG.sessionApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });

    const data = await response.json();

    if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
        throw new Error(data.failedreason || 'Failed to initialize SSLCommerz gateway session.');
    }

    return {
        success: true,
        gatewayUrl: data.GatewayPageURL,
        sessionkey: data.sessionkey,
        tranId
    };
}

/**
 * Validates a completed SSLCommerz transaction using the validation API
 */
export async function validateSSLTransaction({ valId }) {
    if (!valId) {
        throw new Error('val_id is required for SSLCommerz transaction validation.');
    }

    const url = `${SSL_CONFIG.validationApiUrl}?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(SSL_CONFIG.storeId)}&store_passwd=${encodeURIComponent(SSL_CONFIG.storePassword)}&v=1&format=json`;

    const response = await fetch(url, {
        method: 'GET'
    });

    const data = await response.json();
    return data;
}

export { SSL_CONFIG };
