import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signJwtToken, TOKEN_COOKIE_NAME } from '@/lib/serverAuth';
import { INITIAL_USERS } from '@/data/initialData';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Please enter both your mobile number and password.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid Bangladeshi mobile number (e.g. 01711223344).' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Auto-seed initial users if collection is empty
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial demo users into MongoDB...');
      for (const u of INITIAL_USERS) {
        const doc = new User({
          name: u.name,
          phone: u.phone.replace(/[^0-9]/g, ''),
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

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Incorrect password. Please try again or use SMS Code reset.' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = signJwtToken({
      userId: user._id.toString(),
      name: user.name,
      phone: user.phone,
      role: user.role,
      email: user.email,
      playingPosition: user.playingPosition,
      teamId: user.teamId
    });

    const userJson = user.toJSON();

    const response = NextResponse.json(
      {
        success: true,
        message: `Welcome back, ${user.name}!`,
        user: userJson,
        token
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    return response;
  } catch (err: any) {
    console.error('Login API error:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
