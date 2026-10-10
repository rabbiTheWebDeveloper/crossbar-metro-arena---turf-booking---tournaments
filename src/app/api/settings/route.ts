import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/Setting';
import { getAuthUserFromRequest } from '@/lib/serverAuth';

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await Setting.getOrCreateSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    
    // In production, check if user is admin
    if (authUser && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only Arena Admin can update settings.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    await connectToDatabase();

    const settings = await Setting.getOrCreateSettings();

    // Update allowable fields
    if (body.businessName) settings.businessName = body.businessName;
    if (body.tagline) settings.tagline = body.tagline;
    if (body.phone) settings.phone = body.phone;
    if (body.phoneFormatted) settings.phoneFormatted = body.phoneFormatted;
    if (body.whatsappUrl) settings.whatsappUrl = body.whatsappUrl;
    if (body.email) settings.email = body.email;
    if (body.address) settings.address = body.address;
    if (body.aboutText) settings.aboutText = body.aboutText;
    if (body.openingHours) settings.openingHours = body.openingHours;

    // Pricing & Rules updates
    if (Array.isArray(body.slotPrices) && body.slotPrices.length === 12) {
      settings.slotPrices = body.slotPrices;
    }
    if (typeof body.advanceAmount === 'number') settings.advanceAmount = body.advanceAmount;
    if (typeof body.holdMinutes === 'number') settings.holdMinutes = body.holdMinutes;
    if (typeof body.bookingWindowDays === 'number') settings.bookingWindowDays = body.bookingWindowDays;
    if (typeof body.cancellationHours === 'number') settings.cancellationHours = body.cancellationHours;
    if (typeof body.approveResultsFirst === 'boolean') settings.approveResultsFirst = body.approveResultsFirst;

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Arena settings and 24-slot pricing matrix updated successfully.',
      settings
    });
  } catch (err: any) {
    console.error('Settings PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
