import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Refund } from '@/models/Refund';

export async function PATCH(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await request.json();

        const refund = await Refund.findById(id);
        if (!refund) {
            return NextResponse.json({ error: 'Refund record not found' }, { status: 404 });
        }

        if (body.status) refund.status = body.status;
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
