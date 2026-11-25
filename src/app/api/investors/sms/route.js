import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Investor } from '@/models/investor-model';
import { requirePermission, isObjectId } from '@/lib/apiAuth';
import { readJson, badRequest, errorResponse } from '@/lib/validate';
import { cleanPhone, isValidBdPhone } from '@/lib/phone';
import { getSmsBalance, sendSms } from '@/service/sms-service';

const MAX_MESSAGES = 50;
const MAX_LENGTH = 1000;

/**
 * GET /api/investors/sms  (staff with `investors` permission)
 * SMS gateway status + live balance for the Investors page.
 */
export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, 'investors');
        if (denied) return denied;
        const bal = await getSmsBalance();
        return NextResponse.json({
            success: true,
            sms: {
                configured: Boolean(bal.configured),
                balance: bal.ok ? bal.balance : null,
                error: bal.ok ? '' : (bal.message || '')
            }
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/investors/sms');
    }
}

/**
 * POST /api/investors/sms  (staff with `investors` permission)
 * Body: { messages: [{ investorId, msg }], schedule? }
 * Each partner gets their own personalised SMS. The mobile number always comes from the
 * saved investor record (never from the client). Every send is recorded in SmsLog.
 */
export async function POST(request) {
    try {
        const { user: actor, denied } = await requirePermission(request, 'investors');
        if (denied) return denied;

        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) return badRequest('Select at least one investor to SMS.');
        if (messages.length > MAX_MESSAGES) return badRequest(`You can SMS at most ${MAX_MESSAGES} investors at once.`);

        const ids = [...new Set(messages.map(m => String(m?.investorId || '')).filter(isObjectId))];
        await connectToDatabase();
        const investors = await Investor.find({ _id: { $in: ids } }).select('name phone').lean();
        const byId = new Map(investors.map(i => [String(i._id), i]));

        const schedule = typeof body.schedule === 'string' ? body.schedule : '';
        const sentBy = actor?.name || 'Admin';
        const results = [];

        for (const item of messages) {
            const investorId = String(item?.investorId || '');
            const inv = byId.get(investorId);
            const msg = String(item?.msg || '').trim();
            if (!inv) {
                results.push({ investorId, ok: false, error: 'Investor not found.' });
                continue;
            }
            const phone = cleanPhone(inv.phone);
            if (!isValidBdPhone(phone)) {
                results.push({ investorId, name: inv.name, ok: false, error: 'No valid mobile number on file.' });
                continue;
            }
            if (!msg) {
                results.push({ investorId, name: inv.name, phone, ok: false, error: 'Message is empty.' });
                continue;
            }
            if (msg.length > MAX_LENGTH) {
                results.push({ investorId, name: inv.name, phone, ok: false, error: `Message exceeds ${MAX_LENGTH} characters.` });
                continue;
            }

            const res = await sendSms({
                to: phone,
                msg,
                schedule,
                logMeta: {
                    category: 'manual',
                    recipientSummary: `${inv.name} (${phone}) · Investor`,
                    sentBy
                }
            });
            results.push({
                investorId,
                name: inv.name,
                phone,
                ok: res.ok,
                requestId: res.requestId || '',
                error: res.ok ? '' : res.message
            });
            // Stop early on account-level gateway errors (bad key, no balance, expired account...)
            if (!res.ok && [405, 410, 411, 412, 413, 417].includes(Number(res.errorCode))) break;
        }

        const sent = results.filter(r => r.ok).length;
        const failed = results.length - sent;
        const firstError = results.find(r => !r.ok)?.error || '';

        if (sent === 0) {
            return NextResponse.json({ error: firstError || 'SMS could not be sent.', sent, failed, results }, { status: 400 });
        }
        return NextResponse.json({
            success: true,
            sent,
            failed,
            results,
            message: `${schedule ? 'Scheduled' : 'Sent'} SMS to ${sent} investor${sent === 1 ? '' : 's'}${failed ? ` (${failed} failed: ${firstError})` : ''}.`
        });
    } catch (err) {
        return errorResponse(err, 'POST /api/investors/sms');
    }
}
