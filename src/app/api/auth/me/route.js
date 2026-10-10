import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/serverAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
export async function GET(request) {
    try {
        const authUser = await getAuthUserFromRequest(request);
        if (!authUser) {
            return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
        }
        await connectToDatabase();
        const user = await User.findById(authUser.userId);
        if (!user || user.disabled) {
            return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
        }
        return NextResponse.json({
            authenticated: true,
            user: user.toJSON()
        });
    }
    catch (err) {
        return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
    }
}
