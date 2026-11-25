import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/setting-model';
import { SmsLog } from '@/models/sms-log-model';
import { requirePermission, requireSuperAdminDelete, isObjectId } from '@/lib/apiAuth';
import { hasPermission } from '@/lib/permissions';
import { readJson, badRequest, errorResponse } from '@/lib/validate';
import { parsePhoneTokens } from '@/lib/smsUtils';
import {
    getSmsConfig,
    getSmsBalance,
    syncSmsLogReport,
    resolveSmsAudiencePhones,
    sendSms
} from '@/service/sms-service';

const MAX_RECIPIENTS_PER_REQUEST = 2500;
const CHUNK_SIZE = 500;

function escapeRegex(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/sms  (admin / staff with `settings`, `bookings`, or `players` permission)
 *   - ?requestId=... or ?logId=... : fetches live delivery report from sms.net.bd and updates SmsLog
 *   - ?includeLogs=1 : returns SMS gateway status + live balance + paginated SmsLog history + KPI stats
 *   - Default: returns SMS gateway status + live balance from api.sms.net.bd
 */
export async function GET(request) {
    try {
        const { user, denied } = await requirePermission(request, ['settings', 'bookings', 'players']);
        if (denied) return denied;

        const { searchParams } = new URL(request.url);
        const requestId = (searchParams.get('requestId') || '').trim();
        const logId = (searchParams.get('logId') || '').trim();

        if (requestId || logId) {
            const reportRes = await syncSmsLogReport({ logId, requestId });
            return NextResponse.json(
                { success: reportRes.ok, ...reportRes },
                { status: reportRes.ok ? 200 : 400 }
            );
        }

        const includeLogs = searchParams.get('includeLogs') === '1';
        const canSeeSecret = hasPermission(user, 'settings');

        const [cfg, balanceRes] = await Promise.all([getSmsConfig(), getSmsBalance()]);
        const smsPayload = {
            configured: cfg.configured,
            source: cfg.source,
            smsApiKey: canSeeSecret ? cfg.apiKey : '',
            smsSenderId: cfg.senderId,
            balance: balanceRes.ok ? balanceRes.balance : null,
            validity: balanceRes.ok ? (balanceRes.validity || '') : '',
            balanceError: balanceRes.ok ? '' : (balanceRes.message || '')
        };

        if (!includeLogs) {
            return NextResponse.json({ success: true, sms: smsPayload });
        }

        await connectToDatabase();

        const page = Math.max(1, Number(searchParams.get('page')) || 1);
        const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
        const category = (searchParams.get('category') || 'all').trim();
        const status = (searchParams.get('status') || 'all').trim();
        const q = (searchParams.get('q') || '').trim();

        const filter = {};
        if (category && category !== 'all') {
            if (category === 'manual_bulk') {
                filter.category = { $in: ['manual', 'bulk_campaign'] };
            } else {
                filter.category = category;
            }
        }
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (q) {
            const rx = new RegExp(escapeRegex(q), 'i');
            const digitsOnly = q.replace(/[^0-9]/g, '').replace(/^8801/, '01');
            const orConds = [
                { recipientSummary: rx },
                { message: rx },
                { requestId: rx },
                { bookingCode: rx },
                { sentBy: rx }
            ];
            if (digitsOnly) {
                orConds.push({ recipients: new RegExp(escapeRegex(digitsOnly), 'i') });
            }
            filter.$or = orConds;
        }

        const [total, logDocs, aggRows] = await Promise.all([
            SmsLog.countDocuments(filter),
            SmsLog.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            SmsLog.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRecords: { $sum: 1 },
                        totalDispatched: {
                            $sum: { $cond: [{ $ne: ['$status', 'failed'] }, 1, 0] }
                        },
                        totalRecipients: {
                            $sum: { $cond: [{ $ne: ['$status', 'failed'] }, '$recipientCount', 0] }
                        },
                        totalSegments: {
                            $sum: { $cond: [{ $ne: ['$status', 'failed'] }, '$totalSegments', 0] }
                        },
                        scheduledCount: {
                            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
                        },
                        failedCount: {
                            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                        }
                    }
                }
            ])
        ]);

        const agg = aggRows[0] || {
            totalRecords: 0,
            totalDispatched: 0,
            totalRecipients: 0,
            totalSegments: 0,
            scheduledCount: 0,
            failedCount: 0
        };

        return NextResponse.json({
            success: true,
            sms: smsPayload,
            logs: logDocs.map(d => d.toJSON()),
            pagination: {
                page,
                limit,
                total,
                pages: Math.max(1, Math.ceil(total / limit))
            },
            stats: {
                totalRecords: agg.totalRecords,
                totalDispatched: agg.totalDispatched,
                totalRecipients: agg.totalRecipients,
                totalSegments: agg.totalSegments,
                scheduledCount: agg.scheduledCount,
                failedCount: agg.failedCount
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
                validity: balanceRes.ok ? (balanceRes.validity || '') : '',
                balanceError: balanceRes.ok ? '' : (balanceRes.message || '')
            }
        });
    } catch (err) {
        return errorResponse(err, 'PUT /api/sms');
    }
}

/**
 * POST /api/sms  (admin / staff with `settings`, `bookings`, or `players` permission)
 * Sends a single manual SMS, test SMS, or multi-recipient bulk SMS campaign (immediate or scheduled).
 * Body: {
 *   to?: string | string[],
 *   recipients?: string[],
 *   audiences?: string[],
 *   msg: string,
 *   schedule?: string,
 *   senderId?: string,
 *   contentId?: string,
 *   category?: 'manual' | 'bulk_campaign' | 'test',
 *   recipientSummary?: string
 * }
 */
export async function POST(request) {
    try {
        const { user, denied } = await requirePermission(request, ['settings', 'bookings', 'players']);
        if (denied) return denied;

        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const msgText = String(body.msg ?? '').trim();
        if (!msgText) return badRequest('SMS message cannot be empty.');
        if (msgText.length > 1500) return badRequest('SMS message cannot exceed 1,500 characters.');

        const manualParsed = parsePhoneTokens(body.to || '');
        const pickedParsed = parsePhoneTokens(Array.isArray(body.recipients) ? body.recipients : []);
        const audienceKeys = Array.isArray(body.audiences) ? body.audiences : [];
        const audienceResolved = audienceKeys.length > 0
            ? await resolveSmsAudiencePhones(audienceKeys)
            : { phones: [], labels: [] };

        const uniquePhones = [...new Set([
            ...audienceResolved.phones,
            ...pickedParsed.valid,
            ...manualParsed.valid
        ])];

        if (uniquePhones.length === 0) {
            return badRequest('Select at least one customer/user or enter a valid Bangladeshi mobile number (01XXXXXXXXX).');
        }
        if (uniquePhones.length > MAX_RECIPIENTS_PER_REQUEST) {
            return badRequest(`Too many recipients (${uniquePhones.length}). Maximum ${MAX_RECIPIENTS_PER_REQUEST} numbers per campaign.`);
        }

        const isBulk = uniquePhones.length > 1 || audienceKeys.length > 0;
        const category = body.category === 'test'
            ? 'test'
            : (isBulk ? 'bulk_campaign' : 'manual');

        let summary = String(body.recipientSummary || '').trim();
        if (!summary) {
            const summaryParts = [...audienceResolved.labels];
            if (pickedParsed.valid.length > 0) {
                summaryParts.push(`${pickedParsed.valid.length} selected contact${pickedParsed.valid.length === 1 ? '' : 's'}`);
            }
            if (manualParsed.valid.length > 0) {
                summaryParts.push(
                    manualParsed.valid.length === 1 && summaryParts.length === 0
                        ? manualParsed.valid[0]
                        : `${manualParsed.valid.length} manual number${manualParsed.valid.length === 1 ? '' : 's'}`
                );
            }
            summary = summaryParts.length > 0
                ? `${summaryParts.join(' + ')} (${uniquePhones.length})`
                : uniquePhones[0];
        }

        const sentBy = user?.name ? `${user.name}` : 'Admin';

        // Chunk large recipient lists cleanly (500 per gateway POST)
        const chunks = [];
        for (let i = 0; i < uniquePhones.length; i += CHUNK_SIZE) {
            chunks.push(uniquePhones.slice(i, i + CHUNK_SIZE));
        }

        const requestIds = [];
        const createdLogs = [];
        let finalSchedule = null;

        for (let idx = 0; idx < chunks.length; idx++) {
            const batch = chunks[idx];
            const batchSummary = chunks.length > 1
                ? `${summary} [Batch ${idx + 1}/${chunks.length}]`
                : summary;

            const result = await sendSms({
                to: batch,
                msg: msgText,
                schedule: body.schedule,
                senderId: body.senderId,
                contentId: body.contentId,
                logMeta: {
                    category,
                    recipientSummary: batchSummary,
                    sentBy
                }
            });

            if (!result.ok) {
                return NextResponse.json(
                    {
                        error: result.message,
                        errorCode: result.errorCode,
                        partialSentCount: idx * CHUNK_SIZE,
                        log: result.log || null
                    },
                    { status: 400 }
                );
            }

            if (result.requestId) requestIds.push(result.requestId);
            if (result.log) createdLogs.push(result.log);
            finalSchedule = result.schedule;
        }

        const reqDisplay = requestIds.join(', ');
        return NextResponse.json({
            success: true,
            message: finalSchedule
                ? `SMS scheduled for ${finalSchedule} to ${uniquePhones.length} recipient${uniquePhones.length === 1 ? '' : 's'} (Request ID: ${reqDisplay}).`
                : `SMS submitted to ${uniquePhones.length} recipient${uniquePhones.length === 1 ? '' : 's'} (Request ID: ${reqDisplay}).`,
            requestId: requestIds[0] || '',
            requestIds,
            recipientCount: uniquePhones.length,
            invalidManualCount: manualParsed.invalid.length,
            schedule: finalSchedule,
            logs: createdLogs
        });
    } catch (err) {
        return errorResponse(err, 'POST /api/sms');
    }
}

/**
 * DELETE /api/sms?id=...  (Super Admin only)
 * Permanently deletes an SMS log entry from history.
 */
export async function DELETE(request) {
    try {
        const { denied } = await requireSuperAdminDelete(request);
        if (denied) return denied;

        const { searchParams } = new URL(request.url);
        const id = (searchParams.get('id') || '').trim();
        if (!isObjectId(id)) return badRequest('Valid SMS log ID is required.');

        await connectToDatabase();
        const deleted = await SmsLog.findByIdAndDelete(id);
        if (!deleted) return NextResponse.json({ error: 'SMS log not found.' }, { status: 404 });

        return NextResponse.json({
            success: true,
            message: 'SMS history record deleted.'
        });
    } catch (err) {
        return errorResponse(err, 'DELETE /api/sms');
    }
}
