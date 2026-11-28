import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Investor } from '@/models/investor-model';
import { User } from '@/models/user-model';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { INVESTOR_SCHEMA } from '@/lib/schemas';
import { requirePermission, isObjectId, cleanPhone } from '@/lib/apiAuth';
import { applyUpdateAudit, stampCreate, stampCreateAuditOnly, stampUpdate } from '@/lib/audit';
import { findInvestorForUser } from '@/lib/investorAccess';
import { withStaffRoleNames } from '@/lib/userAdmin';
import { isDeliverableEmail, safeSendInvestorWelcomeEmail } from '@/utils/mail';

/** Fields an investor may see about other partners (no contact details). */
const publicView = (i) => ({
    id: i.id,
    name: i.name,
    sharePercentage: i.sharePercentage,
    status: i.status,
    joinedDate: i.joinedDate
});

export async function GET(request) {
    try {
        const { user, denied } = await requirePermission(request, ['investors', 'finance'], { alsoRoles: ['investor'] });
        if (denied) return denied;
        await connectToDatabase();
        const investors = await Investor.find().sort({ sharePercentage: -1 });

        if (user.role !== 'investor') {
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

function assertShareTotal(candidates) {
    // candidates: [{ id?, sharePercentage, status }] - the full intended list
    const total = candidates
        .filter(c => (c.status || 'active') === 'active')
        .reduce((s, c) => s + Number(c.sharePercentage || 0), 0);
    if (total > 100.0001) {
        return `Active partner shares add up to ${Math.round(total * 100) / 100}%. The total cannot exceed 100%.`;
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
        const { user: actor, denied } = await requirePermission(request, 'investors');
        if (denied) return denied;
        // Supports single-object creation as well as legacy array batch saves
        const { body, error: jsonError } = await readJson(request, { allowArray: true });
        if (jsonError) return jsonError;
        const isArrayPayload = Array.isArray(body);
        const rawItems = isArrayPayload ? body : [body];
        if (rawItems.length === 0 || rawItems.length > 50) {
            return badRequest('Send between 1 and 50 investors at a time.');
        }

        const items = [];
        for (const raw of rawItems) {
            if (!raw || typeof raw !== 'object') return badRequest('Each investor must be an object.');
            const id = raw.id || raw._id;
            const isExisting = isObjectId(id);
            const { data, error } = validate(raw, INVESTOR_SCHEMA, { partial: isExisting });
            if (error) return badRequest(error);

            const createLogin = raw.createLogin === true;
            const rawPassword = typeof raw.password === 'string' ? raw.password.trim() : '';
            if (!isExisting && createLogin && rawPassword) {
                if (rawPassword.length < 6) return badRequest('Login password must be at least 6 characters.');
                if (rawPassword.length > 100) return badRequest('Login password is too long.');
            }

            items.push({
                ...data,
                id,
                userId: raw.userId,
                payoutsPaid: raw.payoutsPaid === undefined ? undefined : Math.max(0, Number(raw.payoutsPaid) || 0),
                createLogin,
                password: rawPassword,
                sendEmail: raw.sendEmail !== false
            });
        }

        await connectToDatabase();

        // Validate resulting share total and duplicate phones before writing
        const existing = await Investor.find();
        const existingPhones = new Set(existing.map(e => cleanPhone(e.phone)).filter(Boolean));
        const merged = existing.map(e => ({ id: String(e._id), sharePercentage: e.sharePercentage, status: e.status }));

        for (const item of items) {
            const id = item.id || item._id;
            const idx = isObjectId(id) ? merged.findIndex(m => m.id === String(id)) : -1;
            if (idx < 0 && item.phone) {
                const phone = cleanPhone(item.phone);
                if (existingPhones.has(phone)) {
                    return NextResponse.json(
                        { error: `An investor partner with mobile number ${phone} already exists.` },
                        { status: 409 }
                    );
                }
                existingPhones.add(phone);
            }
            const next = {
                id: idx >= 0 ? merged[idx].id : undefined,
                sharePercentage: item.sharePercentage ?? (idx >= 0 ? merged[idx].sharePercentage : 0),
                status: item.status || (idx >= 0 ? merged[idx].status : 'active')
            };
            if (idx >= 0) merged[idx] = next;
            else merged.push(next);
        }

        const shareError = assertShareTotal(merged);
        if (shareError) return NextResponse.json({ error: shareError }, { status: 400 });

        const results = [];
        let lastUserJson = null;
        let accountCreated = false;
        let accountLinked = false;
        let accountNote = '';
        let lastEmailStatus = null;

        for (const item of items) {
            const id = item.id || item._id;
            if (isObjectId(id)) {
                const updated = await Investor.findByIdAndUpdate(
                    id,
                    { $set: { ...pickFields(item), ...stampUpdate(actor, { fallback: 'Admin Desk' }) } },
                    { new: true, runValidators: true }
                );
                if (updated) {
                    results.push(updated.toJSON());
                    continue;
                }
            }
            if (!item.name || !item.phone) continue;

            const fields = pickFields(item);
            let linkedUserId = fields.userId || '';
            let createdPassword = '';

            // Auto-create or link an investor portal login account when requested (or match an existing investor login)
            const existingUser = await User.findOne({ phone: fields.phone });
            if (existingUser) {
                if (existingUser.role === 'investor') {
                    linkedUserId = String(existingUser._id);
                    accountLinked = true;
                    if (isDeliverableEmail(fields.email) && !isDeliverableEmail(existingUser.email)) {
                        existingUser.email = fields.email;
                        applyUpdateAudit(existingUser, actor, { fallback: 'Admin Desk' });
                        await existingUser.save();
                    }
                    const [uJson] = await withStaffRoleNames([existingUser.toJSON()]);
                    lastUserJson = uJson;
                } else if ((existingUser.role === 'player' || existingUser.role === 'visitor') && item.createLogin && actor.role === 'admin') {
                    existingUser.role = 'investor';
                    if (isDeliverableEmail(fields.email) && !isDeliverableEmail(existingUser.email)) {
                        existingUser.email = fields.email;
                    }
                    applyUpdateAudit(existingUser, actor, { fallback: 'Admin Desk' });
                    await existingUser.save();
                    linkedUserId = String(existingUser._id);
                    accountLinked = true;
                    accountNote = 'Existing user account with this mobile was upgraded to the investor role and linked.';
                    const [uJson] = await withStaffRoleNames([existingUser.toJSON()]);
                    lastUserJson = uJson;
                } else if (item.createLogin) {
                    accountNote = `A ${existingUser.role} account already uses ${fields.phone}, so a separate login was not created.`;
                }
            } else if (item.createLogin && item.password) {
                const newUser = new User({
                    name: fields.name,
                    phone: fields.phone,
                    email: fields.email || '',
                    password: item.password,
                    role: 'investor',
                    disabled: false,
                    ...stampCreate(actor, { fallback: 'Admin Desk' })
                });
                await newUser.save();
                linkedUserId = String(newUser._id);
                createdPassword = item.password;
                accountCreated = true;
                const [uJson] = await withStaffRoleNames([newUser.toJSON()]);
                lastUserJson = uJson;
            }

            const created = new Investor({
                ...fields,
                userId: linkedUserId,
                capitalInvested: Number(fields.capitalInvested || 0),
                joinedDate: fields.joinedDate || new Date().toISOString().split('T')[0],
                payoutsPaid: Number(item.payoutsPaid || 0),
                status: fields.status || 'active',
                ...stampCreateAuditOnly(actor, 'Admin Desk')
            });
            await created.save();

            const recipientEmail = isDeliverableEmail(created.email)
                ? created.email
                : (lastUserJson && isDeliverableEmail(lastUserJson.email) ? lastUserJson.email : '');

            if (item.sendEmail) {
                lastEmailStatus = await safeSendInvestorWelcomeEmail({
                    toEmail: recipientEmail,
                    fullName: created.name,
                    phone: created.phone,
                    sharePercentage: created.sharePercentage,
                    capitalInvested: created.capitalInvested,
                    password: createdPassword
                });
            } else {
                lastEmailStatus = { sent: false, reason: 'skipped_by_admin' };
            }

            results.push(created.toJSON());
        }

        const all = await Investor.find().sort({ sharePercentage: -1 });
        return NextResponse.json({
            success: true,
            message: isArrayPayload ? 'Investors updated successfully' : 'Investor partner added successfully',
            investor: results[0] || null,
            investors: all.map(i => i.toJSON()),
            user: lastUserJson,
            accountCreated,
            accountLinked,
            accountNote,
            emailStatus: lastEmailStatus
        }, { status: isArrayPayload ? 200 : 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/investors');
    }
}
