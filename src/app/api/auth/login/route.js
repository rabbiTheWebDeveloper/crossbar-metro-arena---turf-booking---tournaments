import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signJwtToken, setAuthCookies, getAuthUserFromRequest } from '@/lib/serverAuth';
import { INITIAL_USERS } from '@/data/initialData';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        if (!phone || !password) {
            return NextResponse.json(
                { error: 'Please enter both your mobile number and password.' },
                { status: 400 }
            );
        }

        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('8801')) {
            cleanPhone = cleanPhone.substring(2);
        }

        if (cleanPhone.length < 11) {
            return NextResponse.json(
                { error: 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).' },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        await connectToDatabase();

        // Auto-seed initial demo users if collection is empty
        const count = await User.countDocuments();
        if (count === 0) {
            console.log('🌱 Seeding initial demo users into MongoDB...');
            for (const u of INITIAL_USERS) {
                let uPhone = u.phone.replace(/[^0-9]/g, '');
                if (uPhone.startsWith('8801')) uPhone = uPhone.substring(2);

                const doc = new User({
                    name: u.name,
                    phone: uPhone,
                    password: u.password || 'password123',
                    role: u.role,
                    playingPosition: u.playingPosition || 'MID',
                    email: u.email,
                    disabled: false
                });
                await doc.save();
            }
        }

        // Find user by clean phone
        const user = await User.findOne({ phone: cleanPhone });
        if (!user) {
            return NextResponse.json(
                { error: 'No account found with this mobile number. Please sign up first.' },
                { status: 401 }
            );
        }

        if (user.disabled) {
            return NextResponse.json(
                { error: 'Your account has been deactivated by arena management. Please contact support.' },
                { status: 403 }
            );
        }

        // Verify password with bcrypt
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json(
                { error: 'Incorrect password. Please try again or use 1-Click Demo Profiles.' },
                { status: 401 }
            );
        }

        // Generate JWT Token
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
            user: userJson,
            token
        }, { status: 200 });

        // Set secure HTTP-only auth token & client user info cookies
        setAuthCookies(response, token, userJson);

        return response;
    }
    catch (err) {
        console.error('Login API error:', err);
        return NextResponse.json(
            { error: err.message || 'An error occurred during login. Please try again.' },
            { status: 500 }
        );
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
        return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
    }
}
