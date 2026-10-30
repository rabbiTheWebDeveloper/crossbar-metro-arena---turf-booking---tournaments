import { readJson } from '@/lib/validate';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { requireAdmin as requireAdminGuard } from '@/lib/apiAuth';

const VALID_ROLES = ['visitor', 'player', 'admin', 'investor'];
const VALID_POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];

async function requireAdmin(request) {
    const { user, denied } = await requireAdminGuard(request);
    return denied ? { denied } : { admin: user };
}

/** GET /api/users/:id  (admin) */
export async function GET(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        const user = await User.findById(id).select('-password');
        if (!user) return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        return NextResponse.json({ success: true, user: user.toJSON() });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * PATCH /api/users/:id  (admin)
 * Editable: name, phone, email, playingPosition, teamId, role, disabled, newPassword
 */
export async function PATCH(request, { params }) {
    try {
        const { denied, admin } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const user = await User.findById(id);
        if (!user) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

        if (body.name !== undefined) {
            const name = String(body.name).trim();
            if (name.length < 2) return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
            user.name = name;
        }
        if (body.phone !== undefined) {
            let clean = String(body.phone).replace(/[^0-9]/g, '');
            if (clean.startsWith('8801')) clean = clean.substring(2);
            if (!/^01[3-9]\d{8}$/.test(clean)) {
                return NextResponse.json({ error: 'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).' }, { status: 400 });
            }
            const clash = await User.findOne({ phone: clean, _id: { $ne: user._id } });
            if (clash) return NextResponse.json({ error: 'Another account already uses that mobile number.' }, { status: 409 });
            user.phone = clean;
        }
        if (body.email !== undefined) user.email = String(body.email).trim().toLowerCase();
        if (body.playingPosition !== undefined) {
            if (!VALID_POSITIONS.includes(body.playingPosition)) return NextResponse.json({ error: 'Invalid playing position.' }, { status: 400 });
            user.playingPosition = body.playingPosition;
        }
        if (body.teamId !== undefined) user.teamId = String(body.teamId).trim();
        if (body.role !== undefined) {
            if (!VALID_ROLES.includes(body.role)) return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
            if (String(admin.userId || admin.id) === String(user._id) && body.role !== 'admin') {
                return NextResponse.json({ error: 'You cannot remove your own admin role.' }, { status: 400 });
            }
            user.role = body.role;
        }
        if (body.disabled !== undefined) {
            if (String(admin.userId || admin.id) === String(user._id) && body.disabled) {
                return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 400 });
            }
            user.disabled = Boolean(body.disabled);
        }
        if (body.newPassword) {
            if (String(body.newPassword).length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
            user.password = String(body.newPassword); // hashed by the pre-save hook
        }

        await user.save();
        return NextResponse.json({ success: true, message: 'Player profile updated', user: user.toJSON() });
    } catch (err) {
        console.error('PATCH /api/users/[id] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** DELETE /api/users/:id (admin) - soft delete: disables the account */
export async function DELETE(request, { params }) {
    try {
        const { denied, admin } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (String(admin.userId || admin.id) === String(id)) {
            return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 400 });
        }
        const user = await User.findByIdAndUpdate(id, { disabled: true }, { new: true }).select('-password');
        if (!user) return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'Account disabled', user: user.toJSON() });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
