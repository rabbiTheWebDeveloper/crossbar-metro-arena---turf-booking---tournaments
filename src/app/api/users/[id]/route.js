import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { readJson, errorResponse } from '@/lib/validate';
import { User } from '@/models/user-model';
import { Investor } from '@/models/investor-model';
import { Customer } from '@/models/customer-model';
import { requireAuth, requireSuperAdminDelete, isObjectId, invalidateLiveUserCache } from '@/lib/apiAuth';
import { applyUpdateAudit, stampUpdate } from '@/lib/audit';
import { syncCustomerFromUser } from '@/lib/customers';
import { ACCOUNT_ROLES, VALID_POSITIONS, EMAIL_RE, forbidden, invalid, isPrivileged, sameUser, canEditAccount, isLastActiveAdmin, findStaffRole, withStaffRoleNames } from '@/lib/userAdmin';

const notFound = () => NextResponse.json({ error: 'Account not found' }, { status: 404 });
const NO_ACCESS = 'You do not have permission to manage this account.';

const present = async (userDoc) => (await withStaffRoleNames([userDoc.toJSON()]))[0];

/** GET /api/users/:id  (admin, or staff allowed to manage that account) */
export async function GET(request, { params }) {
    try {
        const { user: actor, denied } = await requireAuth(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return notFound();
        await connectToDatabase();
        const user = await User.findById(id).select('-password');
        if (!user) return notFound();
        if (!canEditAccount(actor, user)) return forbidden(NO_ACCESS);
        return NextResponse.json({ success: true, user: await present(user) });
    } catch (err) {
        return errorResponse(err, 'GET /api/users/[id]');
    }
}

/**
 * PATCH /api/users/:id
 * Editable: name, phone, email, playingPosition, teamId, disabled, newPassword
 * Admin only: role, staffRoleId, and any change to an admin or staff account.
 */
export async function PATCH(request, { params }) {
    try {
        const { user: actor, denied } = await requireAuth(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return notFound();
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        await connectToDatabase();
        const user = await User.findById(id);
        if (!user) return notFound();
        if (!canEditAccount(actor, user)) return forbidden(NO_ACCESS);

        const isAdmin = actor.role === 'admin';
        const isSelf = sameUser(actor, user);
        const wasLastAdmin = await isLastActiveAdmin(user);
        const previousPhone = user.phone;

        if (body.name !== undefined) {
            const name = String(body.name).trim();
            if (name.length < 2) return invalid('Name must be at least 2 characters.');
            user.name = name;
        }
        if (body.phone !== undefined) {
            let clean = String(body.phone).replace(/[^0-9]/g, '');
            if (clean.startsWith('8801')) clean = clean.substring(2);
            if (!/^01[3-9]\d{8}$/.test(clean)) return invalid('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).');
            const clash = await User.findOne({ phone: clean, _id: { $ne: user._id } });
            if (clash) return invalid('Another account already uses that mobile number.', 409);
            user.phone = clean;
        }
        if (body.email !== undefined) {
            const email = String(body.email || '').trim().toLowerCase();
            if (email && !EMAIL_RE.test(email)) return invalid('Enter a valid email address.');
            if (email !== (user.email || '').trim().toLowerCase()) {
                user.email = email;
                user.emailVerified = false;
                user.emailVerifiedAt = null;
            }
        }
        if (body.playingPosition !== undefined) {
            if (!VALID_POSITIONS.includes(body.playingPosition)) return invalid('Invalid playing position.');
            user.playingPosition = body.playingPosition;
        }
        if (body.teamId !== undefined) user.teamId = String(body.teamId).trim();

        // ---- Account type and staff role: admin only ----
        const wantsRoleChange = body.role !== undefined && body.role !== user.role;
        const wantsStaffRoleChange = body.staffRoleId !== undefined && String(body.staffRoleId || '') !== String(user.staffRoleId || '');
        if ((wantsRoleChange || wantsStaffRoleChange) && !isAdmin) return forbidden('Only an admin can change an account type or staff role.');
        if (wantsRoleChange) {
            if (!ACCOUNT_ROLES.includes(body.role)) return invalid('Invalid role.');
            if (isSelf && body.role !== 'admin') return invalid('You cannot remove your own admin role.');
            if (wasLastAdmin && body.role !== 'admin') return invalid('This is the only active admin account. Make another account an admin first.');
            user.role = body.role;
        }
        if (user.role === 'staff') {
            if (wantsRoleChange || wantsStaffRoleChange) {
                const staffRole = await findStaffRole(body.staffRoleId !== undefined ? body.staffRoleId : user.staffRoleId);
                if (!staffRole) return invalid('Choose a staff role for this account.');
                user.staffRoleId = String(staffRole._id);
            }
        } else {
            user.staffRoleId = '';
        }

        if (body.disabled !== undefined) {
            const disabled = Boolean(body.disabled);
            if (isSelf && disabled) return invalid('You cannot disable your own account.');
            if (wasLastAdmin && disabled) return invalid('This is the only active admin account. It cannot be disabled.');
            user.disabled = disabled;
        }
        if (body.newPassword) {
            if (String(body.newPassword).length < 6) return invalid('Password must be at least 6 characters.');
            user.password = String(body.newPassword); // hashed by the pre-save hook
        }

        applyUpdateAudit(user, actor, { fallback: 'Admin', backfillUserId: true });
        await user.save();
        invalidateLiveUserCache(String(user._id));
        await syncCustomerFromUser(user, { previousPhone, actor }); // no-op unless this is a player account
        return NextResponse.json({ success: true, message: 'Account updated', user: await present(user) });
    } catch (err) {
        return errorResponse(err, 'PATCH /api/users/[id]');
    }
}

/**
 * DELETE /api/users/:id               - soft delete: disables the account (it can be enabled again)
 * DELETE /api/users/:id?permanent=1   - admin only: removes the login for good. Bookings, registrations and
 *                                       payouts are kept (they store the customer's name and phone themselves).
 */
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const permanent = new URL(request.url).searchParams.get('permanent') === '1';
        const { user: actor, denied } = await requireSuperAdminDelete(request);
        if (denied) return denied;
        if (!isObjectId(id)) return notFound();

        await connectToDatabase();
        const user = await User.findById(id);
        if (!user) return notFound();
        if (!canEditAccount(actor, user)) return forbidden(NO_ACCESS);
        if (sameUser(actor, user)) return invalid(permanent ? 'You cannot delete your own account.' : 'You cannot disable your own account.');
        if (await isLastActiveAdmin(user)) return invalid('This is the only active admin account. Make another account an admin first.');

        if (permanent) {
            const unlinkPatch = { userId: '', ...stampUpdate(actor, { fallback: 'Admin' }) };
            await Investor.updateMany({ userId: String(user._id) }, { $set: unlinkPatch });
            await Customer.updateMany({ userId: String(user._id) }, { $set: unlinkPatch }); // the person stays in the customer list
            await User.deleteOne({ _id: user._id });
            invalidateLiveUserCache(String(user._id));
            return NextResponse.json({ success: true, deleted: true, message: `${user.name}'s account was deleted.` });
        }

        user.disabled = true;
        applyUpdateAudit(user, actor, { fallback: 'Admin', backfillUserId: true });
        await user.save();
        invalidateLiveUserCache(String(user._id));
        return NextResponse.json({ success: true, message: 'Account disabled', user: await present(user) });
    } catch (err) {
        return errorResponse(err, 'DELETE /api/users/[id]');
    }
}
