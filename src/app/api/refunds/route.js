import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { actorLabel, stampCreate } from '@/lib/audit';
import { connectToDatabase } from '@/lib/mongodb';
import { Refund } from '@/models/refund-model';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { REFUND_SCHEMA, REFUND_STATUSES } from '@/lib/schemas';

export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, ['refunds', 'finance'], { alsoRoles: ['investor'] });
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
        const { user, denied } = await requirePermission(request, 'refunds');
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
            recordedBy: actorLabel(user, 'Admin Desk'),
            ...stampCreate(user, { fallback: 'Admin Desk' })
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
