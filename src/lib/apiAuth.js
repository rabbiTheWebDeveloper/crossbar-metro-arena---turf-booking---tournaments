import { cleanPhone } from './phone';
import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from './serverAuth';

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
async function liveUser(tokenUser) {
    if (!tokenUser) return null;
    const id = tokenUser.userId || tokenUser.id;
    if (!isObjectId(id)) return tokenUser;
    try {
        const { connectToDatabase } = await import('./mongodb');
        const { User } = await import('@/models/User');
        await connectToDatabase();
        const doc = await User.findById(id).select('name phone role disabled email playingPosition teamId').lean();
        if (!doc || doc.disabled) return null;
        return { ...tokenUser, userId: String(doc._id), id: String(doc._id), name: doc.name, phone: doc.phone, role: doc.role, email: doc.email, playingPosition: doc.playingPosition, teamId: doc.teamId };
    } catch (e) {
        // Database unreachable: fall back to the signed token so the app keeps working
        console.warn('liveUser lookup failed, using token payload:', e.message);
        return tokenUser;
    }
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
