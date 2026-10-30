import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/serverAuth';

/** POST only: a GET logout could be triggered cross-site by an <img> tag. */
export async function POST() {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    clearAuthCookies(response);
    return response;
}
