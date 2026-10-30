import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signJwtToken, setAuthCookies, getAuthUserFromRequest } from '@/lib/serverAuth';
import { rateLimit, cleanPhone } from '@/lib/apiAuth';

const GENERIC = 'Invalid mobile number or password.';

export async function POST(request) {
    try {
        const ipLimited = rateLimit(request, 'login-ip', 20, 15 * 60 * 1000);
        if (ipLimited) return ipLimited;

        const body = await request.json().catch(() => ({}));
        const phone = typeof body.phone === 'string' ? body.phone : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!phone || !password) {
            return NextResponse.json({ error: 'Please enter both your mobile number and password.' }, { status: 400 });
        }
        const clean = cleanPhone(phone);
        if (!/^01[3-9]\d{8}$/.test(clean)) {
            return NextResponse.json({ error: 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).' }, { status: 400 });
        }
        const phoneLimited = rateLimit(request, 'login-phone', 8, 15 * 60 * 1000, clean);
        if (phoneLimited) return phoneLimited;

        await connectToDatabase();
        const user = await User.findOne({ phone: clean });
        const isMatch = user ? await user.comparePassword(password) : false;
        if (!user || !isMatch) {
            // Same message whether the number exists or not
            return NextResponse.json({ error: GENERIC }, { status: 401 });
        }
        if (user.disabled) {
            return NextResponse.json({ error: 'Your account has been deactivated by arena management. Please contact support.' }, { status: 403 });
        }

        const tokenPayload = {
            userId: user._id.toString(),
            id: user._id.toString(),
            name: user.name,
            phone: user.phone,
            role: user.role,
            email: user.email,
            playingPosition: user.playingPosition,
            teamId: user.teamId
        };
        const token = signJwtToken(tokenPayload);
        const userJson = user.toJSON();

        const response = NextResponse.json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            user: userJson
        }, { status: 200 });
        setAuthCookies(response, token, userJson);
        return response;
    }
    catch (err) {
        console.error('Login API error:', err);
        return NextResponse.json({ error: 'An error occurred during login. Please try again.' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const authUser = await getAuthUserFromRequest(request);
        if (!authUser) {
            return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
        }
        return NextResponse.json({ authenticated: true, user: authUser }, { status: 200 });
    }
    catch (err) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
