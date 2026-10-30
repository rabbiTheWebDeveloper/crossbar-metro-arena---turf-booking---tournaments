import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Team } from '@/models/Team';
import { requireAuth, optionalAuth, isObjectId, escapeRegex } from '@/lib/apiAuth';
import { sanitizePlayer, canManageTeam } from '@/lib/teams';

export async function GET(request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        const team = await Team.findById(id);
        if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        const user = await optionalAuth(request);
        const json = team.toJSON();
        if (!canManageTeam(user, team)) {
            delete json.captainPhone;
            json.players = (json.players || []).map(p => ({ ...p, phone: undefined }));
        }
        return NextResponse.json({ success: true, team: json });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * PATCH /api/teams/:id  (captain or admin)
 * Body options: { newPlayer } | { removePlayerId } | { updatePlayer: {id,...} } | { name, shortCode, area, homeColor } | admin only: { stats }
 */
export async function PATCH(request, { params }) {
    try {
        const { user, denied } = await requireAuth(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        const body = await request.json();

        const team = await Team.findById(id);
        if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        if (!canManageTeam(user, team)) return NextResponse.json({ error: 'Only the team captain can edit this team.' }, { status: 403 });

        const player = body.newPlayer || (body.name && body.position && !body.shortCode && body.number !== undefined ? body : null);
        if (player) {
            const clean = sanitizePlayer(player);
            if (!clean) return NextResponse.json({ error: 'Player name is required.' }, { status: 400 });
            if ((team.players || []).length >= 20) return NextResponse.json({ error: 'A squad can have at most 20 players.' }, { status: 400 });
            if (team.players.some(p => p.name.toLowerCase() === clean.name.toLowerCase())) return NextResponse.json({ error: `${clean.name} is already in the squad.` }, { status: 409 });
            if (clean.number && team.players.some(p => p.number === clean.number)) return NextResponse.json({ error: `Jersey #${clean.number} is already taken.` }, { status: 409 });
            team.players.push(clean);
        }
        if (body.removePlayerId) {
            team.players = team.players.filter(p => p.id !== String(body.removePlayerId));
        }
        if (body.updatePlayer && body.updatePlayer.id) {
            const idx = team.players.findIndex(p => p.id === String(body.updatePlayer.id));
            if (idx >= 0) {
                const merged = sanitizePlayer({ ...team.players[idx].toObject(), ...body.updatePlayer, id: team.players[idx].id });
                if (merged) { merged.goals = team.players[idx].goals; merged.matchesPlayed = team.players[idx].matchesPlayed; team.players[idx] = merged; }
            }
        }
        if (body.name !== undefined) {
            const name = String(body.name).trim();
            if (name.length < 3) return NextResponse.json({ error: 'Team name must be at least 3 characters.' }, { status: 400 });
            const clash = await Team.findOne({ _id: { $ne: team._id }, name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
            if (clash) return NextResponse.json({ error: 'A team with this name already exists.' }, { status: 409 });
            team.name = name;
        }
        if (body.shortCode !== undefined) team.shortCode = String(body.shortCode).toUpperCase().slice(0, 5);
        if (body.area !== undefined) team.area = String(body.area).slice(0, 60);
        if (body.homeColor !== undefined && /^#[0-9a-fA-F]{6}$/.test(body.homeColor)) team.homeColor = body.homeColor;
        if (body.badgeUrl !== undefined && /^https?:\/\//.test(body.badgeUrl || '')) team.badgeUrl = body.badgeUrl;
        if (body.stats && user.role === 'admin') {
            team.stats = { ...team.stats.toObject(), ...body.stats };
            team.markModified('stats');
        }
        if (user.role === 'admin') {
            if (body.captainName) team.captainName = String(body.captainName).trim();
            if (body.captainPhone) team.captainPhone = String(body.captainPhone).replace(/[^0-9]/g, '');
        }

        await team.save();
        return NextResponse.json({ success: true, message: 'Team updated successfully', team: team.toJSON() });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** DELETE /api/teams/:id (captain or admin) */
export async function DELETE(request, { params }) {
    try {
        const { user, denied } = await requireAuth(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        const team = await Team.findById(id);
        if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        if (!canManageTeam(user, team)) return NextResponse.json({ error: 'Only the team captain can delete this team.' }, { status: 403 });
        if ((team.stats?.played || 0) > 0 && user.role !== 'admin') {
            return NextResponse.json({ error: 'Teams with recorded matches cannot be deleted. Contact the arena desk.' }, { status: 400 });
        }
        await team.deleteOne();
        return NextResponse.json({ success: true, message: 'Team deleted' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
