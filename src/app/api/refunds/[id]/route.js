import { NextResponse } from 'next/server';
import { requireAdmin, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Refund } from '@/models/Refund';

export async function PATCH(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        const body = await request.json();

        const refund = await Refund.findById(id);
        if (!refund) {
            return NextResponse.json({ error: 'Refund record not found' }, { status: 404 });
        }

        if (body.status) {
            if (!['pending', 'approved', 'completed', 'rejected'].includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            refund.status = body.status;
        }
        if (body.amount !== undefined && Number(body.amount) >= 0) refund.amount = Number(body.amount);
        if (body.recordedBy) refund.recordedBy = String(body.recordedBy).slice(0, 60);
        if (body.notes !== undefined) refund.notes = String(body.notes).slice(0, 300);
        if (body.refundMethod) refund.refundMethod = body.refundMethod;
        if (body.transactionRef) refund.transactionRef = body.transactionRef;
        if (body.refundedDate) {
            refund.refundedDate = body.refundedDate;
        } else if (body.status === 'completed' && !refund.refundedDate) {
            refund.refundedDate = new Date().toISOString().split('T')[0];
        }

        await refund.save();

        return NextResponse.json({
            success: true,
            message: 'Refund status updated successfully',
            refund: refund.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
