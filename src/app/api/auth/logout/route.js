import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/serverAuth';

export async function POST() {
    const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully.'
    });

    // Clear all auth cookies (token and user info)
    clearAuthCookies(response);

    return response;
}

export async function GET() {
    return POST();
}
