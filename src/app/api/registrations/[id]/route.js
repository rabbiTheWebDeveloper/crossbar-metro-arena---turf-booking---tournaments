import { NextResponse } from 'next/server';
import { requireAdmin, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentRegistration } from '@/models/TournamentRegistration';
import { readJson, badRequest } from '@/lib/validate';
import { parseRegistrationEdits, applyRegistrationEdits, adjustRegisteredCount } from '@/lib/registrationEdits';

export async function GET(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
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
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        const { body: raw, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        const { data: body, error: inputError } = parseRegistrationEdits(raw);
        if (inputError) return badRequest(inputError);
        await connectToDatabase();

        const reg = await TournamentRegistration.findById(id);
        if (!reg) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        const prevStatus = reg.status;
        applyRegistrationEdits(reg, body);
        if (body.status) reg.status = body.status;

        await reg.save();
        await adjustRegisteredCount(reg.tournamentId, prevStatus, reg.status, reg);

        return NextResponse.json({
            success: true,
            message: 'Registration updated',
            registration: reg.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        const reg = await TournamentRegistration.findById(id);
        if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        const prevStatus = reg.status;
        await reg.deleteOne();
        await adjustRegisteredCount(reg.tournamentId, prevStatus, 'deleted', reg);
        return NextResponse.json({ success: true, message: 'Registration deleted' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
