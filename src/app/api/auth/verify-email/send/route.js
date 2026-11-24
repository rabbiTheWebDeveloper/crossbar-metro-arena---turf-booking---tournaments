import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/serverAuth';
import { isObjectId, rateLimit } from '@/lib/apiAuth';
import { sendEmailVerificationCode } from '@/service/auth-service';

/**
 * POST /api/auth/verify-email/send
 * Body (optional): { email? }
 * Sends a 6-digit verification code to the signed-in user's email address (works for all roles).
 */
export async function POST(request) {
    try {
        const authUser = await getAuthUserFromRequest(request);
        const userId = authUser?.userId || authUser?.id;
        if (!authUser || !isObjectId(userId)) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const limited = rateLimit(request, 'verify-email-send', 6, 15 * 60 * 1000, userId);
        if (limited) return limited;

        const body = await request.json().catch(() => ({}));
        const result = await sendEmailVerificationCode(userId, body?.email);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({
            success: true,
            alreadyVerified: Boolean(result.alreadyVerified),
            email: result.email,
            expiresInMinutes: result.expiresInMinutes,
            message: result.message
        });
    } catch (err) {
        console.error('Send verify email API error:', err);
        return NextResponse.json(
            { error: 'Could not send verification email right now. Please try again.' },
            { status: 500 }
        );
    }
}
