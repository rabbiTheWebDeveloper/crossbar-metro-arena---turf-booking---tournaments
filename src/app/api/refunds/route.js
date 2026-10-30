import { NextResponse } from 'next/server';
import { requireAdmin, requireRole } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Refund } from '@/models/Refund';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { REFUND_SCHEMA, REFUND_STATUSES } from '@/lib/schemas';

export async function GET(request) {
    try {
        const { denied } = await requireRole(request, ['admin', 'investor']);
        if (denied) return denied;
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const query = {};
        if (status) {
            if (!REFUND_STATUSES.includes(status)) return badRequest('Invalid status filter.');
            query.status = status;
        }

        const refunds = await Refund.find(query).sort({ requestDate: -1 });
        return NextResponse.json({
            success: true,
            count: refunds.length,
            refunds: refunds.map(r => r.toJSON())
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/refunds');
    }
}

export async function POST(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error } = validate(body, REFUND_SCHEMA);
        if (error) return badRequest(error);
        if (data.amount <= 0) return badRequest('Refund amount must be greater than zero.');

        await connectToDatabase();
        const refund = new Refund({
            ...data,
            customerPhone: data.customerPhone || '',
            status: 'pending',
            requestDate: new Date().toISOString().split('T')[0],
            recordedBy: 'Admin Desk'
        });
        await refund.save();

        return NextResponse.json({
            success: true,
            message: 'Refund request created',
            refund: refund.toJSON()
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/refunds');
    }
}
