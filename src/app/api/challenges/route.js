import { readJson } from '@/lib/validate';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Challenge } from '@/models/Challenge';
import { requireAuth, optionalAuth, cleanPhone, rateLimit } from '@/lib/apiAuth';
import { isIsoDate, todayDhaka } from '@/lib/booking';

/** GET /api/challenges  - open challenges from today onwards (public). ?mine=1 for the caller's own, ?status=all for admins. */
export async function GET(request) {
    try {
        await connectToDatabase();
        const user = await optionalAuth(request);
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'open';
        const mine = searchParams.get('mine') === '1';

        const query = {};
        if (mine && user) {
            query.$or = [{ userId: String(user.userId || user.id) }, { captainPhone: cleanPhone(user.phone) }];
            if (status !== 'all') query.status = status;
        } else {
            query.status = status === 'all' && user?.role === 'admin' ? { $in: ['open', 'matched', 'closed'] } : (status === 'all' ? 'open' : status);
            query.date = { $gte: todayDhaka() };
        }

        const challenges = await Challenge.find(query).sort({ date: 1, createdAt: -1 }).lean();
        const list = challenges.map(c => {
            const j = { ...c, id: String(c._id) };
            // Public listing: phone only for the owner / admin (contact goes through the "Accept" action)
            const own = user && (j.userId === String(user.userId || user.id) || cleanPhone(j.captainPhone) === cleanPhone(user.phone));
            if (!own && user?.role !== 'admin') { j.captainPhone = j.captainPhone ? `${j.captainPhone.slice(0, 3)}•••••${j.captainPhone.slice(-3)}` : ''; j.matchedPhone = undefined; }
            return j;
        });
        return NextResponse.json({ success: true, count: list.length, challenges: list });
    } catch (err) {
        console.error('GET /api/challenges error:', err);
        return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
    }
}

/** POST /api/challenges - signed-in players post an open challenge for their team. */
export async function POST(request) {
    try {
        const { user, denied } = await requireAuth(request);
        if (denied) return denied;
        const limited = rateLimit(request, 'challenge-post', 10, 60 * 60 * 1000);
        if (limited) return limited;
        await connectToDatabase();
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const teamName = String(body.teamName || '').trim();
        const date = body.date;
        const timeSlot = String(body.timeSlot || '').trim();
        if (!teamName || !isIsoDate(date) || !timeSlot) {
            return NextResponse.json({ error: 'Team name, match date and time slot are required.' }, { status: 400 });
        }
        if (date < todayDhaka()) return NextResponse.json({ error: 'Pick a date from today onwards.' }, { status: 400 });
        const isAdmin = user.role === 'admin';
        const captainPhone = isAdmin && body.captainPhone ? cleanPhone(body.captainPhone) : cleanPhone(user.phone);
        const captainName = isAdmin && body.captainName ? String(body.captainName).trim() : user.name;

        const openCount = await Challenge.countDocuments({ captainPhone, status: 'open', date: { $gte: todayDhaka() } });
        if (!isAdmin && openCount >= 5) return NextResponse.json({ error: 'You already have 5 open challenges. Close one before posting another.' }, { status: 400 });

        const newChallenge = await Challenge.create({
            teamName: teamName.slice(0, 60),
            captainName,
            captainPhone,
            userId: String(user.userId || user.id || ''),
            courtName: 'Crossbar Metro Arena',
            date,
            timeSlot: timeSlot.slice(0, 40),
            format: String(body.format || '7 vs 7 Friendly Match').slice(0, 40),
            level: ['Casual', 'Semi-Pro', 'Competitive', 'Pro'].includes(body.level) ? body.level : 'Casual',
            lookingFor: String(body.lookingFor || 'Opponent Team').slice(0, 40),
            costShare: String(body.costShare || '50/50 Split').slice(0, 40),
            notes: String(body.notes || '').slice(0, 300),
            status: 'open'
        });

        return NextResponse.json({ success: true, message: 'Challenge posted', challenge: newChallenge.toJSON() }, { status: 201 });
    } catch (err) {
        console.error('POST /api/challenges error:', err);
        return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
    }
}
