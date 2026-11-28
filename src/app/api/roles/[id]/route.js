import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Role } from '@/models/role-model';
import { User } from '@/models/user-model';
import { requireAdmin, requireSuperAdminDelete, isObjectId, invalidateLiveUserCache } from '@/lib/apiAuth';
import { applyUpdateAudit } from '@/lib/audit';
import { readJson, badRequest, errorResponse } from '@/lib/validate';
import { parseRoleInput, rolesWithCounts } from '@/lib/roleAdmin';

const notFound = () => NextResponse.json({ error: 'Role not found' }, { status: 404 });

/** PUT /api/roles/:id (admin) - replace the name, description and permissions. Takes effect for its staff at once. */
export async function PUT(request, { params }) {
    try {
        const { user, denied } = await requireAdmin(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return notFound();
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        const { data, error } = parseRoleInput(body);
        if (error) return badRequest(error);

        await connectToDatabase();
        const role = await Role.findById(id);
        if (!role) return notFound();
        const clash = await Role.findOne({ nameKey: data.nameKey, _id: { $ne: role._id } });
        if (clash) return NextResponse.json({ error: `A role called "${data.name}" already exists.` }, { status: 409 });

        role.set(data);
        applyUpdateAudit(role, user, { fallback: 'Admin', backfillUserId: true });
        await role.save();
        invalidateLiveUserCache();
        const [json] = await rolesWithCounts([role]);
        return NextResponse.json({ success: true, message: `Role "${role.name}" updated.`, role: json });
    } catch (err) {
        return errorResponse(err, 'PUT /api/roles/[id]');
    }
}

/** DELETE /api/roles/:id (admin) - refused while any account still uses the role. */
export async function DELETE(request, { params }) {
    try {
        const { denied } = await requireSuperAdminDelete(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return notFound();

        await connectToDatabase();
        const role = await Role.findById(id);
        if (!role) return notFound();
        const inUse = await User.countDocuments({ role: 'staff', staffRoleId: String(role._id) });
        if (inUse > 0) {
            return NextResponse.json({ error: `${inUse} staff account${inUse === 1 ? ' uses' : 's use'} this role. Move them to another role first.`, userCount: inUse }, { status: 409 });
        }
        await Role.deleteOne({ _id: role._id });
        return NextResponse.json({ success: true, message: `Role "${role.name}" deleted.` });
    } catch (err) {
        return errorResponse(err, 'DELETE /api/roles/[id]');
    }
}
