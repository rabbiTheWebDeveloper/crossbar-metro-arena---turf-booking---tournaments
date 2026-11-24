import { NextResponse } from 'next/server';
import { requirePermission, escapeRegex, cleanPhone, isValidBdPhone } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { readJson, errorResponse } from '@/lib/validate';
import { User } from '@/models/user-model';
import { ACCOUNT_ROLES, VALID_POSITIONS, EMAIL_RE, forbidden, invalid, isPrivileged, findStaffRole, withStaffRoleNames } from '@/lib/userAdmin';
import { syncCustomerFromUser } from '@/lib/customers';
import { safeSendWelcomeEmail } from '@/utils/mail';

/** GET /api/users  (admin, or staff with the players / investors permission) */
export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, ['players', 'investors']);
        if (denied) return denied;
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const search = (searchParams.get('q') || '').slice(0, 60);

        const includeDisabled = searchParams.get('includeDisabled') === '1' || searchParams.get('all') === '1';
        const query = includeDisabled ? {} : { disabled: false };
        if (role && ACCOUNT_ROLES.includes(role)) query.role = role;
        if (search) {
            const re = { $regex: escapeRegex(search), $options: 'i' };
            query.$or = [{ name: re }, { phone: re }];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(includeDisabled ? 500 : 50);

        const list = await withStaffRoleNames(users.map(u => u.toJSON()));
        return NextResponse.json({ success: true, count: list.length, users: list }, { status: 200 });
    }
    catch (err) {
        return errorResponse(err, 'GET /api/users');
    }
}

/**
 * POST /api/users - create an account from the admin portal.
 * Body: { name, phone, password, email?, role?, staffRoleId?, playingPosition? }
 * Admins can create any account type. Staff with the players permission can create player accounts only.
 */
export async function POST(request) {
    try {
        const { user: actor, denied } = await requirePermission(request, 'players');
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const name = String(body.name || '').trim().replace(/\s+/g, ' ');
        if (name.length < 2 || name.length > 100) return invalid('Name must be between 2 and 100 characters.');
        if (!isValidBdPhone(body.phone)) return invalid('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).');
        const phone = cleanPhone(body.phone);
        const password = String(body.password || '');
        if (password.length < 6) return invalid('Password must be at least 6 characters.');
        if (password.length > 100) return invalid('Password is too long.');
        const email = String(body.email || '').trim().toLowerCase();
        if (email && (!EMAIL_RE.test(email) || email.length > 120)) return invalid('Enter a valid email address.');

        const role = body.role === undefined || body.role === '' ? 'player' : String(body.role);
        if (!ACCOUNT_ROLES.includes(role) || role === 'visitor') return invalid('Choose a valid account type.');
        if (actor.role !== 'admin' && role !== 'player') return forbidden('Only an admin can create investor, staff or admin accounts.');

        await connectToDatabase();

        let staffRoleId = '';
        if (role === 'staff') {
            const staffRole = await findStaffRole(body.staffRoleId);
            if (!staffRole) return invalid('Choose a staff role for this account.');
            staffRoleId = String(staffRole._id);
        }

        if (await User.findOne({ phone })) return invalid('An account with that mobile number already exists.', 409);

        const user = new User({
            name, phone, password, email, role, staffRoleId,
            ...(VALID_POSITIONS.includes(body.playingPosition) ? { playingPosition: body.playingPosition } : {})
        });
        await user.save(); // password is hashed by the pre-save hook
        await syncCustomerFromUser(user, { source: 'manual' }); // player accounts also join the customer list
        await safeSendWelcomeEmail({
            toEmail: user.email,
            fullName: user.name,
            role: user.role,
            phone: user.phone
        });

        const [json] = await withStaffRoleNames([user.toJSON()]);
        return NextResponse.json({
            success: true,
            message: `${isPrivileged(role) ? 'Team account' : 'Account'} created for ${name}.`,
            user: json
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/users');
    }
}
