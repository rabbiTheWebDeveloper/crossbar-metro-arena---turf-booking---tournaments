import { NextResponse } from 'next/server';
import { requireAdmin, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Refund } from '@/models/Refund';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { REFUND_UPDATE_SCHEMA } from '@/lib/schemas';

export async function PATCH(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error } = validate(body, REFUND_UPDATE_SCHEMA, { partial: true });
        if (error) return badRequest(error);

        await connectToDatabase();
        const refund = await Refund.findById(id);
        if (!refund) return NextResponse.json({ error: 'Refund record not found' }, { status: 404 });

        if (refund.status === 'completed' && data.status && data.status !== 'completed') {
            return badRequest('A completed refund cannot be moved back to another status.');
        }
        if (data.amount !== undefined && data.amount <= 0) return badRequest('Refund amount must be greater than zero.');

        refund.set(data);
        if (data.status === 'completed' && !refund.refundedDate) {
            refund.refundedDate = new Date().toISOString().split('T')[0];
        }
        await refund.save();

        return NextResponse.json({
            success: true,
            message: 'Refund status updated successfully',
            refund: refund.toJSON()
        });
    } catch (err) {
        return errorResponse(err, 'PATCH /api/refunds/[id]');
    }
}
