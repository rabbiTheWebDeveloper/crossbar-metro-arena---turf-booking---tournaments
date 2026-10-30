import { NextResponse } from 'next/server';
import { requireAdmin, requireRole, escapeRegex } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/models/Expense';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { EXPENSE_SCHEMA } from '@/lib/schemas';

export async function GET(request) {
    try {
        const { denied } = await requireRole(request, ['admin', 'investor']);
        if (denied) return denied;
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month'); // e.g. "2026-10"
        const category = searchParams.get('category');

        const query = {};
        if (month) {
            if (!/^\d{4}-\d{2}$/.test(month)) return badRequest('Month must look like 2026-10.');
            query.date = { $regex: `^${escapeRegex(month)}` };
        }
        if (category) query.category = String(category);

        const expenses = await Expense.find(query).sort({ date: -1 });
        return NextResponse.json({
            success: true,
            count: expenses.length,
            expenses: expenses.map(e => e.toJSON())
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/expenses');
    }
}

export async function POST(request) {
    try {
        const { denied, user } = await requireAdmin(request);
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error } = validate(body, EXPENSE_SCHEMA);
        if (error) return badRequest(error);

        await connectToDatabase();
        const expense = new Expense({ ...data, recordedBy: user?.name || 'Admin' });
        await expense.save();

        return NextResponse.json({
            success: true,
            message: 'Expense recorded successfully',
            expense: expense.toJSON()
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/expenses');
    }
}
