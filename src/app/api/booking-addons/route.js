import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { stampCreate } from '@/lib/audit';
import { connectToDatabase } from '@/lib/mongodb';
import { BookingAddOn } from '@/models/booking-addon-model';
import { BOOKING_ADDONS } from '@/data/initialData';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { BOOKING_ADDON_SCHEMA } from '@/lib/schemas';

/** GET /api/booking-addons — public list of turf equipment add-ons (seeds defaults once on fresh DB). */
export async function GET(request) {
    try {
        await connectToDatabase();
        await BookingAddOn.ensureSeeded();

        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === '1';
        const query = activeOnly ? { enabled: { $ne: false } } : {};

        const items = await BookingAddOn.find(query).sort({ sortOrder: 1, createdAt: 1 });
        return NextResponse.json({
            success: true,
            count: items.length,
            addOns: items.map(item => item.toJSON())
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/booking-addons');
    }
}

/** POST /api/booking-addons — create a new equipment add-on or restore the 4 built-in defaults. */
export async function POST(request) {
    try {
        const { user, denied } = await requirePermission(request, 'pricing');
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        await connectToDatabase();
        await BookingAddOn.ensureSeeded();

        if (body.action === 'restore_defaults') {
            for (let i = 0; i < BOOKING_ADDONS.length; i++) {
                const tpl = BOOKING_ADDONS[i];
                const exists = await BookingAddOn.findOne({ slug: tpl.id });
                if (!exists) {
                    await BookingAddOn.create({
                        slug: tpl.id,
                        name: tpl.name,
                        description: tpl.description || '',
                        price: Number(tpl.price) || 0,
                        enabled: true,
                        sortOrder: i + 1,
                        ...stampCreate(user, { fallback: 'Admin Desk' })
                    });
                }
            }
            const all = await BookingAddOn.find({}).sort({ sortOrder: 1, createdAt: 1 });
            return NextResponse.json({
                success: true,
                message: 'Default turf equipment add-ons restored.',
                addOns: all.map(item => item.toJSON())
            });
        }

        const total = await BookingAddOn.countDocuments();
        if (total >= 30) {
            return badRequest('You can configure at most 30 turf equipment add-ons.');
        }

        const { data, error } = validate(body, BOOKING_ADDON_SCHEMA);
        if (error) return badRequest(error);

        const slug = await BookingAddOn.buildUniqueSlug(data.name);
        const created = await BookingAddOn.create({
            ...data,
            slug,
            sortOrder: body.sortOrder !== undefined ? data.sortOrder : total + 1,
            ...stampCreate(user, { fallback: 'Admin Desk' })
        });

        return NextResponse.json({
            success: true,
            message: `Add-on "${created.name}" added.`,
            addOn: created.toJSON()
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/booking-addons');
    }
}
