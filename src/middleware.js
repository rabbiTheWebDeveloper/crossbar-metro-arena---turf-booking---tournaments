import { NextResponse } from 'next/server';

// Must match src/lib/serverAuth.js. In production JWT_SECRET is mandatory; with no secret every token is rejected.
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'crossbar_metro_dev_only_secret_do_not_use_in_production');
const TOKEN_COOKIE_NAME = 'cma_auth_token';

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

export async function middleware(request) {
    const { pathname, search } = request.nextUrl;
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
    const user = await verifyToken(token);

    const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/signup';
    const isAdminRoute = pathname.startsWith('/admin');
    const isInvestorRoute = pathname.startsWith('/investor');
    const isPlayerRoute = pathname.startsWith('/player');

    // 1. If user is already authenticated and visits Login/Register/Signup
    if (isAuthRoute) {
        // Allow switching accounts if requested via query param ?switch=true
        if (request.nextUrl.searchParams.get('switch') === 'true') {
            return NextResponse.next();
        }

        if (user) {
            const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
            if (callbackUrl && /^\/(?![\/\\])/.test(callbackUrl)) {
                return NextResponse.redirect(new URL(callbackUrl, request.url));
            }

            // Redirect to appropriate portal based on verified role
            if (user.role === 'admin') {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            if (user.role === 'investor') {
                return NextResponse.redirect(new URL('/investor', request.url));
            }
            return NextResponse.redirect(new URL('/player', request.url));
        }

        return NextResponse.next();
    }

    // 2. Private Route Protection: ADMIN (/admin & /admin/*)
    if (isAdminRoute) {
        if (!user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname + search);
            loginUrl.searchParams.set('error', 'Please log in with an Administrator account to access the Arena Desk.');
            return NextResponse.redirect(loginUrl);
        }

        if (user.role !== 'admin') {
            // Non-admin attempting to access admin portal
            const target = user.role === 'investor' ? '/investor' : '/player';
            const redirectUrl = new URL(target, request.url);
            return NextResponse.redirect(redirectUrl);
        }
    }

    // 3. Private Route Protection: INVESTOR (/investor & /investor/*)
    if (isInvestorRoute) {
        if (!user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname + search);
            loginUrl.searchParams.set('error', 'Please log in with your Partner account to access Financial Dividends.');
            return NextResponse.redirect(loginUrl);
        }

        if (user.role !== 'investor' && user.role !== 'admin') {
            // Player attempting to access investor portal
            return NextResponse.redirect(new URL('/player', request.url));
        }
    }

    // 4. Private Route Protection: PLAYER (/player & /player/*)
    if (isPlayerRoute) {
        if (!user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname + search);
            loginUrl.searchParams.set('error', 'Please sign in or register to access your player pass and wallet.');
            return NextResponse.redirect(loginUrl);
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

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/investor/:path*',
        '/player/:path*',
        '/login',
        '/register',
        '/signup'
    ],
};
