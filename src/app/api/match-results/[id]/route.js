import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MatchResult } from '@/models/MatchResult';
import { requireAuth, requireAdmin, isObjectId } from '@/lib/apiAuth';
import { syncStandings, applyResultToStandings } from '@/lib/standings';

/** PATCH /api/match-results/:id  (admin: approve / reject / edit) */
export async function PATCH(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Match result not found' }, { status: 404 });
        const body = await request.json();

        const result = await MatchResult.findById(id);
        if (!result) return NextResponse.json({ error: 'Match result not found' }, { status: 404 });

        // If scores change on an already-published result, reverse the old numbers first
        const scoreChange = (body.homeScore !== undefined && Number(body.homeScore) !== result.homeScore) || (body.awayScore !== undefined && Number(body.awayScore) !== result.awayScore) || Array.isArray(body.scorers);
        if (scoreChange && result.standingsApplied) {
            await applyResultToStandings(result, -1);
            result.standingsApplied = false;
        }
        if (body.homeScore !== undefined) result.homeScore = Math.max(0, Number(body.homeScore) || 0);
        if (body.awayScore !== undefined) result.awayScore = Math.max(0, Number(body.awayScore) || 0);
        if (Array.isArray(body.scorers)) result.scorers = body.scorers.slice(0, 60);
        if (body.playerOfTheMatch !== undefined) result.playerOfTheMatch = String(body.playerOfTheMatch).slice(0, 60);
        if (body.matchReport !== undefined) result.matchReport = String(body.matchReport).slice(0, 2000);
        if (body.status) {
            const next = body.status === 'hidden' ? 'rejected' : body.status; // legacy value from the old admin UI
            if (!['pending_approval', 'published', 'rejected'].includes(next)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            result.status = next;
        }
        await syncStandings(result);
        await result.save();

        return NextResponse.json({ success: true, message: `Match result ${result.status.replace('_', ' ')}`, matchResult: result.toJSON() });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** DELETE /api/match-results/:id  (admin, or the submitter while it is still pending) */
export async function DELETE(request, { params }) {
    try {
        const { user, denied } = await requireAuth(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Match result not found' }, { status: 404 });
        const result = await MatchResult.findById(id);
        if (!result) return NextResponse.json({ error: 'Match result not found' }, { status: 404 });
        const isOwner = result.userId && result.userId === String(user.userId || user.id);
        if (user.role !== 'admin' && !(isOwner && result.status === 'pending_approval')) {
            return NextResponse.json({ error: 'You can only withdraw your own result while it is pending.' }, { status: 403 });
        }
        if (result.standingsApplied) await applyResultToStandings(result, -1);
        await result.deleteOne();
        return NextResponse.json({ success: true, message: 'Match result deleted' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
