import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentRegistration } from '@/models/TournamentRegistration';
import { Tournament } from '@/models/Tournament';

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
        if (body.status) reg.status = body.status;
        if (body.notes !== undefined) reg.notes = body.notes;

        await reg.save();

        // If status changed to confirmed, increment tournament registered count
        if (body.status === 'confirmed' && prevStatus !== 'confirmed') {
            await Tournament.findByIdAndUpdate(reg.tournamentId, { $inc: { registeredCount: 1 } });
        } else if (body.status === 'rejected' && prevStatus === 'confirmed') {
            await Tournament.findByIdAndUpdate(reg.tournamentId, { $inc: { registeredCount: -1 } });
        }

        return NextResponse.json({
            success: true,
            message: 'Registration status updated',
            registration: reg.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
