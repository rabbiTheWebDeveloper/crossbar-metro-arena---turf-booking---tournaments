import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Challenge } from '@/models/Challenge';
import { requireAuth, isObjectId, cleanPhone } from '@/lib/apiAuth';

const isOwner = (user, c) => user && (c.userId === String(user.userId || user.id) || (cleanPhone(user.phone) && cleanPhone(user.phone) === cleanPhone(c.captainPhone)));

/**
 * PATCH /api/challenges/:id
 *  - { action: 'accept' }            any signed-in player: marks matched with their contact details
 *  - { status: 'closed'|'open'|'matched', matchedTeamName? }  owner or admin
 */
export async function PATCH(request, { params }) {
    try {
        const { user, denied } = await requireAuth(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        const body = await request.json();
        const c = await Challenge.findById(id);
        if (!c) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });

        if (body.action === 'accept') {
            if (isOwner(user, c)) return NextResponse.json({ error: 'You cannot accept your own challenge.' }, { status: 400 });
            if (c.status !== 'open') return NextResponse.json({ error: 'This challenge is no longer open.' }, { status: 409 });
            c.status = 'matched';
            c.matchedTeamName = String(body.teamName || user.teamId || user.name || 'Opponent').slice(0, 60);
            c.matchedCaptainName = user.name;
            c.matchedPhone = cleanPhone(user.phone);
            await c.save();
            // Reveal the poster's number to the accepting captain so the two sides can talk
            return NextResponse.json({ success: true, message: `Challenge accepted. Captain ${c.captainName} can be reached at ${c.captainPhone}.`, challenge: c.toJSON() });
        }

        if (!isOwner(user, c) && user.role !== 'admin') return NextResponse.json({ error: 'Only the poster can edit this challenge.' }, { status: 403 });
        if (body.status && ['open', 'matched', 'closed'].includes(body.status)) {
            c.status = body.status;
            if (body.status === 'open') { c.matchedTeamName = ''; c.matchedCaptainName = ''; c.matchedPhone = ''; }
        }
        if (body.matchedTeamName !== undefined) c.matchedTeamName = String(body.matchedTeamName).slice(0, 60);
        if (body.notes !== undefined) c.notes = String(body.notes).slice(0, 300);
        if (body.timeSlot !== undefined) c.timeSlot = String(body.timeSlot).slice(0, 40);
        if (body.date !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) c.date = body.date;
        await c.save();
        return NextResponse.json({ success: true, message: 'Challenge updated', challenge: c.toJSON() });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { user, denied } = await requireAuth(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        const c = await Challenge.findById(id);
        if (!c) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        if (!isOwner(user, c) && user.role !== 'admin') return NextResponse.json({ error: 'Only the poster can delete this challenge.' }, { status: 403 });
        await c.deleteOne();
        return NextResponse.json({ success: true, message: 'Challenge removed' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
