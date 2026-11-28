import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { applyUpdateAudit, stampCreate, stampCreateAuditOnly } from '@/lib/audit';
import { connectToDatabase } from '@/lib/mongodb';
import { readJson, badRequest, errorResponse } from '@/lib/validate';
import { Customer } from '@/models/customer-model';
import { User } from '@/models/user-model';
import { listCustomers, customerOverview } from '@/lib/customers';
import { parseCustomerInput } from '@/lib/customerMeta';
import { safeSendWelcomeEmail } from '@/utils/mail';

/**
 * GET /api/customers  (admin, or staff with the "players" permission)
 * Query: q (name, mobile, email, area, tag), source, account=with|without, page, limit
 * -> { customers: [{ ...customer, stats }], total, page, pages, limit, overview }
 */
export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, 'players');
        if (denied) return denied;
        await connectToDatabase();

        const sp = new URL(request.url).searchParams;
        const [list, overview] = await Promise.all([
            listCustomers({
                q: sp.get('q') || '',
                source: sp.get('source') || '',
                account: sp.get('account') || '',
                page: sp.get('page'),
                limit: sp.get('limit')
            }),
            customerOverview()
        ]);
        return NextResponse.json({ success: true, ...list, overview });
    } catch (err) {
        return errorResponse(err, 'GET /api/customers');
    }
}

/**
 * POST /api/customers - add one customer by hand.
 * Body: { name, phone, email?, playingPosition?, area?, notes?, tags? }
 * (Customers also appear on their own from sign-ups, bookings, registrations and shop orders.)
 */
export async function POST(request) {
    try {
        const { user: actor, denied } = await requirePermission(request, 'players');
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error } = parseCustomerInput(body, { partial: false });
        if (error) return badRequest(error);

        const loginPassword = typeof body.password === 'string' ? body.password : '';
        if (loginPassword && loginPassword.length < 6) {
            return badRequest('Login password must be at least 6 characters.');
        }
        if (loginPassword.length > 100) {
            return badRequest('Login password is too long.');
        }

        await connectToDatabase();
        const existing = await Customer.findOne({ phone: data.phone }).select('name');
        if (existing) {
            return NextResponse.json({ error: `${existing.name} is already in the customer list with that mobile number.`, existingId: String(existing._id) }, { status: 409 });
        }

        // Link to an existing login account on this phone, or create one when a password was given
        let userId = '';
        let createdLogin = false;
        const existingUser = await User.findOne({ phone: data.phone });
        if (existingUser) {
            userId = String(existingUser._id);
        } else if (loginPassword) {
            const newUser = new User({
                name: data.name,
                phone: data.phone,
                email: data.email || `${data.phone}@bookcrossbar.com`,
                password: loginPassword,
                role: 'player',
                disabled: false,
                ...stampCreate(actor, { fallback: 'Admin Desk' })
            });
            await newUser.save();
            userId = String(newUser._id);
            createdLogin = true;
        }

        const customer = await Customer.create({
            ...data,
            userId,
            source: 'manual',
            sources: ['manual'],
            lastActivityAt: new Date(),
            ...stampCreateAuditOnly(actor, 'Admin Desk')
        });
        await safeSendWelcomeEmail({
            toEmail: customer.email,
            fullName: customer.name,
            role: 'customer',
            phone: customer.phone
        });
        return NextResponse.json({
            success: true,
            message: createdLogin
                ? `${customer.name} was added with Customer Panel login enabled.`
                : `${customer.name} was added to the customer list.`,
            customer: customer.toJSON()
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/customers');
    }
}
