import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/setting-model';
import { requirePermission } from '@/lib/apiAuth';
import { readJson, badRequest, errorResponse } from '@/lib/validate';
import { getEpsConfig } from '@/service/eps-service';

// EPS expects an email username and GUID merchant/store IDs.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/settings/payment  (admin / staff with `settings` permission)
 * Returns the active EPS payment gateway configuration for the Admin Settings form.
 */
export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, 'settings');
        if (denied) return denied;

        const cfg = await getEpsConfig();
        return NextResponse.json({
            success: true,
            eps: {
                epsUsername: cfg.username,
                epsPassword: cfg.password,
                epsHashKey: cfg.hashKey,
                epsMerchantId: cfg.merchantId,
                epsStoreId: cfg.storeId,
                epsSandbox: cfg.sandbox,
                configured: cfg.configured
            }
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/settings/payment');
    }
}

/**
 * PUT /api/settings/payment  (admin / staff with `settings` permission)
 * Updates EPS payment gateway settings in MongoDB Setting.
 */
export async function PUT(request) {
    try {
        const { denied } = await requirePermission(request, 'settings');
        if (denied) return denied;

        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const epsUsername = String(body.epsUsername ?? '').trim();
        const epsPassword = String(body.epsPassword ?? '').trim();
        const epsHashKey = String(body.epsHashKey ?? '').trim();
        const epsMerchantId = String(body.epsMerchantId ?? '').trim();
        const epsStoreId = String(body.epsStoreId ?? '').trim();
        const epsSandbox = Boolean(body.epsSandbox);

        if (epsUsername.length > 160) return badRequest('EPS User Name is too long.');
        if (epsPassword.length > 160) return badRequest('EPS Password is too long.');
        if (epsHashKey.length > 300) return badRequest('EPS Hash Key is too long.');
        if (epsMerchantId.length > 120) return badRequest('EPS Merchant ID is too long.');
        if (epsStoreId.length > 120) return badRequest('EPS Store ID is too long.');
        if (epsUsername && !EMAIL_RE.test(epsUsername)) {
            return badRequest('EPS User Name must be an email address.');
        }
        // EPS's server parses merchantId / storeId as System.Guid, so reject anything that is not
        // a full UUID at save time (e.g. a truncated copy-paste) instead of at customer checkout.
        if (epsMerchantId && !UUID_RE.test(epsMerchantId)) {
            return badRequest('EPS Merchant ID must be a full 36-character UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).');
        }
        if (epsStoreId && !UUID_RE.test(epsStoreId)) {
            return badRequest('EPS Store ID must be a full 36-character UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). Ask EPS for the complete ID.');
        }

        await connectToDatabase();
        const settings = await Setting.getOrCreateSettings();
        settings.epsUsername = epsUsername;
        settings.epsPassword = epsPassword;
        settings.epsHashKey = epsHashKey;
        settings.epsMerchantId = epsMerchantId;
        settings.epsStoreId = epsStoreId;
        settings.epsSandbox = epsSandbox;
        await settings.save();

        const cfg = await getEpsConfig();
        return NextResponse.json({
            success: true,
            message: `EPS payment gateway settings saved (${cfg.sandbox ? 'Sandbox Mode' : 'Live Mode'}).`,
            eps: {
                epsUsername: cfg.username,
                epsPassword: cfg.password,
                epsHashKey: cfg.hashKey,
                epsMerchantId: cfg.merchantId,
                epsStoreId: cfg.storeId,
                epsSandbox: cfg.sandbox,
                configured: cfg.configured
            }
        });
    } catch (err) {
        return errorResponse(err, 'PUT /api/settings/payment');
    }
}
