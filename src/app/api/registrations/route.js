import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentRegistration } from '@/models/TournamentRegistration';
import { Tournament } from '@/models/Tournament';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const tournamentId = searchParams.get('tournamentId');

        const query = {};
        if (status) query.status = status;
        if (tournamentId) query.tournamentId = tournamentId;

        const registrations = await TournamentRegistration.find(query).sort({ createdAt: -1 });
        return NextResponse.json({
            success: true,
            count: registrations.length,
            registrations: registrations.map(r => r.toJSON())
        });
    } catch (err) {
        console.error('GET /api/registrations error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const targetId = body.id || body._id;

        if (targetId) {
            const existing = await TournamentRegistration.findById(targetId);
            if (existing) {
                if (body.status) {
                    existing.status = body.status;
                    if (body.status === 'verified') {
                        await Tournament.findByIdAndUpdate(existing.tournamentId, { $inc: { registeredCount: 1 } });
                    }
                }
                if (body.teamName) existing.teamName = body.teamName;
                if (body.captainName) existing.captainName = body.captainName;
                if (body.captainPhone) existing.captainPhone = body.captainPhone;

                await existing.save();

                return NextResponse.json({
                    success: true,
                    message: 'Tournament registration updated successfully',
                    registration: existing.toJSON()
                });
            }
        }

        const { tournamentId, tournamentTitle, teamName, captainName, captainPhone, playerCount, players, amount, paymentMethod, transactionId } = body;

        if (!tournamentId || !teamName || !captainName || !captainPhone) {
            return NextResponse.json(
                { error: 'Tournament, team name, and captain contact are required.' },
                { status: 400 }
            );
        }

        const newRegistration = new TournamentRegistration({
            tournamentId,
            tournamentTitle: tournamentTitle || 'Crossbar Cup',
            teamName: teamName.trim(),
            captainName: captainName.trim(),
            captainPhone: captainPhone.trim(),
            playerCount: Number(playerCount || 10),
            players: players || [],
            paymentMethod: paymentMethod || 'bkash',
            transactionId: transactionId || '',
            amount: Number(amount || 0),
            status: 'pending'
        });

        await newRegistration.save();

        return NextResponse.json({
            success: true,
            message: 'Tournament registration submitted successfully',
            registration: newRegistration.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/registrations error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
