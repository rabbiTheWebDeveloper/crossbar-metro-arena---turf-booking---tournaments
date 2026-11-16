import { Role } from '@/models/Role';
import { User } from '@/models/User';
import { PERMISSION_KEYS } from '@/lib/permissions';

/** Shared helpers for the staff-role routes (/api/roles, /api/roles/:id). */

/** Validate a role payload. Returns { data: { name, nameKey, description, permissions } } or { error }. */
export function parseRoleInput(body) {
    const name = String(body.name || '').trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 40) return { error: 'Role name must be between 2 and 40 characters.' };
    if (['admin', 'administrator'].includes(name.toLowerCase())) return { error: '"Admin" is the built-in full-access account type. Choose another name.' };
    const description = String(body.description || '').trim();
    if (description.length > 200) return { error: 'Description must be at most 200 characters.' };
    if (!Array.isArray(body.permissions)) return { error: 'Permissions must be a list.' };
    const unknown = body.permissions.find(k => !PERMISSION_KEYS.includes(k));
    if (unknown !== undefined) return { error: `Unknown permission: ${String(unknown).slice(0, 40)}` };
    const permissions = PERMISSION_KEYS.filter(k => body.permissions.includes(k)); // de-duplicated, catalogue order
    if (permissions.length === 0) return { error: 'Choose at least one permission for this role.' };
    return { data: { name, nameKey: name.toLowerCase(), description, permissions } };
}

/** Role JSON with the number of accounts using it. */
export async function rolesWithCounts(roleDocs) {
    const counts = await User.aggregate([
        { $match: { role: 'staff' } },
        { $group: { _id: '$staffRoleId', count: { $sum: 1 } } }
    ]);
    const byId = Object.fromEntries(counts.map(c => [String(c._id), c.count]));
    return roleDocs.map(r => ({ ...r.toJSON(), userCount: byId[String(r._id)] || 0 }));
}

export const listRoles = async () => rolesWithCounts(await Role.find().sort({ name: 1 }));
