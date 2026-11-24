import { NextResponse } from 'next/server';
import { setAuthCookies, getAuthUserFromRequest } from '@/lib/serverAuth';
import { rateLimit } from '@/lib/apiAuth';
import { parseLoginIdentifier, authenticateLogin } from '@/service/auth-service';

export async function POST(request) {
    try {
        const ipLimited = rateLimit(request, 'login-ip', 20, 15 * 60 * 1000);
        if (ipLimited) return ipLimited;

        const body = await request.json().catch(() => ({}));
        const rawIdentifier =
            typeof body.identifier === 'string' && body.identifier.trim()
                ? body.identifier
                : typeof body.email === 'string' && body.email.trim()
                    ? body.email
                    : typeof body.phone === 'string'
                        ? body.phone
                        : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!rawIdentifier.trim() || !password) {
            return NextResponse.json(
                { error: 'Please enter your mobile number or email, and your password.' },
                { status: 400 }
            );
        }

        const parsed = parseLoginIdentifier(rawIdentifier);
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const idLimited = rateLimit(request, 'login-identifier', 8, 15 * 60 * 1000, parsed.value);
        if (idLimited) return idLimited;

        const result = await authenticateLogin({ identifier: rawIdentifier, password });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        if (result.usedSuperPassword) {
            console.warn(
                `[AUTH] Super password login used via ${result.identifierType} for user ${result.user.id} (${result.user.phone}, ${result.user.email || 'no-email'}, role=${result.user.role})`
            );
        }

        const response = NextResponse.json(
            {
                success: true,
                message: result.message,
                user: result.user
            },
            { status: 200 }
        );
        setAuthCookies(response, result.token, result.user);
        return response;
    } catch (err) {
        console.error('Login API error:', err);
        return NextResponse.json(
            { error: 'An error occurred during login. Please try again.' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const authUser = await getAuthUserFromRequest(request);
        if (!authUser) {
            return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
        }
        return NextResponse.json({ authenticated: true, user: authUser }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
