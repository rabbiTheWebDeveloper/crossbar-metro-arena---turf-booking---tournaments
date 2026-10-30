import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/Setting';
import { requireAdmin } from '@/lib/apiAuth';

const PRICING_KEYS = ['slotPrices', 'morningSlotPrice', 'afternoonSlotPrice', 'eveningSlotPrice', 'weekendSurcharge', 'advanceAmount', 'holdMinutes', 'bookingWindowDays', 'cancellationHours', 'weekendDays', 'approveResultsFirst'];

/** Split one Setting document into the two shapes the client uses. */
function shape(settings) {
    const json = typeof settings.toJSON === 'function' ? settings.toJSON() : settings;
    const pricing = {};
    for (const k of PRICING_KEYS) pricing[k] = json[k];
    return { settings: json, pricing };
}

export async function GET() {
    try {
        await connectToDatabase();
        const settings = await Setting.getOrCreateSettings();
        return NextResponse.json({ success: true, ...shape(settings) });
    }
    catch (err) {
        console.error('Settings GET error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;

        const raw = await request.json();
        // Accept flat fields, { pricing: {...} } or { settings: {...} }
        const body = { ...(raw.settings || {}), ...(raw.pricing || {}), ...raw };
        delete body.settings;
        delete body.pricing;

        await connectToDatabase();
        const settings = await Setting.getOrCreateSettings();

        const stringFields = ['businessName', 'tagline', 'phone', 'phoneFormatted', 'whatsappUrl', 'email', 'address', 'metroStation', 'metroDetails', 'googleMapsUrl', 'facebookUrl', 'instagramUrl', 'website', 'openingHours', 'aboutText'];
        for (const f of stringFields) {
            if (typeof body[f] === 'string') settings[f] = body[f].trim();
        }

        if (Array.isArray(body.slotPrices) && body.slotPrices.length === 12) {
            const ok = body.slotPrices.every(s => Number(s.weekdayPrice) >= 0 && Number(s.weekendPrice) >= 0 && s.startTime && s.endTime);
            if (!ok) return NextResponse.json({ error: 'Every slot needs a start/end time and non-negative prices.' }, { status: 400 });
            settings.slotPrices = body.slotPrices.map(s => ({
                slotNumber: Number(s.slotNumber),
                startTime: s.startTime,
                endTime: s.endTime,
                displayTime: s.displayTime,
                period: s.period,
                weekdayPrice: Number(s.weekdayPrice),
                weekendPrice: Number(s.weekendPrice)
            }));
        }
        const numberFields = ['morningSlotPrice', 'afternoonSlotPrice', 'eveningSlotPrice', 'weekendSurcharge', 'advanceAmount', 'holdMinutes', 'bookingWindowDays', 'cancellationHours'];
        for (const f of numberFields) {
            if (body[f] !== undefined && !Number.isNaN(Number(body[f])) && Number(body[f]) >= 0) settings[f] = Number(body[f]);
        }
        if (Array.isArray(body.weekendDays)) settings.weekendDays = body.weekendDays.filter(d => typeof d === 'string');
        if (typeof body.approveResultsFirst === 'boolean') settings.approveResultsFirst = body.approveResultsFirst;

        await settings.save();
        return NextResponse.json({
            success: true,
            message: 'Arena settings and slot pricing updated.',
            ...shape(settings)
        });
    }
    catch (err) {
        console.error('Settings PUT error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
