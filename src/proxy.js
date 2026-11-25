import { NextResponse } from 'next/server';
import { getDefaultPortalForRole, canAccessPortal, resolvePostLoginPath } from './lib/permissions';

// Must match src/lib/serverAuth.js. In production JWT_SECRET is mandatory; with no secret every token is rejected.
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'crossbar_metro_dev_only_secret_do_not_use_in_production');
const TOKEN_COOKIE_NAME = 'cma_auth_token';
const USER_COOKIE_NAME = 'cma_user';

function decodeBase64Url(input) {
    const base64 = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    return atob(pad ? base64 + '='.repeat(4 - pad) : base64);
}

function applyNoStoreHeaders(response) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
}

/**
 * Edge-compatible JWT verification using Web Crypto API
 */
async function verifyToken(token) {
    if (!token || typeof token !== 'string' || !JWT_SECRET) return null;
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
        const rawSig = decodeBase64Url(signatureB64);
        const binSig = Uint8Array.from(rawSig, (c) => c.charCodeAt(0));

        const isValid = await crypto.subtle.verify('HMAC', key, binSig, data);
        if (!isValid) return null;

        const payloadJson = decodeBase64Url(payloadB64);
        const payload = JSON.parse(payloadJson);

        if (payload.exp && payload.exp * 1000 < Date.now()) {
            return null; // Expired
        }

        return payload;
    }
    catch {
        return null;
    }
}

export async function proxy(request) {
    const { pathname, search } = request.nextUrl;
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
    const user = await verifyToken(token);

    const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/signup';
    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
    const isInvestorRoute = pathname === '/investor' || pathname.startsWith('/investor/');
    const isCustomerRoute = pathname === '/customer' || pathname.startsWith('/customer/');
    const isPrivatePortal = isAdminRoute || isInvestorRoute || isCustomerRoute;

    // 1. If user is already authenticated and visits Login/Register/Signup
    if (isAuthRoute) {
        if (request.nextUrl.searchParams.get('switch') === 'true') {
            return applyNoStoreHeaders(NextResponse.next());
        }

        if (user) {
            const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
            const destination = resolvePostLoginPath(user, callbackUrl);
            return applyNoStoreHeaders(NextResponse.redirect(new URL(destination, request.url)));
        }

        const res = applyNoStoreHeaders(NextResponse.next());
        // Clean up any stale client hydration cookie if token is missing/expired
        if (request.cookies.get(USER_COOKIE_NAME)?.value) {
            res.cookies.delete(USER_COOKIE_NAME);
        }
        return res;
    }

    // 2. Strict Private Route & Role Isolation across /admin, /investor, and /customer
    if (isPrivatePortal) {
        if (!user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname + search);
            const msg = isAdminRoute
                ? 'Please sign in with an Admin or Staff account to access the Arena Desk.'
                : isInvestorRoute
                    ? 'Please sign in with your Investor Partner account to view dividends & reports.'
                    : 'Please sign in to access your Customer bookings, passes & team.';
            loginUrl.searchParams.set('error', msg);
            const redirectRes = applyNoStoreHeaders(NextResponse.redirect(loginUrl));
            if (token) redirectRes.cookies.delete(TOKEN_COOKIE_NAME);
            if (request.cookies.get(USER_COOKIE_NAME)?.value) redirectRes.cookies.delete(USER_COOKIE_NAME);
            return redirectRes;
        }

        if (!canAccessPortal(user, pathname)) {
            const ownPortal = getDefaultPortalForRole(user);
            return applyNoStoreHeaders(NextResponse.redirect(new URL(ownPortal, request.url)));
        }
    }

    // Pass user context forward in request headers
    const requestHeaders = new Headers(request.headers);
    if (user) {
        requestHeaders.set('x-user-id', user.userId || user.id || '');
        requestHeaders.set('x-user-role', user.role || '');
        requestHeaders.set('x-user-name', encodeURIComponent(user.name || ''));
        requestHeaders.set('x-user-phone', user.phone || '');
    }

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    return isPrivatePortal ? applyNoStoreHeaders(response) : response;
}

export const config = {
    matcher: [
        '/admin',
        '/admin/:path*',
        '/investor',
        '/investor/:path*',
        '/customer',
        '/customer/:path*',
        '/login',
        '/register',
        '/signup'
    ],
};
