import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Investor } from '@/models/Investor';

export async function GET() {
    try {
        await connectToDatabase();
        const investors = await Investor.find().sort({ sharePercentage: -1 });
        return NextResponse.json({
            success: true,
            count: investors.length,
            investors: investors.map(i => i.toJSON())
        });
    } catch (err) {
        console.error('GET /api/investors error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        // Support array bulk update/save
        if (Array.isArray(body)) {
            const results = [];
            for (const item of body) {
                const targetId = item.id || item._id;
                if (targetId) {
                    const updated = await Investor.findByIdAndUpdate(
                        targetId,
                        {
                            name: item.name,
                            email: item.email || '',
                            phone: item.phone,
                            sharePercentage: Number(item.sharePercentage),
                            capitalInvested: Number(item.capitalInvested || 0),
                            status: item.status || 'active'
                        },
                        { new: true, upsert: true }
                    );
                    if (updated) results.push(updated.toJSON());
                } else {
                    const created = new Investor({
                        name: item.name?.trim(),
                        email: item.email?.trim() || '',
                        phone: item.phone?.trim(),
                        sharePercentage: Number(item.sharePercentage),
                        capitalInvested: Number(item.capitalInvested || 0),
                        joinedDate: item.joinedDate || new Date().toISOString().split('T')[0],
                        payoutsPaid: Number(item.payoutsPaid || 0),
                        status: item.status || 'active'
                    });
                    await created.save();
                    results.push(created.toJSON());
                }
            }
            return NextResponse.json({
                success: true,
                message: 'Investors updated successfully',
                investors: results
            }, { status: 200 });
        }

        const { name, email, phone, sharePercentage, capitalInvested, joinedDate } = body;

        if (!name || !phone || sharePercentage === undefined) {
            return NextResponse.json(
                { error: 'Name, phone, and share percentage are required.' },
                { status: 400 }
            );
        }

        const newInvestor = new Investor({
            name: name.trim(),
            email: email?.trim().toLowerCase() || '',
            phone: phone.trim(),
            sharePercentage: Number(sharePercentage),
            capitalInvested: Number(capitalInvested || 0),
            joinedDate: joinedDate || new Date().toISOString().split('T')[0],
            payoutsPaid: 0,
            status: 'active'
        });

        await newInvestor.save();

        return NextResponse.json({
            success: true,
            message: 'Investor partner added successfully',
            investor: newInvestor.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/investors error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
