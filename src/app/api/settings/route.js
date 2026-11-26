import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/setting-model';
import { requirePermission, can } from '@/lib/apiAuth';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { SETTINGS_SCHEMA, validateSlotPrices, validateBookingAddOns, isDayName } from '@/lib/schemas';
import { isEpsConfigured } from '@/service/eps-service';

const PRICING_KEYS = ['slotPrices', 'bookingAddOns', 'morningSlotPrice', 'afternoonSlotPrice', 'eveningSlotPrice', 'weekendSurcharge', 'advanceAmount', 'holdMinutes', 'bookingWindowDays', 'cancellationHours', 'weekendDays', 'approveResultsFirst'];

/** Split one Setting document into the two shapes the client uses. */
function shape(settings, paymentGateways) {
    const json = typeof settings.toJSON === 'function' ? settings.toJSON() : settings;
    const pricing = {};
    for (const k of PRICING_KEYS) pricing[k] = json[k];
    return { settings: json, pricing, ...(paymentGateways ? { paymentGateways } : {}) };
}

async function gatewaySummary() {
    // EPS is the only online payment gateway.
    const eps = await isEpsConfigured();
    return { eps, active: eps ? 'eps' : 'none' };
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

        const touchesPricing = merged.slotPrices !== undefined || merged.bookingAddOns !== undefined || Object.keys(data).some(k => PRICING_KEYS.includes(k));
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

        let bookingAddOns;
        if (merged.bookingAddOns !== undefined) {
            const checkedAddOns = validateBookingAddOns(merged.bookingAddOns);
            if (checkedAddOns.error) return badRequest(checkedAddOns.error);
            bookingAddOns = checkedAddOns.value;
        }

        await connectToDatabase();
        const settings = await Setting.getOrCreateSettings();

        if (bookingAddOns !== undefined) {
            const nextIds = new Set(bookingAddOns.map(a => a.id));
            const removedAny = (settings.bookingAddOns || []).some(existing => existing?.id && !nextIds.has(existing.id));
            if (removedAny && user.role !== 'admin') {
                return NextResponse.json(
                    { error: 'Only Super Admin has permission to delete turf equipment add-ons.' },
                    { status: 403 }
                );
            }
            settings.bookingAddOns = bookingAddOns;
            settings.bookingAddOnsSeeded = true;
        }

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
