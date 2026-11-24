import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/apiAuth';
import { parseLoginIdentifier, requestPasswordReset } from '@/service/auth-service';

/**
 * POST /api/auth/forgot-password
 * Body: { identifier } (or { phone } / { email })
 * Sends a 6-digit password reset code to the user's registered email address.
 */
export async function POST(request) {
    try {
        const ipLimited = rateLimit(request, 'forgot-pw-ip', 10, 15 * 60 * 1000);
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

        const parsed = parseLoginIdentifier(rawIdentifier);
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const idLimited = rateLimit(request, 'forgot-pw-id', 5, 15 * 60 * 1000, parsed.value);
        if (idLimited) return idLimited;

        const result = await requestPasswordReset(rawIdentifier);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            maskedEmail: result.maskedEmail,
            expiresInMinutes: result.expiresInMinutes
        });
    } catch (err) {
        console.error('Forgot password API error:', err);
        return NextResponse.json(
            { error: 'Could not send reset code right now. Please try again later.' },
            { status: 500 }
        );
    }
}
