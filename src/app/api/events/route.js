import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Tournament } from '@/models/Tournament';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { TOURNAMENT_SCHEMA } from '@/lib/schemas';


export async function GET() {
    try {
        await connectToDatabase();
        const tournaments = await Tournament.find().sort({ createdAt: -1 });
        return NextResponse.json({
            success: true,
            count: tournaments.length,
            tournaments: tournaments.map(t => t.toJSON())
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/events');
    }
}

export async function POST(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error } = validate(body, TOURNAMENT_SCHEMA);
        if (error) return badRequest(error);

        await connectToDatabase();
        const tournament = new Tournament({
            ...data,
            registrationDeadline: data.registrationDeadline || data.dates,
            registeredCount: 0,
            status: 'open'
        });
        await tournament.save();

        return NextResponse.json({
            success: true,
            message: 'Tournament event created successfully',
            tournament: tournament.toJSON()
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/events');
    }
}
