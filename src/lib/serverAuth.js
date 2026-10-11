import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const JWT_SECRET = process.env.JWT_SECRET || 'crossbar_metro_jwt_secret_key_2026';
export const TOKEN_COOKIE_NAME = 'cma_auth_token';
export const USER_COOKIE_NAME = 'cma_user';
export const TOKEN_EXPIRY = '30d';

/**
 * Sign a JWT token with user payload
 */
export function signJwtToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify and decode a JWT token using Node.js jsonwebtoken
 */
export function verifyJwtToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (err) {
        return null;
    }
}

/**
 * Verify and decode JWT token compatible with Next.js Edge Middleware & Web Crypto API
 */
export async function verifyJwtTokenEdge(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [headerB64, payloadB64, signatureB64] = parts;

        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            enc.encode(JWT_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const data = enc.encode(`${headerB64}.${payloadB64}`);
        const sigStr = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
        const binSig = Uint8Array.from(atob(sigStr), (c) => c.charCodeAt(0));

        const isValid = await crypto.subtle.verify('HMAC', key, binSig, data);
        if (!isValid) return null;

        const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);

        if (payload.exp && payload.exp * 1000 < Date.now()) {
            return null; // Expired
        }

        return payload;
    }
    catch (err) {
        return null;
    }
}

/**
 * Set both HTTP-only token cookie and accessible user info cookie on NextResponse
 */
export function setAuthCookies(response, token, user) {
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 30 * 24 * 60 * 60; // 30 days

    // 1. Secure HTTP-only Token Cookie for Server & Middleware Auth
    response.cookies.set({
        name: TOKEN_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge
    });

    // 2. Client-accessible User Info Cookie for Fast Hydration
    if (user) {
        const safeUser = {
            id: user.id || user._id?.toString(),
            name: user.name,
            phone: user.phone,
            role: user.role,
            email: user.email || '',
            playingPosition: user.playingPosition || 'MID',
            teamId: user.teamId || ''
        };

        response.cookies.set({
            name: USER_COOKIE_NAME,
            value: encodeURIComponent(JSON.stringify(safeUser)),
            httpOnly: false,
            secure: isProd,
            sameSite: 'lax',
            path: '/',
            maxAge
        });
    }

    return response;
}

/**
 * Clear all authentication cookies
 */
export function clearAuthCookies(response) {
    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set({
        name: TOKEN_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0)
    });

    response.cookies.set({
        name: USER_COOKIE_NAME,
        value: '',
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0)
    });

    return response;
}

/**
 * Get currently authenticated user from incoming Next.js Request (cookie or Bearer header)
 */
export async function getAuthUserFromRequest(request) {
    // 1. Check Authorization header
    if (request) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const verified = verifyJwtToken(token);
            if (verified) return verified;
        }

        // Check request cookies if available on NextRequest
        if (request.cookies && typeof request.cookies.get === 'function') {
            const reqToken = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
            if (reqToken) {
                const verified = verifyJwtToken(reqToken);
                if (verified) return verified;
            }
        }
    }

    // 2. Check Next.js server cookieStore
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
        if (token) {
            return verifyJwtToken(token);
        }
    }
    catch {
        // If called outside request context
    }

    return null;
}
