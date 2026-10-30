import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Investor } from '@/models/Investor';
import { requireRole, requireAdmin, isObjectId, cleanPhone } from '@/lib/apiAuth';

/** Fields an investor may see about other partners (no contact details). */
const publicView = (i) => ({
    id: i.id,
    name: i.name,
    sharePercentage: i.sharePercentage,
    status: i.status,
    joinedDate: i.joinedDate
});

/** Resolve which Investor record belongs to a logged-in user: userId link first, exact phone second. */
export async function findInvestorForUser(user) {
    if (!user) return null;
    const uid = user.userId || user.id;
    let inv = null;
    if (isObjectId(uid)) inv = await Investor.findOne({ userId: String(uid) });
    if (!inv && user.phone) {
        const phone = cleanPhone(user.phone);
        const all = await Investor.find({ phone: { $exists: true, $ne: '' } });
        inv = all.find(i => cleanPhone(i.phone) === phone) || null;
    }
    return inv;
}

export async function GET(request) {
    try {
        const { user, denied } = await requireRole(request, ['admin', 'investor']);
        if (denied) return denied;
        await connectToDatabase();
        const investors = await Investor.find().sort({ sharePercentage: -1 });

        if (user.role === 'admin') {
            return NextResponse.json({ success: true, count: investors.length, investors: investors.map(i => i.toJSON()) });
        }
        // Investors: their own full record, other partners only by name + share
        const mine = await findInvestorForUser(user);
        const list = investors.map(i => (mine && String(i._id) === String(mine._id) ? i.toJSON() : publicView(i.toJSON())));
        return NextResponse.json({ success: true, count: list.length, investors: list, myInvestorId: mine ? String(mine._id) : null });
    } catch (err) {
        console.error('GET /api/investors error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function assertShareTotal(candidates) {
    // candidates: [{ id?, sharePercentage, status }] - the full intended list
    const total = candidates.filter(c => (c.status || 'active') === 'active').reduce((s, c) => s + Number(c.sharePercentage || 0), 0);
    if (total > 100.0001) {
        return `Active partner shares add up to ${total}%. The total cannot exceed 100%.`;
    }
    return null;
}

const pickFields = (item) => {
    const out = {};
    if (item.name !== undefined) out.name = String(item.name).trim();
    if (item.email !== undefined) out.email = String(item.email || '').trim().toLowerCase();
    if (item.phone !== undefined) out.phone = cleanPhone(item.phone) || String(item.phone).trim();
    if (item.sharePercentage !== undefined) out.sharePercentage = Number(item.sharePercentage);
    if (item.capitalInvested !== undefined) out.capitalInvested = Number(item.capitalInvested);
    if (item.status !== undefined) out.status = item.status;
    if (item.joinedDate !== undefined) out.joinedDate = item.joinedDate;
    if (item.userId !== undefined) out.userId = isObjectId(item.userId) ? String(item.userId) : '';
    return out;
};

export async function POST(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];

        for (const item of items) {
            if (item.sharePercentage !== undefined) {
                const p = Number(item.sharePercentage);
                if (Number.isNaN(p) || p < 0 || p > 100) return NextResponse.json({ error: 'Share percentage must be between 0 and 100.' }, { status: 400 });
            }
            if (!Array.isArray(body) && (!item.name || !item.phone || item.sharePercentage === undefined)) {
                return NextResponse.json({ error: 'Name, phone, and share percentage are required.' }, { status: 400 });
            }
        }

        // Validate the resulting share total before writing anything
        const existing = await Investor.find();
        const merged = existing.map(e => ({ id: String(e._id), sharePercentage: e.sharePercentage, status: e.status }));
        for (const item of items) {
            const id = item.id || item._id;
            const idx = isObjectId(id) ? merged.findIndex(m => m.id === String(id)) : -1;
            const next = { id: idx >= 0 ? merged[idx].id : undefined, sharePercentage: item.sharePercentage ?? (idx >= 0 ? merged[idx].sharePercentage : 0), status: item.status || (idx >= 0 ? merged[idx].status : 'active') };
            if (idx >= 0) merged[idx] = next; else merged.push(next);
        }
        const shareError = await assertShareTotal(merged);
        if (shareError) return NextResponse.json({ error: shareError }, { status: 400 });

        const results = [];
        for (const item of items) {
            const id = item.id || item._id;
            if (isObjectId(id)) {
                const updated = await Investor.findByIdAndUpdate(id, { $set: pickFields(item) }, { new: true, runValidators: true });
                if (updated) { results.push(updated.toJSON()); continue; }
            }
            if (!item.name || !item.phone) continue;
            const created = new Investor({
                ...pickFields(item),
                joinedDate: item.joinedDate || new Date().toISOString().split('T')[0],
                payoutsPaid: Number(item.payoutsPaid || 0),
                status: item.status || 'active'
            });
            await created.save();
            results.push(created.toJSON());
        }

        const all = await Investor.find().sort({ sharePercentage: -1 });
        return NextResponse.json({
            success: true,
            message: Array.isArray(body) ? 'Investors updated successfully' : 'Investor partner added successfully',
            investor: results[0] || null,
            investors: all.map(i => i.toJSON())
        }, { status: Array.isArray(body) ? 200 : 201 });
    } catch (err) {
        console.error('POST /api/investors error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
