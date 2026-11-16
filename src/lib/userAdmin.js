import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { can, isObjectId } from '@/lib/apiAuth';

/** Shared rules for the admin user-management routes (/api/users, /api/users/:id). */

export const ACCOUNT_ROLES = ['player', 'investor', 'staff', 'admin', 'visitor'];
export const VALID_POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const forbidden = (message) => NextResponse.json({ error: message }, { status: 403 });
export const invalid = (message, status = 400) => NextResponse.json({ error: message }, { status });

/** Accounts that can open the admin portal. Only a full admin may create, change or remove these. */
export const isPrivileged = (role) => role === 'admin' || role === 'staff';

export const sameUser = (actor, userDoc) => String(actor.userId || actor.id) === String(userDoc._id);

/**
 * May `actor` edit this account at all?
 *   admin                      -> anyone
 *   staff with "players"       -> player / investor / visitor accounts
 *   staff with "investors"     -> investor accounts (e.g. resetting a partner's password)
 */
export function canEditAccount(actor, target) {
    if (actor.role === 'admin') return true;
    if (isPrivileged(target.role)) return false;
    if (can(actor, 'players')) return true;
    return target.role === 'investor' && can(actor, 'investors');
}

/** Would changing/removing this account leave the arena with no working admin? */
export async function isLastActiveAdmin(userDoc) {
    if (userDoc.role !== 'admin' || userDoc.disabled) return false;
    const others = await User.countDocuments({ role: 'admin', disabled: { $ne: true }, _id: { $ne: userDoc._id } });
    return others === 0;
}

/** Resolve a staff role id to the Role document, or null when it does not exist. */
export async function findStaffRole(id) {
    if (!isObjectId(id)) return null;
    return Role.findById(id);
}

/** Add `staffRoleName` to user JSON objects so lists can show it without a second request. */
export async function withStaffRoleNames(userJsons) {
    const ids = [...new Set(userJsons.filter(u => u.role === 'staff' && isObjectId(u.staffRoleId)).map(u => u.staffRoleId))];
    if (ids.length === 0) return userJsons.map(u => ({ ...u, staffRoleName: '' }));
    const roles = await Role.find({ _id: { $in: ids } }).select('name').lean();
    const names = Object.fromEntries(roles.map(r => [String(r._id), r.name]));
    return userJsons.map(u => ({ ...u, staffRoleName: u.role === 'staff' ? (names[u.staffRoleId] || '') : '' }));
}
