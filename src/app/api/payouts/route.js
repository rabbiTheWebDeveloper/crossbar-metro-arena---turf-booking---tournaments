import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Payout } from '@/models/Payout';
import { Investor } from '@/models/Investor';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { PAYOUT_SCHEMA } from '@/lib/schemas';
import { requireRole, requireAdmin, isObjectId, cleanPhone } from '@/lib/apiAuth';

async function myInvestor(user) {
    const uid = String(user.userId || user.id || '');
    let inv = await Investor.findOne({ userId: uid });
    if (!inv && user.phone) {
        const all = await Investor.find();
        inv = all.find(i => cleanPhone(i.phone) === cleanPhone(user.phone)) || null;
    }
    return inv;
}

/** GET /api/payouts  - admin: all (filters month, investorId); investor: only their own. */
export async function GET(request) {
    try {
        const { user, denied } = await requireRole(request, ['admin', 'investor']);
        if (denied) return denied;
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const investorId = searchParams.get('investorId');

        const query = {};
        if (month && /^\d{4}-\d{2}$/.test(month)) query.month = month;
        if (user.role === 'admin') {
            if (investorId && isObjectId(investorId)) query.investorId = investorId;
        } else {
            const inv = await myInvestor(user);
            if (!inv) return NextResponse.json({ success: true, count: 0, payouts: [], myInvestorId: null });
            query.investorId = String(inv._id);
        }

        const payouts = await Payout.find(query).sort({ datePaid: -1, createdAt: -1 });
        return NextResponse.json({ success: true, count: payouts.length, payouts: payouts.map(p => p.toJSON()) });
    } catch (err) {
        console.error('GET /api/payouts error:', err);
        return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
    }
}

/** POST /api/payouts  (admin) */
export async function POST(request) {
    try {
        const { user, denied } = await requireAdmin(request);
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        const investorId = body.investorId;
        if (!isObjectId(investorId)) return badRequest('Pick a saved investor first.');
        const { data, error: inputError } = validate(body, PAYOUT_SCHEMA);
        if (inputError) return badRequest(inputError);
        const { month, amount, datePaid, paymentMethod: method, transactionNote, allowDuplicate } = data;
        if (amount <= 0) return badRequest('Amount must be greater than zero.');
        await connectToDatabase();
        const investor = await Investor.findById(investorId);
        if (!investor) return NextResponse.json({ error: 'Investor not found.' }, { status: 404 });

        const already = await Payout.aggregate([{ $match: { investorId: String(investor._id), month } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
        const paidSoFar = already[0]?.total || 0;
        if (paidSoFar > 0 && !allowDuplicate) {
            return NextResponse.json({ error: `৳${paidSoFar.toLocaleString()} has already been paid to ${investor.name} for ${month}. Tick "add another payout for this month" to record a second payment.`, paidSoFar }, { status: 409 });
        }

        const newPayout = new Payout({
            investorId: String(investor._id),
            investorName: investor.name,
            month,
            amount,
            datePaid: /^\d{4}-\d{2}-\d{2}$/.test(datePaid || '') ? datePaid : new Date().toISOString().split('T')[0],
            paymentMethod: method,
            transactionNote,
            recordedBy: user.name || 'Admin Desk'
        });
        await newPayout.save();

        investor.payoutsPaid = (investor.payoutsPaid || 0) + amount;
        await investor.save();
        const investors = await Investor.find().sort({ sharePercentage: -1 });

        return NextResponse.json({
            success: true,
            message: 'Dividend payout recorded successfully',
            payout: newPayout.toJSON(),
            investor: investor.toJSON(),
            investors: investors.map(i => i.toJSON())
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/payouts');
    }
}
