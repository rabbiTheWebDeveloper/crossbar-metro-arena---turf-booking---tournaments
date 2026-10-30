import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentRegistration } from '@/models/TournamentRegistration';
import { normalizeStatus, applyRegistrationEdits, adjustRegisteredCount } from '@/lib/registrationEdits';

export async function GET(_request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const reg = await TournamentRegistration.findById(id);
        if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        return NextResponse.json({ success: true, registration: reg.toJSON() });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * PATCH /api/registrations/:id
 * Admin edit of any registration field (team, captain, players, jersey, payment, notes, status).
 */
export async function PATCH(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await request.json();

        const reg = await TournamentRegistration.findById(id);
        if (!reg) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        const prevStatus = reg.status;
        applyRegistrationEdits(reg, body);
        if (body.status) reg.status = normalizeStatus(body.status);

        await reg.save();
        await adjustRegisteredCount(reg.tournamentId, prevStatus, reg.status);

        return NextResponse.json({
            success: true,
            message: 'Registration updated',
            registration: reg.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(_request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const reg = await TournamentRegistration.findById(id);
        if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        const prevStatus = reg.status;
        await reg.deleteOne();
        await adjustRegisteredCount(reg.tournamentId, prevStatus, 'deleted');
        return NextResponse.json({ success: true, message: 'Registration deleted' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
