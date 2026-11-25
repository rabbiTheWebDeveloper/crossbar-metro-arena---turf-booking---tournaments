import { cleanPhone } from './phone';
import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from './serverAuth';
import { hasPermission, cleanPermissions } from './permissions';

/**
 * Shared auth guards for API route handlers.
 *
 * Usage:
 *   const { user, denied } = await requireRole(request, ['admin']);
 *   if (denied) return denied;
 *
 * The JWT is verified first; then the account is re-checked in the database so that a
 * disabled account or a changed role takes effect immediately instead of after 30 days.
 */
const LIVE_USER_TTL_MS = 3000;
const liveUserCache = global.__cmaLiveUserCache || (global.__cmaLiveUserCache = new Map());

/** Invalidate cached live-user lookups (call whenever a user or staff role is modified/deleted). */
export function invalidateLiveUserCache(userId = '') {
    if (userId) liveUserCache.delete(String(userId));
    else liveUserCache.clear();
}

async function liveUser(tokenUser) {
    if (!tokenUser) return null;
    const id = String(tokenUser.userId || tokenUser.id || '');
    if (!isObjectId(id)) return tokenUser;

    const now = Date.now();
    const cached = liveUserCache.get(id);
    if (cached && now - cached.ts < LIVE_USER_TTL_MS) {
        if (!cached.user) return null;
        return { ...tokenUser, ...cached.user };
    }

    try {
        const { connectToDatabase } = await import('./mongodb');
        const { User } = await import('@/models/user-model');
        await connectToDatabase();
        const doc = await User.findById(id).select('name phone role disabled email playingPosition teamId staffRoleId').lean();
        if (!doc || doc.disabled) {
            liveUserCache.set(id, { ts: now, user: null });
            return null;
        }
        const access = await loadAccess(doc);
        const resolved = {
            userId: String(doc._id),
            id: String(doc._id),
            name: doc.name,
            phone: doc.phone,
            role: doc.role,
            email: doc.email,
            playingPosition: doc.playingPosition,
            teamId: doc.teamId,
            ...access
        };
        if (liveUserCache.size > 1000) liveUserCache.clear();
        liveUserCache.set(id, { ts: now, user: resolved });
        return { ...tokenUser, ...resolved };
    } catch (e) {
        // Database unreachable: fall back to the signed token so the app keeps working.
        // Staff permissions are never taken from the token, so staff get no admin access while the database is down.
        console.warn('liveUser lookup failed, using token payload:', e.message);
        return { ...tokenUser, permissions: [] };
    }
}

/**
 * Admin-portal access for a user record: { permissions, staffRoleId, staffRoleName }.
 * Staff permissions are read from their role on every request, so editing a role takes effect immediately.
 * The caller must already be connected to the database.
 */
export async function loadAccess(userDoc) {
    if (!userDoc || userDoc.role !== 'staff') return { permissions: [], staffRoleId: '', staffRoleName: '' };
    const roleId = String(userDoc.staffRoleId || '');
    if (!isObjectId(roleId)) return { permissions: [], staffRoleId: '', staffRoleName: '' };
    const { Role } = await import('@/models/role-model');
    const role = await Role.findById(roleId).select('name permissions').lean();
    if (!role) return { permissions: [], staffRoleId: '', staffRoleName: '' };
    return { permissions: cleanPermissions(role.permissions), staffRoleId: roleId, staffRoleName: role.name };
}

/** Does this user hold the permission (or any of a list)? Admins hold all. See lib/permissions.js. */
export const can = hasPermission;

/**
 * Guard for admin-portal routes: admins always pass, staff pass when their role grants the permission
 * (or any one of a list). `alsoRoles` lets other account types through, e.g. investors reading finance data.
 *
 *   const { user, denied } = await requirePermission(request, 'bookings');
 *   const { user, denied } = await requirePermission(request, ['investors', 'finance'], { alsoRoles: ['investor'] });
 */
export async function requirePermission(request, permission, { alsoRoles = [] } = {}) {
    const { user, denied } = await requireAuth(request);
    if (denied) return { user: null, denied };
    if (hasPermission(user, permission) || alsoRoles.includes(user.role)) return { user, denied: null };
    return { user, denied: NextResponse.json({ error: 'You do not have permission to do that.' }, { status: 403 }) };
}

export async function requireAuth(request) {
    const tokenUser = await getAuthUserFromRequest(request);
    const user = await liveUser(tokenUser);
    if (!user) {
        return { user: null, denied: NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 }) };
    }
    return { user, denied: null };
}

export async function requireRole(request, roles = ['admin']) {
    const { user, denied } = await requireAuth(request);
    if (denied) return { user: null, denied };
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(user.role)) {
        return { user, denied: NextResponse.json({ error: 'You do not have permission to do that.' }, { status: 403 }) };
    }
    return { user, denied: null };
}

export const requireAdmin = (request) => requireRole(request, ['admin']);

/**
 * Strict guard for all destructive DELETE endpoints in the admin portal:
 * only Super Admin (`user.role === 'admin'`) may delete records.
 */
export async function requireSuperAdminDelete(request) {
    const { user, denied } = await requireAuth(request);
    if (denied) return { user: null, denied };
    if (user.role !== 'admin') {
        return {
            user,
            denied: NextResponse.json(
                { error: 'Only Super Admin has permission to delete records.' },
                { status: 403 }
            )
        };
    }
    return { user, denied: null };
}

/** Returns the current (live) user or null without producing a response (for "optional auth" routes). */
export async function optionalAuth(request) {
    try {
        const tokenUser = await getAuthUserFromRequest(request);
        return await liveUser(tokenUser);
    } catch {
        return null;
    }
}

export { cleanPhone, isValidBdPhone } from './phone';

/** Escape a string so it can be used safely inside a MongoDB $regex. */
export function escapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Is this a valid 24-hex Mongo ObjectId string? */
export const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ''));

/** Best-effort client address for rate limiting (Vercel / proxies set x-forwarded-for). */
export function clientIp(request) {
    const fwd = request.headers.get('x-forwarded-for') || '';
    return fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Simple sliding-window rate limiter kept in process memory.
 * Good enough to stop password guessing and payment-init spam on a single instance;
 * swap for Redis/Upstash when running on many instances.
 * Returns a NextResponse (429) when the limit is exceeded, otherwise null.
 */
const buckets = global.__cmaRateBuckets || (global.__cmaRateBuckets = new Map());
export function rateLimit(request, scope, max = 10, windowMs = 15 * 60 * 1000, extraKey = '') {
    const key = `${scope}:${clientIp(request)}:${extraKey}`;
    const now = Date.now();
    const entry = buckets.get(key) || { hits: [] };
    entry.hits = entry.hits.filter(t => now - t < windowMs);
    if (entry.hits.length >= max) {
        const retry = Math.ceil((windowMs - (now - entry.hits[0])) / 1000);
        return NextResponse.json({ error: `Too many attempts. Please try again in ${Math.max(1, Math.ceil(retry / 60))} minute(s).` }, { status: 429, headers: { 'Retry-After': String(retry) } });
    }
    entry.hits.push(now);
    buckets.set(key, entry);
    if (buckets.size > 5000) {
        // keep memory bounded
        for (const [k, v] of buckets) { if (!v.hits.some(t => now - t < windowMs)) buckets.delete(k); }
    }
    return null;
}

/** Only allow same-site relative redirect targets (blocks //evil.com and javascript:). */
export function safeRedirectPath(target, fallback = '/') {
    const t = String(target || '');
    return /^\/(?![\/\\])/.test(t) ? t : fallback;
}
