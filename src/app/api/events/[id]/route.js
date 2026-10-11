import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Tournament } from '@/models/Tournament';

export async function PATCH(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
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

export async function DELETE(_request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        await Tournament.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Tournament deleted successfully' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
