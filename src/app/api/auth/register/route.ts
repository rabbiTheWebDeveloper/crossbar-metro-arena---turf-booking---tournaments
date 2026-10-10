import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signJwtToken, TOKEN_COOKIE_NAME } from '@/lib/serverAuth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password, playingPosition, email } = body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    // Clean and validate Bangladeshi mobile number
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
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

    // Check if phone already registered
    const existing = await User.findOne({ phone: cleanPhone });
    if (existing) {
      return NextResponse.json(
        { error: 'This mobile number is already registered. Please log in instead.' },
        { status: 409 }
      );
    }

    // Create new player account (default role 'player' per PRD section 2)
    const newUser = new User({
      name: name.trim(),
      phone: cleanPhone,
      password,
      role: 'player',
      playingPosition: playingPosition || 'MID',
      email: email?.trim().toLowerCase() || `${cleanPhone}@bookcrossbar.com`,
      disabled: false
    });

    await newUser.save();

    // Generate JWT
    const token = signJwtToken({
      userId: newUser._id.toString(),
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role,
      email: newUser.email,
      playingPosition: newUser.playingPosition
    });

    const userJson = newUser.toJSON();

    // Set secure HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully. Welcome to Crossbar Metro Arena!',
        user: userJson,
        token
      },
      { status: 201 }
    );

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
