import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentRegistration } from '@/models/TournamentRegistration';
import { Tournament } from '@/models/Tournament';
import { normalizeStatus, toStringList, applyRegistrationEdits, adjustRegisteredCount } from '@/lib/registrationEdits';
import { optionalAuth, requireAdmin, cleanPhone, isObjectId, escapeRegex, rateLimit } from '@/lib/apiAuth';
import { todayDhaka } from '@/lib/booking';

const PAYMENT_MAP = { arena_counter: 'pay_at_turf', counter: 'pay_at_turf', bank_transfer: 'bank', bkash: 'bkash', nagad: 'nagad', rocket: 'rocket', bank: 'bank', card: 'card', cash: 'cash', pay_at_turf: 'pay_at_turf' };

/** GET /api/registrations - admin: everything; signed-in captain: ?mine=1 their own teams. */
export async function GET(request) {
    try {
        await connectToDatabase();
        const user = await optionalAuth(request);
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const tournamentId = searchParams.get('tournamentId');
        const mine = searchParams.get('mine') === '1';

        if (mine) {
            if (!user) return NextResponse.json({ success: true, count: 0, registrations: [] });
            const own = await TournamentRegistration.find({ captainPhone: cleanPhone(user.phone) }).sort({ createdAt: -1 });
            return NextResponse.json({ success: true, count: own.length, registrations: own.map(r => r.toJSON()) });
        }
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin login required.' }, { status: user ? 403 : 401 });

        const query = {};
        if (status) query.status = normalizeStatus(status);
        if (tournamentId) query.tournamentId = String(tournamentId);
        const registrations = await TournamentRegistration.find(query).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, count: registrations.length, registrations: registrations.map(r => r.toJSON()) });
    } catch (err) {
        console.error('GET /api/registrations error:', err);
        return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }
}

/**
 * POST /api/registrations
 *  - public: register a team for an open tournament (always "pending"; fee comes from the tournament)
 *  - admin with { id }: legacy update path used by older admin screens
 */
export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const targetId = body.id || body._id;

        if (isObjectId(targetId)) {
            const { denied } = await requireAdmin(request);
            if (denied) return denied;
            const existing = await TournamentRegistration.findById(targetId);
            if (!existing) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
            const prevStatus = existing.status;
            applyRegistrationEdits(existing, body);
            if (body.status) existing.status = normalizeStatus(body.status);
            await existing.save();
            await adjustRegisteredCount(existing.tournamentId, prevStatus, existing.status, existing);
            return NextResponse.json({ success: true, message: 'Tournament registration updated successfully', registration: existing.toJSON() });
        }

        const limited = rateLimit(request, 'registration', 10, 60 * 60 * 1000);
        if (limited) return limited;

        const { tournamentId } = body;
        const teamName = String(body.teamName || '').trim();
        const captainName = String(body.captainName || '').trim();
        const captainPhone = cleanPhone(body.captainPhone);
        if (!tournamentId || teamName.length < 2 || captainName.length < 2 || !/^01[3-9]\d{8}$/.test(captainPhone)) {
            return NextResponse.json({ error: 'Tournament, team name, captain name and a valid mobile number are required.' }, { status: 400 });
        }

        const playersList = toStringList(body.playersList).length ? toStringList(body.playersList) : toStringList(body.players);
        if (playersList.length < 5) return NextResponse.json({ error: 'List at least 5 squad players.' }, { status: 400 });
        if (playersList.length > 12) return NextResponse.json({ error: 'A squad can have at most 12 players.' }, { status: 400 });

        // Tournament must exist, be open, before its deadline, and have space
        const tournament = isObjectId(tournamentId) ? await Tournament.findById(tournamentId) : null;
        if (!tournament) return NextResponse.json({ error: 'That tournament is not available.' }, { status: 404 });
        if (!['open', 'fast_filling'].includes(tournament.status)) return NextResponse.json({ error: 'Registration for this tournament is closed.' }, { status: 400 });
        if (tournament.registrationDeadline && /^\d{4}-\d{2}-\d{2}$/.test(tournament.registrationDeadline) && tournament.registrationDeadline < todayDhaka()) {
            return NextResponse.json({ error: 'The registration deadline for this tournament has passed.' }, { status: 400 });
        }
        const taken = await TournamentRegistration.countDocuments({ tournamentId: String(tournament._id), status: { $in: ['pending', 'confirmed'] } });
        if (tournament.maxTeams && taken >= tournament.maxTeams) return NextResponse.json({ error: 'This tournament is full. Join the waiting list by calling the arena desk.' }, { status: 409 });
        const dup = await TournamentRegistration.findOne({ tournamentId: String(tournament._id), status: { $ne: 'rejected' }, $or: [{ teamName: new RegExp(`^${escapeRegex(teamName)}$`, 'i') }, { captainPhone }] });
        if (dup) return NextResponse.json({ error: `${dup.teamName} is already registered for ${tournament.title} with this name or phone.` }, { status: 409 });

        const user = await optionalAuth(request);
        const newRegistration = new TournamentRegistration({
            tournamentId: String(tournament._id),
            tournamentTitle: tournament.title,
            teamName: teamName.slice(0, 60),
            captainName: captainName.slice(0, 60),
            captainPhone,
            captainEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.captainEmail || '') ? String(body.captainEmail).trim().toLowerCase() : (user?.email && !String(user.email).endsWith('@bookcrossbar.com') ? user.email : ''),
            jerseyColor: String(body.jerseyColor || '').trim().slice(0, 40),
            playerCount: playersList.length,
            playersList,
            players: [],
            paymentMethod: PAYMENT_MAP[body.paymentMethod] || 'bkash',
            transactionId: String(body.transactionId || '').trim().slice(0, 60),
            amount: Number(tournament.entryFee || 0),
            status: 'pending',
            notes: ''
        });
        await newRegistration.save();

        return NextResponse.json({
            success: true,
            message: 'Tournament registration submitted. The arena desk will confirm your squad once the entry fee is verified.',
            registration: newRegistration.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/registrations error:', err);
        return NextResponse.json({ error: 'Failed to submit registration' }, { status: 500 });
    }
}
