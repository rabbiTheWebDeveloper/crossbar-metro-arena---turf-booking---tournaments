import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/apiAuth';
import { applyUpdateAudit } from '@/lib/audit';
import { connectToDatabase } from '@/lib/mongodb';
import { readJson, badRequest, errorResponse } from '@/lib/validate';
import { Customer } from '@/models/customer-model';
import { ensureCustomerForUser, getCustomerSettings, saveCustomerSettings } from '@/lib/customers';
import { sanitizeCustomerSettings } from '@/lib/customerMeta';

const present = (settings) => ({
    preferredChannel: settings.preferredChannel,
    notifications: settings.notifications,
    bookingDefaults: settings.bookingDefaults
});

const noCustomer = () => NextResponse.json({ error: 'Could not find your customer record. Please log out and sign in again.' }, { status: 404 });

/**
 * GET /api/customer/settings  (signed-in customer account)
 * -> { customer, settings } for the caller. A customer record is created on first use for accounts that
 * pre-date the customer list; settings fall back to the defaults until the customer saves their own.
 */
export async function GET(request) {
    try {
        const { user, denied } = await requireRole(request, ['player']);
        if (denied) return denied;
        await connectToDatabase();

        const customer = await ensureCustomerForUser(user);
        if (!customer) return noCustomer();
        const settings = await getCustomerSettings(customer.id);
        return NextResponse.json({ success: true, customer: customer.toJSON(), settings: present(settings) });
    } catch (err) {
        return errorResponse(err, 'GET /api/customer/settings');
    }
}

/**
 * PUT /api/customer/settings
 * Body: { settings?: { preferredChannel, notifications, bookingDefaults }, profile?: { area } }
 * Only the caller's own record is ever touched; name, email and position are changed through /api/auth/me.
 */
export async function PUT(request) {
    try {
        const { user, denied } = await requireRole(request, ['player']);
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        await connectToDatabase();

        const customer = await ensureCustomerForUser(user);
        if (!customer) return noCustomer();

        let settings = await getCustomerSettings(customer.id);
        if (body.settings !== undefined) {
            const { value, error } = sanitizeCustomerSettings(body.settings, settings);
            if (error) return badRequest(error);
            settings = await saveCustomerSettings(customer.id, value, user);
        }

        if (body.profile && body.profile.area !== undefined) {
            const area = String(body.profile.area || '').trim().replace(/\s+/g, ' ');
            if (area.length > 80) return badRequest('Area must be at most 80 characters.');
            customer.area = area;
            applyUpdateAudit(customer, user, { fallback: 'Customer' });
            await customer.save();
        }

        return NextResponse.json({ success: true, message: 'Your settings were saved.', customer: customer.toJSON(), settings: present(settings) });
    } catch (err) {
        return errorResponse(err, 'PUT /api/customer/settings');
    }
}
