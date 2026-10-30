import { NextResponse } from 'next/server';
import { requireAdmin, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Tournament } from '@/models/Tournament';

export async function PATCH(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        const body = await request.json();

        const tournament = await Tournament.findById(id);
        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        if (body.title) tournament.title = body.title.trim();
        if (body.dates) tournament.dates = body.dates;
        if (body.status) tournament.status = body.status;
        if (body.entryFee !== undefined) tournament.entryFee = Number(body.entryFee);
        if (body.prizePool !== undefined) tournament.prizePool = Number(body.prizePool);
        if (body.maxTeams !== undefined) tournament.maxTeams = Number(body.maxTeams);
        if (body.registeredCount !== undefined) tournament.registeredCount = Number(body.registeredCount);

        await tournament.save();

        return NextResponse.json({
            success: true,
            message: 'Tournament updated successfully',
            tournament: tournament.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        await Tournament.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Tournament deleted successfully' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
