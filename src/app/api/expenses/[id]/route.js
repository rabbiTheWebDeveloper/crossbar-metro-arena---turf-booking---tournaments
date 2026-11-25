import { NextResponse } from 'next/server';
import { requireSuperAdminDelete, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/models/expense-model';

export async function DELETE(request, { params }) {
    try {
        const { denied } = await requireSuperAdminDelete(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        await Expense.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
