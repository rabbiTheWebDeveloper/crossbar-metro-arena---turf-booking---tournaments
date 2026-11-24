import { NextResponse } from 'next/server';
import { requirePermission, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { readJson, badRequest, errorResponse } from '@/lib/validate';
import { Customer } from '@/models/customer-model';
import { CustomerSetting } from '@/models/customer-setting-model';
import { User } from '@/models/user-model';
import { customerStats, customerHistory, getCustomerSettings } from '@/lib/customers';
import { parseCustomerInput } from '@/lib/customerMeta';
import { safeSendWelcomeEmail } from '@/utils/mail';

const notFound = () => NextResponse.json({ error: 'Customer not found.' }, { status: 404 });

/** GET /api/customers/:id - the customer with their activity, history, preferences and linked login. */
export async function GET(request, { params }) {
    try {
        const { denied } = await requirePermission(request, 'players');
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return notFound();
        await connectToDatabase();

        const customer = await Customer.findById(id);
        if (!customer) return notFound();

        const [stats, history, settings, account] = await Promise.all([
            customerStats([customer.phone]),
            customerHistory(customer.phone),
            getCustomerSettings(customer.id),
            isObjectId(customer.userId) ? User.findById(customer.userId).select('role disabled createdAt').lean() : null
        ]);
        return NextResponse.json({
            success: true,
            customer: { ...customer.toJSON(), stats: stats.get(customer.phone) },
            history,
            settings: { preferredChannel: settings.preferredChannel, notifications: settings.notifications, bookingDefaults: settings.bookingDefaults },
            account: account ? { id: String(account._id), role: account.role, disabled: Boolean(account.disabled), createdAt: account.createdAt } : null
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/customers/[id]');
    }
}

/** PATCH /api/customers/:id - edit name, email, position, area, notes, tags. The mobile number cannot change. */
export async function PATCH(request, { params }) {
    try {
        const { denied } = await requirePermission(request, 'players');
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return notFound();
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        await connectToDatabase();
        const customer = await Customer.findById(id);
        if (!customer) return notFound();

        const { data, error } = parseCustomerInput(body, { partial: true, currentPhone: customer.phone });
        if (error) return badRequest(error);

        const loginPassword = typeof body.password === 'string' ? body.password : '';
        if (loginPassword && loginPassword.length < 6) {
            return badRequest('Login password must be at least 6 characters.');
        }
        if (loginPassword.length > 100) {
            return badRequest('Login password is too long.');
        }

        Object.assign(customer, data);

        // Enable Customer Panel login for an existing customer who does not have one yet
        let createdLogin = false;
        if (loginPassword && !isObjectId(customer.userId)) {
            const existingUser = await User.findOne({ phone: customer.phone });
            if (existingUser) {
                customer.userId = String(existingUser._id);
            } else {
                const newUser = new User({
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email || `${customer.phone}@bookcrossbar.com`,
                    password: loginPassword,
                    role: 'player',
                    disabled: false
                });
                await newUser.save();
                customer.userId = String(newUser._id);
                createdLogin = true;
            }
        }

        await customer.save();
        if (createdLogin) {
            await safeSendWelcomeEmail({
                toEmail: customer.email,
                fullName: customer.name,
                role: 'customer',
                phone: customer.phone
            });
        }
        return NextResponse.json({
            success: true,
            message: createdLogin ? 'Customer updated and Customer Panel login created.' : 'Customer updated.',
            customer: customer.toJSON()
        });
    } catch (err) {
        return errorResponse(err, 'PATCH /api/customers/[id]');
    }
}

/**
 * DELETE /api/customers/:id - remove the customer from the list (and their saved preferences).
 * Bookings, registrations, orders and any login account are untouched; the person shows up again the next time
 * they book, register or are picked up by "sync".
 */
export async function DELETE(request, { params }) {
    try {
        const { denied } = await requirePermission(request, 'players');
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return notFound();
        await connectToDatabase();

        const customer = await Customer.findById(id);
        if (!customer) return notFound();
        await Promise.all([
            Customer.deleteOne({ _id: customer._id }),
            CustomerSetting.deleteOne({ customerId: String(customer._id) })
        ]);
        return NextResponse.json({ success: true, deleted: true, message: `${customer.name} was removed from the customer list.` });
    } catch (err) {
        return errorResponse(err, 'DELETE /api/customers/[id]');
    }
}
