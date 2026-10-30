import { NextResponse } from 'next/server';
import { requireAdmin, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Tournament } from '@/models/Tournament';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { TOURNAMENT_SCHEMA } from '@/lib/schemas';

export async function PATCH(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error } = validate(body, TOURNAMENT_SCHEMA, { partial: true });
        if (error) return badRequest(error);

        await connectToDatabase();
        const tournament = await Tournament.findById(id);
        if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

        const maxTeams = data.maxTeams ?? tournament.maxTeams;
        const registered = data.registeredCount ?? tournament.registeredCount;
        if (maxTeams && registered > maxTeams) return badRequest('Registered teams cannot exceed the maximum number of teams.');

        tournament.set(data);
        await tournament.save();

        return NextResponse.json({
            success: true,
            message: 'Tournament updated successfully',
            tournament: tournament.toJSON()
        });
    } catch (err) {
        return errorResponse(err, 'PATCH /api/events/[id]');
    }
}

export async function DELETE(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        await connectToDatabase();
        await Tournament.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Tournament deleted successfully' });
    } catch (err) {
        return errorResponse(err, 'DELETE /api/events/[id]');
    }
}
