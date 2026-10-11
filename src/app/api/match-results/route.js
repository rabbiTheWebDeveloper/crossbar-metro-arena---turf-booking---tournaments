import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MatchResult } from '@/models/MatchResult';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const query = {};
        if (status) query.status = status;

        const results = await MatchResult.find(query).sort({ date: -1, createdAt: -1 });
        return NextResponse.json({
            success: true,
            count: results.length,
            matchResults: results.map(r => r.toJSON())
        });
    } catch (err) {
        console.error('GET /api/match-results error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const targetId = body.id || body._id;

        if (targetId) {
            const existing = await MatchResult.findById(targetId);
            if (existing) {
                if (body.status) existing.status = body.status;
                if (body.homeScore !== undefined) existing.homeScore = Number(body.homeScore);
                if (body.awayScore !== undefined) existing.awayScore = Number(body.awayScore);
                if (body.playerOfTheMatch !== undefined) existing.playerOfTheMatch = body.playerOfTheMatch;
                if (body.matchReport !== undefined) existing.matchReport = body.matchReport;
                if (body.scorers) existing.scorers = body.scorers;

                await existing.save();

                return NextResponse.json({
                    success: true,
                    message: 'Match result updated successfully',
                    matchResult: existing.toJSON()
                });
            }
        }

        const { date, slotDisplay, homeTeam, awayTeam, homeScore, awayScore, scorers, playerOfTheMatch, matchReport, teamPhoto, status } = body;

        if (!date || !homeTeam || !awayTeam || homeScore === undefined || awayScore === undefined) {
            return NextResponse.json(
                { error: 'Date, teams, and scores are required.' },
                { status: 400 }
            );
        }

        const newResult = new MatchResult({
            date,
            slotDisplay: slotDisplay || '07:30 PM – 09:00 PM',
            courtName: body.courtName || 'Crossbar Metro Arena (Main Turf)',
            homeTeam: homeTeam.trim(),
            awayTeam: awayTeam.trim(),
            homeScore: Number(homeScore),
            awayScore: Number(awayScore),
            scorers: scorers || [],
            yellowCards: Number(body.yellowCards || 0),
            redCards: Number(body.redCards || 0),
            playerOfTheMatch: playerOfTheMatch || '',
            matchReport: matchReport || '',
            teamPhoto: teamPhoto || '',
            matchType: body.matchType || '7v7 Friendly',
            postedBy: body.postedBy || 'Admin Desk',
            postedAt: new Date().toISOString(),
            status: status || 'published'
        });

        await newResult.save();

        return NextResponse.json({
            success: true,
            message: 'Match result saved successfully',
            matchResult: newResult.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/match-results error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
