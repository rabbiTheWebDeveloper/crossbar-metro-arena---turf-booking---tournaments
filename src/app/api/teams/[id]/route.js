import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Team } from '@/models/Team';

export async function PATCH(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await request.json();

        const team = await Team.findById(id);
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Add player to team roster
        if (body.newPlayer) {
            team.players.push(body.newPlayer);
        }
        if (body.stats) team.stats = { ...team.stats, ...body.stats };
        if (body.homeColor) team.homeColor = body.homeColor;

        await team.save();

        return NextResponse.json({
            success: true,
            message: 'Team updated successfully',
            team: team.toJSON()
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
