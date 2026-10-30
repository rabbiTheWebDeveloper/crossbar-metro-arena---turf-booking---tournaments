import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Team } from '@/models/Team';
import { User } from '@/models/User';
import { requireAuth, cleanPhone, escapeRegex, isObjectId } from '@/lib/apiAuth';
import { sanitizePlayer } from '@/lib/teams';

export async function GET() {
    try {
        await connectToDatabase();
        const teams = await Team.find().sort({ 'stats.points': -1, createdAt: -1 }).lean();
        // Public listing: hide roster phone numbers
        const list = teams.map(t => ({
            ...t,
            id: String(t._id),
            captainPhone: undefined,
            players: (t.players || []).map(p => ({ ...p, phone: undefined }))
        }));
        return NextResponse.json({ success: true, count: list.length, teams: list });
    } catch (err) {
        console.error('GET /api/teams error:', err);
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}

/** POST /api/teams - a signed-in player registers a team; they become its captain. */
export async function POST(request) {
    try {
        const { user, denied } = await requireAuth(request);
        if (denied) return denied;
        await connectToDatabase();
        const body = await request.json();
        const name = String(body.name || '').trim();
        if (name.length < 3) return NextResponse.json({ error: 'Team name must be at least 3 characters.' }, { status: 400 });

        const isAdmin = user.role === 'admin';
        const captainName = isAdmin && body.captainName ? String(body.captainName).trim() : user.name;
        const captainPhone = isAdmin && body.captainPhone ? cleanPhone(body.captainPhone) : cleanPhone(user.phone);
        if (!captainName || !captainPhone) return NextResponse.json({ error: 'Captain name and phone are required.' }, { status: 400 });

        const existing = await Team.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
        if (existing) return NextResponse.json({ error: 'A team with this name already exists.' }, { status: 409 });

        if (!isAdmin) {
            const owned = await Team.countDocuments({ captainPhone });
            if (owned >= 3) return NextResponse.json({ error: 'You can captain up to 3 teams.' }, { status: 400 });
        }

        const players = Array.isArray(body.players) ? body.players.slice(0, 20).map(sanitizePlayer).filter(Boolean) : [];
        const newTeam = new Team({
            name,
            shortCode: String(body.shortCode || name.slice(0, 4)).toUpperCase().slice(0, 5),
            captainName,
            captainPhone,
            homeColor: /^#[0-9a-fA-F]{6}$/.test(body.homeColor || '') ? body.homeColor : '#4cbf02',
            area: String(body.area || 'Uttara, Dhaka').slice(0, 60),
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: [] },
            players
        });
        await newTeam.save();

        // Remember the team on the captain's profile
        if (!isAdmin && isObjectId(user.userId || user.id)) {
            await User.findByIdAndUpdate(user.userId || user.id, { teamId: String(newTeam._id) }).catch(() => { });
        }

        return NextResponse.json({ success: true, message: 'Team registered successfully', team: newTeam.toJSON() }, { status: 201 });
    } catch (err) {
        console.error('POST /api/teams error:', err);
        return NextResponse.json({ error: err.code === 11000 ? 'A team with this name already exists.' : 'Failed to create team' }, { status: err.code === 11000 ? 409 : 500 });
    }
}
