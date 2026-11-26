import { NextResponse } from 'next/server';
import { requirePermission, requireSuperAdminDelete, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { BookingAddOn } from '@/models/booking-addon-model';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { BOOKING_ADDON_SCHEMA } from '@/lib/schemas';

async function findAddOnByParam(idOrSlug) {
    if (isObjectId(idOrSlug)) {
        return BookingAddOn.findById(idOrSlug);
    }
    return BookingAddOn.findOne({ slug: String(idOrSlug || '').trim().toLowerCase() });
}

/** PATCH /api/booking-addons/:id — update name, price, description, or visibility (`pricing` permission). */
export async function PATCH(request, { params }) {
    try {
        const { denied } = await requirePermission(request, 'pricing');
        if (denied) return denied;
        const { id } = await params;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error } = validate(body, BOOKING_ADDON_SCHEMA, { partial: true });
        if (error) return badRequest(error);

        await connectToDatabase();
        const addOn = await findAddOnByParam(id);
        if (!addOn) {
            return NextResponse.json({ error: 'Equipment add-on not found.' }, { status: 404 });
        }

        addOn.set(data);
        await addOn.save();

        return NextResponse.json({
            success: true,
            message: `Add-on "${addOn.name}" updated.`,
            addOn: addOn.toJSON()
        });
    } catch (err) {
        return errorResponse(err, 'PATCH /api/booking-addons/[id]');
    }
}

/** DELETE /api/booking-addons/:id — permanently remove an equipment add-on (Super Admin ONLY). */
export async function DELETE(request, { params }) {
    try {
        const { denied } = await requireSuperAdminDelete(request);
        if (denied) return denied;
        const { id } = await params;

        await connectToDatabase();
        const addOn = await findAddOnByParam(id);
        if (!addOn) {
            return NextResponse.json({ error: 'Equipment add-on not found.' }, { status: 404 });
        }

        const deletedName = addOn.name;
        await BookingAddOn.deleteOne({ _id: addOn._id });

        return NextResponse.json({
            success: true,
            message: `Add-on "${deletedName}" deleted.`
        });
    } catch (err) {
        return errorResponse(err, 'DELETE /api/booking-addons/[id]');
    }
}
