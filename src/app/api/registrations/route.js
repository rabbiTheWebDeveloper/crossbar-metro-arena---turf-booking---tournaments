import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentRegistration } from '@/models/TournamentRegistration';
import { Tournament } from '@/models/Tournament';
import { normalizeStatus, toStringList, applyRegistrationEdits, adjustRegisteredCount } from '@/lib/registrationEdits';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const tournamentId = searchParams.get('tournamentId');

        const query = {};
        if (status) query.status = normalizeStatus(status);
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

        // Update path (legacy: the admin page POSTs the whole record back with a new status)
        if (targetId && /^[0-9a-fA-F]{24}$/.test(String(targetId))) {
            const existing = await TournamentRegistration.findById(targetId);
            if (existing) {
                const prevStatus = existing.status;
                applyRegistrationEdits(existing, body);
                if (body.status) existing.status = normalizeStatus(body.status);
                await existing.save();
                await adjustRegisteredCount(existing.tournamentId, prevStatus, existing.status);

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

        const playersList = toStringList(body.playersList).length ? toStringList(body.playersList) : toStringList(players);

        // Entry fee defaults to the tournament's fee when the form did not send an amount
        let fee = Number(amount || 0);
        if (!fee && /^[0-9a-fA-F]{24}$/.test(String(tournamentId))) {
            const t = await Tournament.findById(tournamentId).select('entryFee');
            if (t && t.entryFee) fee = Number(t.entryFee);
        }

        const newRegistration = new TournamentRegistration({
            tournamentId,
            tournamentTitle: tournamentTitle || 'Crossbar Cup',
            teamName: teamName.trim(),
            captainName: captainName.trim(),
            captainPhone: captainPhone.trim(),
            captainEmail: (body.captainEmail || '').trim().toLowerCase(),
            jerseyColor: (body.jerseyColor || '').trim(),
            playerCount: Number(playerCount || playersList.length || 10),
            playersList,
            players: Array.isArray(players) && players.length && typeof players[0] === 'object' ? players : [],
            paymentMethod: paymentMethod || 'bkash',
            transactionId: transactionId || '',
            amount: fee,
            status: 'pending',
            notes: body.notes || ''
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
