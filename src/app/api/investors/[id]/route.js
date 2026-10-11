import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Investor } from '@/models/Investor';

export async function PUT(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await request.json();

        const investor = await Investor.findById(id);
        if (!investor) {
            return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
        }

        if (body.name) investor.name = body.name.trim();
        if (body.email !== undefined) investor.email = body.email.trim();
        if (body.phone) investor.phone = body.phone.trim();
        if (body.sharePercentage !== undefined) investor.sharePercentage = Number(body.sharePercentage);
        if (body.capitalInvested !== undefined) investor.capitalInvested = Number(body.capitalInvested);
        if (body.status) investor.status = body.status;

        await investor.save();

        return NextResponse.json({
            success: true,
            message: 'Investor updated successfully',
            investor: investor.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(_request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        await Investor.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Investor deleted successfully' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
