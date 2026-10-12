import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Challenge } from '@/models/Challenge';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'open';

        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const challenges = await Challenge.find(query).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            count: challenges.length,
            challenges: challenges.map(c => c.toJSON())
        });
    } catch (err) {
        console.error('GET /api/challenges error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to fetch challenges' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        const {
            teamName,
            captainName,
            captainPhone,
            courtName,
            date,
            timeSlot,
            format,
            level,
            lookingFor,
            costShare,
            notes
        } = body;

        if (!teamName || !captainName || !captainPhone || !date || !timeSlot) {
            return NextResponse.json(
                { error: 'Team name, captain name, mobile, date, and time slot are required.' },
                { status: 400 }
            );
        }

        const newChallenge = await Challenge.create({
            teamName: teamName.trim(),
            captainName: captainName.trim(),
            captainPhone: captainPhone.trim(),
            courtName: courtName || 'Crossbar Metro Arena',
            date,
            timeSlot,
            format: format || '7 vs 7 Friendly Match',
            level: level || 'Casual',
            lookingFor: lookingFor || 'Opponent Team',
            costShare: costShare || '50/50 Split',
            notes: notes || '',
            status: 'open'
        });

        return NextResponse.json({
            success: true,
            challenge: newChallenge.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/challenges error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to create challenge' },
            { status: 500 }
        );
    }
}
