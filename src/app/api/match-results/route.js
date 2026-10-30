import { readJson } from '@/lib/validate';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MatchResult } from '@/models/MatchResult';
import { Team } from '@/models/Team';
import { Setting } from '@/models/Setting';
import { requireAuth, optionalAuth, cleanPhone, isObjectId } from '@/lib/apiAuth';
import { applyResultToStandings, syncStandings } from '@/lib/standings';
import { isIsoDate, todayDhaka } from '@/lib/booking';

/**
 * GET /api/match-results
 * Public callers only ever see published results. Admins can pass ?status=all|pending_approval|rejected.
 * Signed-in players additionally get their own submissions with ?mine=1.
 */
export async function GET(request) {
    try {
        await connectToDatabase();
        const user = await optionalAuth(request);
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const mine = searchParams.get('mine') === '1';
        const isAdmin = user?.role === 'admin';

        const query = {};
        if (mine && user) {
            query.$or = [{ userId: String(user.userId || user.id) }, { postedByPhone: cleanPhone(user.phone) }];
            if (status && status !== 'all') query.status = status;
        } else if (isAdmin) {
            if (status && status !== 'all') query.status = status;
        } else {
            query.status = 'published';
        }

        const results = await MatchResult.find(query).sort({ date: -1, createdAt: -1 }).lean();
        return NextResponse.json({
            success: true,
            count: results.length,
            matchResults: results.map(r => ({ ...r, id: String(r._id) }))
        });
    } catch (err) {
        console.error('GET /api/match-results error:', err);
        return NextResponse.json({ error: 'Failed to fetch match results' }, { status: 500 });
    }
}

const buildScorers = (events, homeTeam, awayTeam) => (events || [])
    .filter(e => e && e.type === 'goal' && e.playerName)
    .map(e => ({ playerName: String(e.playerName).trim().slice(0, 40), teamName: e.side === 'away' ? awayTeam : homeTeam, minute: Math.max(0, Math.min(120, Number(e.minute) || 0)) }));

/**
 * POST /api/match-results  (signed-in: create)
 * Players: must captain the home or away team; status follows the admin "approve first" setting.
 * Admins: may set status directly and may pass { id } to update (kept for the admin UI).
 */
export async function POST(request) {
    try {
        const { user, denied } = await requireAuth(request);
        if (denied) return denied;
        await connectToDatabase();
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        const isAdmin = user.role === 'admin';

        // Admin edit path
        const targetId = body.id || body._id;
        if (isObjectId(targetId)) {
            if (!isAdmin) return NextResponse.json({ error: 'Only the arena desk can edit a submitted result.' }, { status: 403 });
            const existing = await MatchResult.findById(targetId);
            if (existing) {
                const prevStatus = existing.status;
                if (body.homeScore !== undefined) existing.homeScore = Number(body.homeScore);
                if (body.awayScore !== undefined) existing.awayScore = Number(body.awayScore);
                if (body.playerOfTheMatch !== undefined) existing.playerOfTheMatch = String(body.playerOfTheMatch).slice(0, 60);
                if (body.matchReport !== undefined) existing.matchReport = String(body.matchReport).slice(0, 2000);
                if (Array.isArray(body.scorers)) existing.scorers = body.scorers;
                if (body.status && ['pending_approval', 'published', 'rejected'].includes(body.status)) existing.status = body.status;
                await syncStandings(existing, prevStatus);
                await existing.save();
                return NextResponse.json({ success: true, message: 'Match result updated successfully', matchResult: existing.toJSON() });
            }
        }

        const { date, homeTeam, awayTeam } = body;
        const homeScore = Number(body.homeScore), awayScore = Number(body.awayScore);
        if (!isIsoDate(date) || !homeTeam || !awayTeam || Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
            return NextResponse.json({ error: 'Date, both teams, and scores are required.' }, { status: 400 });
        }
        if (date > todayDhaka()) return NextResponse.json({ error: 'You cannot post a result for a future date.' }, { status: 400 });
        if (homeScore < 0 || awayScore < 0 || homeScore > 50 || awayScore > 50) return NextResponse.json({ error: 'Scores must be between 0 and 50.' }, { status: 400 });
        if (String(homeTeam).trim().toLowerCase() === String(awayTeam).trim().toLowerCase()) return NextResponse.json({ error: 'Home and away team must be different.' }, { status: 400 });

        // Players must captain one of the two teams
        let homeTeamId = isObjectId(body.homeTeamId) ? body.homeTeamId : '';
        let awayTeamId = isObjectId(body.awayTeamId) ? body.awayTeamId : '';
        if (!isAdmin) {
            const myPhone = cleanPhone(user.phone);
            const myTeams = await Team.find({ captainPhone: myPhone }).select('name');
            const names = myTeams.map(t => t.name.toLowerCase());
            if (!names.includes(String(homeTeam).trim().toLowerCase()) && !names.includes(String(awayTeam).trim().toLowerCase())) {
                return NextResponse.json({ error: 'Only the captain of one of the two teams can post this result.' }, { status: 403 });
            }
            const dup = await MatchResult.findOne({ date, homeTeam: new RegExp(`^${String(homeTeam).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), awayTeam: new RegExp(`^${String(awayTeam).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), status: { $ne: 'rejected' } });
            if (dup) return NextResponse.json({ error: 'A result for this fixture has already been submitted.' }, { status: 409 });
        }
        if (!homeTeamId) { const t = await Team.findOne({ name: new RegExp(`^${String(homeTeam).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).select('_id'); if (t) homeTeamId = String(t._id); }
        if (!awayTeamId) { const t = await Team.findOne({ name: new RegExp(`^${String(awayTeam).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).select('_id'); if (t) awayTeamId = String(t._id); }

        const settings = await Setting.getOrCreateSettings();
        let status = settings.approveResultsFirst ? 'pending_approval' : 'published';
        if (isAdmin && ['pending_approval', 'published', 'rejected'].includes(body.status)) status = body.status;

        const events = Array.isArray(body.events) ? body.events.slice(0, 60).map(e => ({ side: e.side === 'away' ? 'away' : 'home', type: ['goal', 'own_goal', 'assist', 'yellow', 'red'].includes(e.type) ? e.type : 'goal', playerName: String(e.playerName || '').trim().slice(0, 40), minute: Math.max(0, Math.min(120, Number(e.minute) || 0)) })) : [];
        const scorers = Array.isArray(body.scorers) && body.scorers.length ? body.scorers.slice(0, 60) : buildScorers(events, String(homeTeam).trim(), String(awayTeam).trim());

        const newResult = new MatchResult({
            date,
            slotDisplay: String(body.slotDisplay || '07:30 PM – 09:00 PM').slice(0, 40),
            courtName: 'Crossbar Metro Arena (Main Turf)',
            homeTeam: String(homeTeam).trim().slice(0, 60),
            awayTeam: String(awayTeam).trim().slice(0, 60),
            homeTeamId,
            awayTeamId,
            homeScore,
            awayScore,
            scorers,
            events,
            yellowCards: Number(body.yellowCards || events.filter(e => e.type === 'yellow').length || 0),
            redCards: Number(body.redCards || events.filter(e => e.type === 'red').length || 0),
            playerOfTheMatch: String(body.playerOfTheMatch || '').slice(0, 60),
            matchReport: String(body.matchReport || '').slice(0, 2000),
            teamPhoto: /^https?:\/\//.test(body.teamPhoto || '') ? body.teamPhoto : '',
            matchType: String(body.matchType || '7v7 Friendly').slice(0, 40),
            postedBy: isAdmin ? (body.postedBy || 'Admin Desk') : user.name,
            postedByPhone: cleanPhone(user.phone),
            userId: String(user.userId || user.id || ''),
            postedAt: new Date().toISOString(),
            status
        });

        if (status === 'published') {
            await applyResultToStandings(newResult, 1);
            newResult.standingsApplied = true;
        }
        await newResult.save();

        return NextResponse.json({
            success: true,
            message: status === 'published' ? 'Match result published.' : 'Match result submitted and awaiting arena desk approval.',
            matchResult: newResult.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/match-results error:', err);
        return NextResponse.json({ error: err.message || 'Failed to save match result' }, { status: 500 });
    }
}
