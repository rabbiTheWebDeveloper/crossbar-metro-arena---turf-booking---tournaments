import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Payout } from '@/models/Payout';
import { Investor } from '@/models/Investor';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const investorId = searchParams.get('investorId');

        const query = {};
        if (month) query.month = month;
        if (investorId) query.investorId = investorId;

        const payouts = await Payout.find(query).sort({ datePaid: -1 });
        return NextResponse.json({
            success: true,
            count: payouts.length,
            payouts: payouts.map(p => p.toJSON())
        });
    } catch (err) {
        console.error('GET /api/payouts error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { investorId, investorName, month, amount, datePaid, paymentMethod, transactionNote, recordedBy } = body;

        if (!investorId || !investorName || !month || amount === undefined) {
            return NextResponse.json(
                { error: 'Investor, month, and amount are required.' },
                { status: 400 }
            );
        }

        const newPayout = new Payout({
            investorId,
            investorName,
            month,
            amount: Number(amount),
            datePaid: datePaid || new Date().toISOString().split('T')[0],
            paymentMethod: paymentMethod || 'bank_transfer',
            transactionNote: transactionNote || '',
            recordedBy: recordedBy || 'Admin Desk'
        });

        await newPayout.save();

        // Increment payoutsPaid on investor
        await Investor.findByIdAndUpdate(investorId, { $inc: { payoutsPaid: Number(amount) } });

        return NextResponse.json({
            success: true,
            message: 'Dividend payout recorded successfully',
            payout: newPayout.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/payouts error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
