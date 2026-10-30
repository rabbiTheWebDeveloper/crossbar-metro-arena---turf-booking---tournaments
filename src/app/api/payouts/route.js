import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Payout } from '@/models/Payout';
import { Investor } from '@/models/Investor';
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
        await connectToDatabase();
        const body = await request.json();
        const { investorId, month, datePaid, paymentMethod, transactionNote } = body;
        const amount = Number(body.amount);

        if (!isObjectId(investorId)) return NextResponse.json({ error: 'Pick a saved investor first.' }, { status: 400 });
        if (!/^\d{4}-\d{2}$/.test(String(month || ''))) return NextResponse.json({ error: 'Month must look like 2026-10.' }, { status: 400 });
        if (Number.isNaN(amount) || amount <= 0) return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });
        const investor = await Investor.findById(investorId);
        if (!investor) return NextResponse.json({ error: 'Investor not found.' }, { status: 404 });

        const method = ['bank_transfer', 'bkash', 'nagad', 'rocket', 'cheque', 'cash'].includes(paymentMethod) ? paymentMethod : 'bank_transfer';
        const already = await Payout.aggregate([{ $match: { investorId: String(investor._id), month } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
        const paidSoFar = already[0]?.total || 0;
        if (paidSoFar > 0 && !body.allowDuplicate) {
            return NextResponse.json({ error: `৳${paidSoFar.toLocaleString()} has already been paid to ${investor.name} for ${month}. Tick "add another payout for this month" to record a second payment.`, paidSoFar }, { status: 409 });
        }

        const newPayout = new Payout({
            investorId: String(investor._id),
            investorName: investor.name,
            month,
            amount,
            datePaid: /^\d{4}-\d{2}-\d{2}$/.test(datePaid || '') ? datePaid : new Date().toISOString().split('T')[0],
            paymentMethod: method,
            transactionNote: String(transactionNote || '').slice(0, 200),
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
        console.error('POST /api/payouts error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
