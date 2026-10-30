import { NextResponse } from 'next/server';
import { getAuthUserFromRequest, setAuthCookies, clearAuthCookies, signJwtToken } from '@/lib/serverAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { isObjectId } from '@/lib/apiAuth';

const tokenPayload = (user) => ({
    userId: user._id.toString(),
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    role: user.role,
    email: user.email,
    playingPosition: user.playingPosition,
    teamId: user.teamId
});

/** GET /api/auth/me - who am I (always re-checked against the database). */
export async function GET(request) {
    try {
        const authUser = await getAuthUserFromRequest(request);
        if (!authUser) {
            return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
        }
        const id = authUser.userId || authUser.id;
        if (!isObjectId(id)) {
            const res = NextResponse.json({ authenticated: false, user: null }, { status: 200 });
            return clearAuthCookies(res);
        }

        try {
            await connectToDatabase();
            const user = await User.findById(id);
            if (!user || user.disabled) {
                // Account removed or deactivated: end the session immediately
                const res = NextResponse.json({ authenticated: false, user: null, reason: user ? 'disabled' : 'not_found' }, { status: 200 });
                return clearAuthCookies(res);
            }
            const userJson = user.toJSON();
            const res = NextResponse.json({ authenticated: true, user: userJson }, { status: 200 });
            // Keep the readable user cookie in sync with the database (role/name changes)
            if (userJson.role !== authUser.role || userJson.name !== authUser.name) {
                setAuthCookies(res, signJwtToken(tokenPayload(user)), userJson);
            }
            return res;
        } catch (dbErr) {
            console.warn('DB lookup in /api/auth/me failed, using token payload:', dbErr.message);
            return NextResponse.json({
                authenticated: true,
                degraded: true,
                user: {
                    id, name: authUser.name, phone: authUser.phone, role: authUser.role,
                    email: authUser.email, playingPosition: authUser.playingPosition, teamId: authUser.teamId
                }
            }, { status: 200 });
        }
    }
    catch (err) {
        return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }
}

/**
 * PUT /api/auth/me - update my own profile.
 * Body: { name?, email?, playingPosition?, currentPassword?, newPassword? }
 */
export async function PUT(request) {
    try {
        const authUser = await getAuthUserFromRequest(request);
        if (!authUser || !isObjectId(authUser.userId || authUser.id)) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }
        const body = await request.json();

        await connectToDatabase();
        const user = await User.findById(authUser.userId || authUser.id);
        if (!user || user.disabled) {
            const res = NextResponse.json({ error: 'Account not available.' }, { status: 401 });
            return clearAuthCookies(res);
        }

        if (body.name !== undefined) {
            const name = String(body.name || '').trim();
            if (name.length < 2) return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
            user.name = name;
        }
        if (body.email !== undefined) {
            const email = String(body.email || '').trim().toLowerCase();
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
            user.email = email;
        }
        if (body.playingPosition !== undefined) {
            if (!['GK', 'DEF', 'MID', 'FWD'].includes(body.playingPosition)) return NextResponse.json({ error: 'Invalid playing position.' }, { status: 400 });
            user.playingPosition = body.playingPosition;
        }
        if (body.newPassword) {
            const next = String(body.newPassword);
            if (next.length < 6) return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
            const ok = await user.comparePassword(String(body.currentPassword || ''));
            if (!ok) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
            user.password = next; // hashed by the pre-save hook
        }

        await user.save();
        const userJson = user.toJSON();
        const response = NextResponse.json({ success: true, message: 'Profile updated successfully.', user: userJson });
        // Re-issue the token so the name/position in the JWT match the database
        setAuthCookies(response, signJwtToken(tokenPayload(user)), userJson);
        return response;
    }
    catch (err) {
        console.error('Update profile API error:', err);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
