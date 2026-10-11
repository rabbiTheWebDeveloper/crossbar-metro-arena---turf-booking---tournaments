import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/models/Expense';

export async function DELETE(_request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        await Expense.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
