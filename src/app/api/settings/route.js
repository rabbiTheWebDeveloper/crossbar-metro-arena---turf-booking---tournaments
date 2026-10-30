import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/Setting';
import { requireAdmin } from '@/lib/apiAuth';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { SETTINGS_SCHEMA, validateSlotPrices, isDayName } from '@/lib/schemas';

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
    } catch (err) {
        return errorResponse(err, 'GET /api/settings');
    }
}

export async function PUT(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;

        const { body: raw, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        // Accept flat fields, { pricing: {...} } or { settings: {...} }
        const merged = { ...(raw.settings || {}), ...(raw.pricing || {}), ...raw };
        delete merged.settings;
        delete merged.pricing;

        const { data, error } = validate(merged, SETTINGS_SCHEMA, { partial: true });
        if (error) return badRequest(error);

        if (data.weekendDays && !data.weekendDays.every(isDayName)) return badRequest('Weekend days must be full day names such as Friday.');

        let slotPrices;
        if (Array.isArray(merged.slotPrices) && merged.slotPrices.length > 0) {
            const checked = validateSlotPrices(merged.slotPrices);
            if (checked.error) return badRequest(checked.error);
            slotPrices = checked.value;
        } else if (merged.slotPrices !== undefined && !Array.isArray(merged.slotPrices)) {
            return badRequest('Slot prices must be a list of 12 slots.');
        }

        await connectToDatabase();
        const settings = await Setting.getOrCreateSettings();
        settings.set(data);
        if (slotPrices) settings.slotPrices = slotPrices;
        await settings.save();

        return NextResponse.json({
            success: true,
            message: 'Arena settings and slot pricing updated.',
            ...shape(settings)
        });
    } catch (err) {
        return errorResponse(err, 'PUT /api/settings');
    }
}
