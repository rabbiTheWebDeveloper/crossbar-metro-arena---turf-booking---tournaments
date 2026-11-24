import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/setting-model';
import { requirePermission, can } from '@/lib/apiAuth';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { SETTINGS_SCHEMA, validateSlotPrices, isDayName } from '@/lib/schemas';
import { isEpsConfigured } from '@/service/eps-service';
import { isGatewayConfigured as isSslConfigured } from '@/lib/sslcommerz';

const PRICING_KEYS = ['slotPrices', 'morningSlotPrice', 'afternoonSlotPrice', 'eveningSlotPrice', 'weekendSurcharge', 'advanceAmount', 'holdMinutes', 'bookingWindowDays', 'cancellationHours', 'weekendDays', 'approveResultsFirst'];

/** Split one Setting document into the two shapes the client uses. */
function shape(settings, paymentGateways) {
    const json = typeof settings.toJSON === 'function' ? settings.toJSON() : settings;
    const pricing = {};
    for (const k of PRICING_KEYS) pricing[k] = json[k];
    return { settings: json, pricing, ...(paymentGateways ? { paymentGateways } : {}) };
}

async function gatewaySummary() {
    const eps = await isEpsConfigured();
    const sslcommerz = isSslConfigured();
    return {
        eps,
        sslcommerz,
        active: eps ? 'eps' : (sslcommerz ? 'sslcommerz' : 'none')
    };
}

export async function GET() {
    try {
        await connectToDatabase();
        const [settings, paymentGateways] = await Promise.all([
            Setting.getOrCreateSettings(),
            gatewaySummary()
        ]);
        return NextResponse.json({ success: true, ...shape(settings, paymentGateways) });
    } catch (err) {
        return errorResponse(err, 'GET /api/settings');
    }
}

export async function PUT(request) {
    try {
        // Venue details need the settings permission; prices and booking rules need the pricing permission
        const { user, denied } = await requirePermission(request, ['settings', 'pricing']);
        if (denied) return denied;

        const { body: raw, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        // Accept flat fields, { pricing: {...} } or { settings: {...} }
        const merged = { ...(raw.settings || {}), ...(raw.pricing || {}), ...raw };
        delete merged.settings;
        delete merged.pricing;

        const { data, error } = validate(merged, SETTINGS_SCHEMA, { partial: true });
        if (error) return badRequest(error);

        const touchesPricing = merged.slotPrices !== undefined || Object.keys(data).some(k => PRICING_KEYS.includes(k));
        const touchesVenue = Object.keys(data).some(k => !PRICING_KEYS.includes(k));
        if ((touchesPricing && !can(user, 'pricing')) || (touchesVenue && !can(user, 'settings'))) {
            return NextResponse.json({ error: 'You do not have permission to change those settings.' }, { status: 403 });
        }

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
