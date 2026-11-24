import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/apiAuth';
import { confirmPasswordReset } from '@/service/auth-service';

/**
 * POST /api/auth/reset-password
 * Body: { identifier, code, newPassword }
 * Verifies the 6-digit email code and updates the user's password.
 */
export async function POST(request) {
    try {
        const ipLimited = rateLimit(request, 'reset-pw-ip', 15, 15 * 60 * 1000);
        if (ipLimited) return ipLimited;

        const body = await request.json().catch(() => ({}));
        const identifier =
            typeof body.identifier === 'string' && body.identifier.trim()
                ? body.identifier
                : typeof body.email === 'string' && body.email.trim()
                    ? body.email
                    : typeof body.phone === 'string'
                        ? body.phone
                        : '';

        const result = await confirmPasswordReset({
            identifier,
            code: body.code,
            newPassword: body.newPassword
        });

        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({
            success: true,
            message: result.message
        });
    } catch (err) {
        console.error('Reset password API error:', err);
        return NextResponse.json(
            { error: 'Could not reset password right now. Please try again.' },
            { status: 500 }
        );
    }
}
