import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/setting-model';
import { requirePermission } from '@/lib/apiAuth';
import { readJson, badRequest, errorResponse } from '@/lib/validate';
import {
    getSmsConfig,
    getSmsBalance,
    getSmsReport,
    sendSms
} from '@/service/sms-service';

/**
 * GET /api/sms  (admin / staff with `settings` or `bookings` permission)
 *   - Default: returns SMS gateway status + live balance from api.sms.net.bd
 *   - ?requestId=... : fetches delivery report from api.sms.net.bd/report/request/{id}/
 */
export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, ['settings', 'bookings']);
        if (denied) return denied;

        const { searchParams } = new URL(request.url);
        const requestId = (searchParams.get('requestId') || '').trim();
        if (requestId) {
            const reportRes = await getSmsReport(requestId);
            return NextResponse.json(
                { success: reportRes.ok, ...reportRes },
                { status: reportRes.ok ? 200 : 400 }
            );
        }

        const [cfg, balanceRes] = await Promise.all([getSmsConfig(), getSmsBalance()]);
        return NextResponse.json({
            success: true,
            sms: {
                configured: cfg.configured,
                source: cfg.source,
                smsApiKey: cfg.apiKey,
                smsSenderId: cfg.senderId,
                balance: balanceRes.ok ? balanceRes.balance : null,
                balanceError: balanceRes.ok ? '' : (balanceRes.message || '')
            }
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/sms');
    }
}

/**
 * PUT /api/sms  (admin / staff with `settings` permission)
 * Saves SMS gateway API key and optional Sender ID in MongoDB Setting.
 */
export async function PUT(request) {
    try {
        const { denied } = await requirePermission(request, 'settings');
        if (denied) return denied;

        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const smsApiKey = String(body.smsApiKey ?? '').trim();
        const smsSenderId = String(body.smsSenderId ?? '').trim();
        if (smsApiKey.length > 200) return badRequest('SMS API Key is too long.');
        if (smsSenderId.length > 60) return badRequest('Sender ID is too long.');

        await connectToDatabase();
        const settings = await Setting.getOrCreateSettings();
        settings.smsApiKey = smsApiKey;
        settings.smsSenderId = smsSenderId;
        await settings.save();

        const [cfg, balanceRes] = await Promise.all([getSmsConfig(), getSmsBalance()]);
        return NextResponse.json({
            success: true,
            message: 'SMS gateway settings saved.',
            sms: {
                configured: cfg.configured,
                source: cfg.source,
                smsApiKey: cfg.apiKey,
                smsSenderId: cfg.senderId,
                balance: balanceRes.ok ? balanceRes.balance : null,
                balanceError: balanceRes.ok ? '' : (balanceRes.message || '')
            }
        });
    } catch (err) {
        return errorResponse(err, 'PUT /api/sms');
    }
}

/**
 * POST /api/sms  (admin / staff with `settings` or `bookings` permission)
 * Sends a test or manual SMS (immediate or scheduled) via api.sms.net.bd/sendsms.
 * Body: { to, msg, schedule?, senderId?, contentId? }
 */
export async function POST(request) {
    try {
        const { denied } = await requirePermission(request, ['settings', 'bookings']);
        if (denied) return denied;

        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const result = await sendSms({
            to: body.to,
            msg: body.msg,
            schedule: body.schedule,
            senderId: body.senderId,
            contentId: body.contentId
        });

        if (!result.ok) {
            return NextResponse.json(
                { error: result.message, errorCode: result.errorCode },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.schedule
                ? `SMS scheduled for ${result.schedule} (Request ID: ${result.requestId}).`
                : `SMS submitted successfully (Request ID: ${result.requestId}).`,
            requestId: result.requestId,
            recipients: result.recipients,
            schedule: result.schedule
        });
    } catch (err) {
        return errorResponse(err, 'POST /api/sms');
    }
}
