import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Tournament } from '@/models/Tournament';

export async function GET(request) {
    try {
        await connectToDatabase();
        const tournaments = await Tournament.find().sort({ createdAt: -1 });
        return NextResponse.json({
            success: true,
            count: tournaments.length,
            tournaments: tournaments.map(t => t.toJSON())
        });
    } catch (err) {
        console.error('GET /api/events error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const body = await request.json();
        const { title, edition, category, format, dates, registrationDeadline, entryFee, prizePool, maxTeams, highlights, rules } = body;

        if (!title || !dates || entryFee === undefined) {
            return NextResponse.json(
                { error: 'Tournament title, dates, and entry fee are required.' },
                { status: 400 }
            );
        }

        const newTournament = new Tournament({
            title: title.trim(),
            edition: edition || 'Season Trophy',
            category: category || '7v7 Championship',
            format: format || '7 vs 7 Knockouts',
            dates,
            registrationDeadline: registrationDeadline || dates,
            entryFee: Number(entryFee),
            prizePool: Number(prizePool || 0),
            firstPrize: body.firstPrize || '',
            runnerUpPrize: body.runnerUpPrize || '',
            maxTeams: Number(maxTeams || 16),
            registeredCount: 0,
            status: 'open',
            highlights: highlights || [],
            rules: rules || [],
            bannerUrl: body.bannerUrl || ''
        });

        await newTournament.save();

        return NextResponse.json({
            success: true,
            message: 'Tournament event created successfully',
            tournament: newTournament.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/events error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
