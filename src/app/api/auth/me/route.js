import { NextResponse } from 'next/server';
import { getAuthUserFromRequest, setAuthCookies } from '@/lib/serverAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request) {
    try {
        const authUser = await getAuthUserFromRequest(request);
        if (!authUser) {
            return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
        }

        try {
            await connectToDatabase();
            const user = await User.findById(authUser.userId || authUser.id);
            if (user && !user.disabled) {
                const userJson = user.toJSON();
                const response = NextResponse.json({
                    authenticated: true,
                    user: userJson
                }, { status: 200 });
                return response;
            }
        } catch (dbErr) {
            console.warn('DB lookup in /api/auth/me fallback to JWT payload:', dbErr.message);
        }

        // Fallback to token payload if DB lookup temporary issue
        return NextResponse.json({
            authenticated: true,
            user: {
                id: authUser.userId || authUser.id,
                name: authUser.name,
                phone: authUser.phone,
                role: authUser.role,
                email: authUser.email,
                playingPosition: authUser.playingPosition,
                teamId: authUser.teamId
            }
        }, { status: 200 });
    }
    catch (err) {
        return NextResponse.json({ authenticated: false, error: err.message, user: null }, { status: 200 });
    }
}

/**
 * Model API: Update Current User Profile
 */
export async function PUT(request) {
    try {
        const authUser = await getAuthUserFromRequest(request);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, playingPosition } = body;

        await connectToDatabase();
        const user = await User.findById(authUser.userId || authUser.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        if (name && typeof name === 'string') user.name = name.trim();
        if (email !== undefined) user.email = email.trim().toLowerCase();
        if (playingPosition && ['GK', 'DEF', 'MID', 'FWD'].includes(playingPosition)) {
            user.playingPosition = playingPosition;
        }

        await user.save();
        const userJson = user.toJSON();

        const response = NextResponse.json({
            success: true,
            message: 'Profile updated successfully.',
            user: userJson
        });

        // Refresh client user cookie
        const isProd = process.env.NODE_ENV === 'production';
        response.cookies.set({
            name: 'cma_user',
            value: encodeURIComponent(JSON.stringify(userJson)),
            httpOnly: false,
            secure: isProd,
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60
        });

        return response;
    }
    catch (err) {
        console.error('Update profile API error:', err);
        return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
    }
}
