import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Role } from '@/models/Role';
import { requireAdmin } from '@/lib/apiAuth';
import { readJson, badRequest, errorResponse } from '@/lib/validate';
import { PERMISSIONS } from '@/lib/permissions';
import { parseRoleInput, listRoles, rolesWithCounts } from '@/lib/roleAdmin';

/**
 * Staff roles (admin only). A role is a named list of admin-portal permissions; see lib/permissions.js.
 *   GET  /api/roles  -> { roles: [{ id, name, description, permissions, userCount }], permissions: [catalogue] }
 *   POST /api/roles  -> create { name, description?, permissions: [] }
 */
export async function GET(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        return NextResponse.json({ success: true, roles: await listRoles(), permissions: PERMISSIONS });
    } catch (err) {
        return errorResponse(err, 'GET /api/roles');
    }
}

export async function POST(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        const { data, error } = parseRoleInput(body);
        if (error) return badRequest(error);

        await connectToDatabase();
        if (await Role.findOne({ nameKey: data.nameKey })) return NextResponse.json({ error: `A role called "${data.name}" already exists.` }, { status: 409 });
        const role = await Role.create(data);
        const [json] = await rolesWithCounts([role]);
        return NextResponse.json({ success: true, message: `Role "${role.name}" created.`, role: json }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/roles');
    }
}
