import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Investor } from '@/models/Investor';
import { Payout } from '@/models/Payout';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { INVESTOR_SCHEMA } from '@/lib/schemas';
import { requireAdmin, isObjectId, cleanPhone } from '@/lib/apiAuth';

export async function PUT(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
        const { body: raw, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        const { data, error: inputError } = validate(raw, INVESTOR_SCHEMA, { partial: true });
        if (inputError) return badRequest(inputError);
        const body = { ...data, ...(raw.userId !== undefined ? { userId: raw.userId } : {}) };
        await connectToDatabase();

        const investor = await Investor.findById(id);
        if (!investor) {
            return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
        }

        if (body.sharePercentage !== undefined) {
            const p = body.sharePercentage;
            const others = await Investor.find({ _id: { $ne: investor._id }, status: 'active' }).select('sharePercentage');
            const total = others.reduce((s, o) => s + (o.sharePercentage || 0), 0) + ((body.status || investor.status) === 'active' ? p : 0);
            if (total > 100.0001) return NextResponse.json({ error: `Active partner shares would total ${total}%. The total cannot exceed 100%.` }, { status: 400 });
            investor.sharePercentage = p;
        }
        if (body.name) investor.name = String(body.name).trim();
        if (body.email !== undefined) investor.email = String(body.email || '').trim().toLowerCase();
        if (body.phone) investor.phone = cleanPhone(body.phone) || String(body.phone).trim();
        if (body.capitalInvested !== undefined) investor.capitalInvested = Number(body.capitalInvested);
        if (body.status && ['active', 'inactive'].includes(body.status)) investor.status = body.status;
        if (body.userId !== undefined) investor.userId = isObjectId(body.userId) ? String(body.userId) : '';
        if (body.joinedDate) investor.joinedDate = body.joinedDate;

        await investor.save();

        return NextResponse.json({
            success: true,
            message: 'Investor updated successfully',
            investor: investor.toJSON()
        });
    } catch (err) {
        return errorResponse(err, 'investors/[id]');
    }
}

export async function DELETE(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
        const payoutCount = await Payout.countDocuments({ investorId: id });
        if (payoutCount > 0) {
            // Keep the payout history intact; deactivate instead of deleting
            const inv = await Investor.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
            return NextResponse.json({ success: true, message: `Investor has ${payoutCount} payouts on record, so the account was set to inactive instead of deleted.`, investor: inv ? inv.toJSON() : null });
        }
        await Investor.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Investor deleted successfully' });
    } catch (err) {
        return errorResponse(err, 'investors/[id]');
    }
}
