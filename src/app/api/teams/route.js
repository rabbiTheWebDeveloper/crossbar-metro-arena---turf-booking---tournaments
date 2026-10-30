import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Team } from '@/models/Team';

export async function GET() {
    try {
        await connectToDatabase();
        const teams = await Team.find().sort({ 'stats.points': -1, createdAt: -1 });
        return NextResponse.json({
            success: true,
            count: teams.length,
            teams: teams.map(t => t.toJSON())
        });
    } catch (err) {
        console.error('GET /api/teams error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { name, shortCode, captainName, captainPhone, homeColor, area, players } = body;

        if (!name || !captainName || !captainPhone) {
            return NextResponse.json({ error: 'Team name and captain info are required.' }, { status: 400 });
        }

        const existing = await Team.findOne({ name: name.trim() });
        if (existing) {
            return NextResponse.json({ error: 'A team with this name already exists.' }, { status: 409 });
        }

        const newTeam = new Team({
            name: name.trim(),
            shortCode: shortCode || name.slice(0, 4).toUpperCase(),
            captainName: captainName.trim(),
            captainPhone: captainPhone.trim(),
            homeColor: homeColor || '#4cbf02',
            area: area || 'Uttara, Dhaka',
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: [] },
            players: players || []
        });

        await newTeam.save();

        return NextResponse.json({
            success: true,
            message: 'Team registered successfully',
            team: newTeam.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/teams error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
