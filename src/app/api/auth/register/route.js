import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signJwtToken, setAuthCookies } from '@/lib/serverAuth';
import { rateLimit } from '@/lib/apiAuth';

export async function POST(request) {
    try {
        const limited = rateLimit(request, 'register', 10, 60 * 60 * 1000);
        if (limited) return limited;
        const body = await request.json().catch(() => ({}));
        const { name, phone, password, playingPosition, email } = body;

        // Validate name
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return NextResponse.json(
                { error: 'Please enter your full name (minimum 2 characters).' },
                { status: 400 }
            );
        }

        // Clean and validate Bangladeshi mobile number
        let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('8801')) {
            cleanPhone = cleanPhone.substring(2);
        }

        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(cleanPhone)) {
            return NextResponse.json(
                { error: 'Please enter a valid 11-digit Bangladeshi mobile number starting with 01 (e.g. 01711223344).' },
                { status: 400 }
            );
        }

        // Validate password
        if (!password || typeof password !== 'string' || password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long.' },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        await connectToDatabase();

        // Check if phone is already registered
        const existing = await User.findOne({ phone: cleanPhone });
        if (existing) {
            return NextResponse.json(
                { error: 'This mobile number is already registered. Please log in instead.' },
                { status: 409 }
            );
        }

        // Public sign-up always creates a player. Admin / investor roles are only granted by an admin
        // from the Players page (PATCH /api/users/:id), never from the client body.
        const assignedRole = 'player';

        const newUser = new User({
            name: name.trim(),
            phone: cleanPhone,
            password,
            role: assignedRole,
            playingPosition: playingPosition || 'MID',
            email: email?.trim().toLowerCase() || `${cleanPhone}@bookcrossbar.com`,
            disabled: false
        });

        await newUser.save();

        // Generate JWT
        const tokenPayload = {
            userId: newUser._id.toString(),
            id: newUser._id.toString(),
            name: newUser.name,
            phone: newUser.phone,
            role: newUser.role,
            email: newUser.email,
            playingPosition: newUser.playingPosition
        };
        const token = signJwtToken(tokenPayload);
        const userJson = newUser.toJSON();

        const response = NextResponse.json({
            success: true,
            message: 'Account registered successfully. Welcome to Crossbar Metro Arena!',
            user: userJson
        }, { status: 201 });

        // Set secure HTTP-only cookie + client user info cookie
        setAuthCookies(response, token, userJson);

        return response;
    }
    catch (err) {
        console.error('Registration API error:', err);
        return NextResponse.json(
            { error: 'An error occurred during registration. Please try again.' },
            { status: 500 }
        );
    }
}
