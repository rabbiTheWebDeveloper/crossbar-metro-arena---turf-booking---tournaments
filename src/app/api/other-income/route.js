import { NextResponse } from 'next/server';
import { requireAdmin, requireRole, escapeRegex } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { OtherIncome } from '@/models/OtherIncome';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { OTHER_INCOME_SCHEMA } from '@/lib/schemas';

export async function GET(request) {
    try {
        const { denied } = await requireRole(request, ['admin', 'investor']);
        if (denied) return denied;
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        const query = {};
        if (month) {
            if (!/^\d{4}-\d{2}$/.test(month)) return badRequest('Month must look like 2026-10.');
            query.date = { $regex: `^${escapeRegex(month)}` };
        }

        const income = await OtherIncome.find(query).sort({ date: -1 });
        return NextResponse.json({
            success: true,
            count: income.length,
            otherIncome: income.map(o => o.toJSON())
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/other-income');
    }
}

export async function POST(request) {
    try {
        const { denied, user } = await requireAdmin(request);
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error } = validate(body, OTHER_INCOME_SCHEMA);
        if (error) return badRequest(error);

        await connectToDatabase();
        const income = new OtherIncome({ ...data, recordedBy: user?.name || 'Staff' });
        await income.save();

        return NextResponse.json({
            success: true,
            message: 'Income recorded successfully',
            otherIncome: income.toJSON()
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/other-income');
    }
}
