import { NextResponse } from 'next/server';
import { requireAdmin, requireRole, escapeRegex } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { OtherIncome } from '@/models/OtherIncome';

export async function GET(request) {
    try {
        const { denied } = await requireRole(request, ['admin', 'investor']);
        if (denied) return denied;
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        const query = {};
        if (month) query.date = { $regex: `^${escapeRegex(month)}` };

        const income = await OtherIncome.find(query).sort({ date: -1 });
        return NextResponse.json({
            success: true,
            count: income.length,
            otherIncome: income.map(o => o.toJSON())
        });
    } catch (err) {
        console.error('GET /api/other-income error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const body = await request.json();
        const { source, title, amount, date, notes, recordedBy } = body;

        if (!title || amount === undefined || !date) {
            return NextResponse.json({ error: 'Title, amount, and date are required.' }, { status: 400 });
        }

        const newIncome = new OtherIncome({
            source: source || 'other',
            title: title.trim(),
            amount: Number(amount),
            date,
            notes: notes || '',
            recordedBy: recordedBy || 'Staff'
        });

        await newIncome.save();

        return NextResponse.json({
            success: true,
            message: 'Income recorded successfully',
            otherIncome: newIncome.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/other-income error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
