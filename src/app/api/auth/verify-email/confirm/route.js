import { NextResponse } from 'next/server';
import { getAuthUserFromRequest, setAuthCookies } from '@/lib/serverAuth';
import { isObjectId, rateLimit } from '@/lib/apiAuth';
import { confirmEmailVerification } from '@/service/auth-service';

/**
 * POST /api/auth/verify-email/confirm
 * Body: { code }
 * Verifies the 6-digit code and marks the signed-in user's email as verified (all roles).
 */
export async function POST(request) {
    try {
        const authUser = await getAuthUserFromRequest(request);
        const userId = authUser?.userId || authUser?.id;
        if (!authUser || !isObjectId(userId)) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const limited = rateLimit(request, 'verify-email-confirm', 12, 15 * 60 * 1000, userId);
        if (limited) return limited;

        const body = await request.json().catch(() => ({}));
        const result = await confirmEmailVerification(userId, body?.code);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        const response = NextResponse.json({
            success: true,
            message: result.message,
            user: result.user
        });
        setAuthCookies(response, result.token, result.user);
        return response;
    } catch (err) {
        console.error('Confirm verify email API error:', err);
        return NextResponse.json(
            { error: 'Could not verify code right now. Please try again.' },
            { status: 500 }
        );
    }
}
