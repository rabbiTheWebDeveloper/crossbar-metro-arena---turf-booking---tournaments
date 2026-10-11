import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MatchResult } from '@/models/MatchResult';

export async function PATCH(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await request.json();

        const result = await MatchResult.findById(id);
        if (!result) {
            return NextResponse.json({ error: 'Match result not found' }, { status: 404 });
        }

        if (body.status) result.status = body.status;
        if (body.homeScore !== undefined) result.homeScore = Number(body.homeScore);
        if (body.awayScore !== undefined) result.awayScore = Number(body.awayScore);
        if (body.scorers) result.scorers = body.scorers;
        if (body.playerOfTheMatch) result.playerOfTheMatch = body.playerOfTheMatch;
        if (body.matchReport) result.matchReport = body.matchReport;

        await result.save();

        return NextResponse.json({
            success: true,
            message: 'Match result updated successfully',
            matchResult: result.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(_request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        await MatchResult.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Match result deleted' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
