import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Investor } from '@/models/investor-model';
import { User } from '@/models/user-model';
import { Payout } from '@/models/payout-model';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { INVESTOR_SCHEMA } from '@/lib/schemas';
import { requirePermission, requireSuperAdminDelete, isObjectId, cleanPhone } from '@/lib/apiAuth';
import { applyUpdateAudit, stampUpdate } from '@/lib/audit';
import { canEditAccount, withStaffRoleNames } from '@/lib/userAdmin';

export async function PUT(request, { params }) {
    try {
        const { user: actor, denied } = await requirePermission(request, 'investors');
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
        const { body: raw, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;
        const { data, error: inputError } = validate(raw, INVESTOR_SCHEMA, { partial: true });
        if (inputError) return badRequest(inputError);
        const body = {
            ...data,
            ...(raw.userId !== undefined ? { userId: raw.userId } : {})
        };
        const syncAccount = raw.syncAccount === true;

        await connectToDatabase();

        const investor = await Investor.findById(id);
        if (!investor) {
            return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
        }

        const nextStatus = body.status && ['active', 'inactive'].includes(body.status) ? body.status : investor.status;
        const nextShare = body.sharePercentage !== undefined ? Number(body.sharePercentage) : Number(investor.sharePercentage || 0);

        // Validate total active shares whenever sharePercentage or status changes and partner will be active
        if ((body.sharePercentage !== undefined || body.status !== undefined) && nextStatus === 'active') {
            const others = await Investor.find({ _id: { $ne: investor._id }, status: 'active' }).select('sharePercentage');
            const total = others.reduce((s, o) => s + (o.sharePercentage || 0), 0) + nextShare;
            if (total > 100.0001) {
                return NextResponse.json(
                    { error: `Active partner shares would total ${Math.round(total * 100) / 100}%. The total cannot exceed 100%.` },
                    { status: 400 }
                );
            }
        }

        // Prevent duplicate investor phone when changing phone
        if (body.phone !== undefined) {
            const cleaned = cleanPhone(body.phone) || String(body.phone).trim();
            if (cleaned !== cleanPhone(investor.phone)) {
                const allOthers = await Investor.find({ _id: { $ne: investor._id } }).select('phone');
                if (allOthers.some(o => cleanPhone(o.phone) === cleaned)) {
                    return NextResponse.json(
                        { error: `Another investor partner already uses mobile number ${cleaned}.` },
                        { status: 409 }
                    );
                }
            }
            investor.phone = cleaned;
        }

        if (body.name !== undefined) investor.name = String(body.name).trim();
        if (body.email !== undefined) investor.email = String(body.email || '').trim().toLowerCase();
        if (body.sharePercentage !== undefined) investor.sharePercentage = nextShare;
        if (body.capitalInvested !== undefined) investor.capitalInvested = Number(body.capitalInvested);
        if (body.status && ['active', 'inactive'].includes(body.status)) investor.status = body.status;
        if (body.userId !== undefined) investor.userId = isObjectId(body.userId) ? String(body.userId) : '';
        if (body.joinedDate !== undefined) investor.joinedDate = body.joinedDate;
        applyUpdateAudit(investor, actor, { fallback: 'Admin Desk' });

        await investor.save();

        // Optionally sync name, email, and phone to the linked investor-role login account
        let syncedUserJson = null;
        if (syncAccount && isObjectId(investor.userId)) {
            const linkedUser = await User.findById(investor.userId);
            if (linkedUser && linkedUser.role === 'investor' && canEditAccount(actor, linkedUser)) {
                let changed = false;
                if (body.name !== undefined && body.name.length >= 2 && linkedUser.name !== investor.name) {
                    linkedUser.name = investor.name;
                    changed = true;
                }
                if (body.email !== undefined && linkedUser.email !== investor.email) {
                    linkedUser.email = investor.email;
                    linkedUser.emailVerified = false;
                    linkedUser.emailVerifiedAt = null;
                    changed = true;
                }
                if (body.phone !== undefined && linkedUser.phone !== investor.phone) {
                    const phoneClash = await User.findOne({ phone: investor.phone, _id: { $ne: linkedUser._id } });
                    if (!phoneClash) {
                        linkedUser.phone = investor.phone;
                        changed = true;
                    }
                }
                if (changed) {
                    applyUpdateAudit(linkedUser, actor, { fallback: 'Admin Desk' });
                    await linkedUser.save();
                    const [uJson] = await withStaffRoleNames([linkedUser.toJSON()]);
                    syncedUserJson = uJson;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Investor updated successfully',
            investor: investor.toJSON(),
            user: syncedUserJson
        });
    } catch (err) {
        return errorResponse(err, 'investors/[id]');
    }
}

export async function DELETE(request, { params }) {
    try {
        const { user: actor, denied } = await requireSuperAdminDelete(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Investor not found' }, { status: 404 });

        const investor = await Investor.findById(id);
        if (!investor) return NextResponse.json({ error: 'Investor not found' }, { status: 404 });

        const url = new URL(request.url);
        const permanent = url.searchParams.get('permanent') === '1';
        const deleteAccount = url.searchParams.get('deleteAccount') === '1';
        const payoutCount = await Payout.countDocuments({ investorId: id });

        let deletedUserId = null;
        const maybeDeleteLinkedAccount = async () => {
            if (!deleteAccount || actor.role !== 'admin') return;
            let linked = isObjectId(investor.userId) ? await User.findById(investor.userId) : null;
            if (!linked && investor.phone) {
                linked = await User.findOne({ phone: cleanPhone(investor.phone) });
            }
            // Only ever remove an investor-role login account from here (never admin/staff/player)
            if (linked && linked.role === 'investor') {
                await Investor.updateMany({ userId: String(linked._id) }, { $set: { userId: '' } });
                await User.deleteOne({ _id: linked._id });
                deletedUserId = String(linked._id);
            }
        };

        if (payoutCount > 0 && permanent) {
            await Investor.findByIdAndDelete(id);
            await maybeDeleteLinkedAccount();
            return NextResponse.json({
                success: true,
                deletedUserId,
                message: `Investor deleted. ${payoutCount} past payout${payoutCount === 1 ? '' : 's'} kept in the ledger.${deletedUserId ? ' Linked login account removed.' : ''}`
            });
        }
        if (payoutCount > 0) {
            // Keep the payout history intact; deactivate instead of deleting
            const inv = await Investor.findByIdAndUpdate(
                id,
                { status: 'inactive', ...stampUpdate(actor, { fallback: 'Admin Desk' }) },
                { new: true }
            );
            return NextResponse.json({
                success: true,
                message: `Investor has ${payoutCount} payouts on record, so the account was set to inactive instead of deleted.`,
                investor: inv ? inv.toJSON() : null
            });
        }
        await Investor.findByIdAndDelete(id);
        await maybeDeleteLinkedAccount();
        return NextResponse.json({
            success: true,
            deletedUserId,
            message: deletedUserId ? 'Investor and linked login account deleted successfully.' : 'Investor deleted successfully'
        });
    } catch (err) {
        return errorResponse(err, 'investors/[id]');
    }
}
