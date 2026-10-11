import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/models/Expense';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month'); // e.g. "2026-10"
        const category = searchParams.get('category');

        const query = {};
        if (month) query.date = { $regex: `^${month}` };
        if (category) query.category = category;

        const expenses = await Expense.find(query).sort({ date: -1 });
        return NextResponse.json({
            success: true,
            count: expenses.length,
            expenses: expenses.map(e => e.toJSON())
        });
    } catch (err) {
        console.error('GET /api/expenses error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { title, category, amount, date, receiptNote, recordedBy } = body;

        if (!title || amount === undefined || !date) {
            return NextResponse.json(
                { error: 'Title, amount, and date are required.' },
                { status: 400 }
            );
        }

        const newExpense = new Expense({
            title: title.trim(),
            category: category || 'other',
            amount: Number(amount),
            date,
            receiptNote: receiptNote || '',
            recordedBy: recordedBy || 'Admin'
        });

        await newExpense.save();

        return NextResponse.json({
            success: true,
            message: 'Expense recorded successfully',
            expense: newExpense.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/expenses error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
