import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Investor } from '@/models/investor-model';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { INVESTOR_PAYOUT_DETAILS_SCHEMA, MOBILE_WALLET_METHODS } from '@/lib/schemas';
import { requirePermission, isObjectId, isValidBdPhone, cleanPhone } from '@/lib/apiAuth';
import { applyUpdateAudit } from '@/lib/audit';
import { findInvestorForUser } from '@/lib/investorAccess';

/**
 * Investor portal settings.
 *
 *   GET /api/investors/settings               -> my login account + my partner record + payout preference
 *   PUT /api/investors/settings               -> save my payout preference
 *       body: { payoutDetails: { method, accountName, accountNumber, bankName, branch, note } }
 *
 * Partners can only ever read and change their own record (resolved from the session, never from the
 * request). Admins act on the partner named by `investorId` (query string on GET, body on PUT).
 * Name, phone, share and capital stay admin-only (/api/investors/:id); the login name, email and
 * password are changed through PUT /api/auth/me.
 */

const EMPTY_DETAILS = { method: '', accountName: '', accountNumber: '', bankName: '', branch: '', note: '' };

const accountView = (user) => ({
    id: user.userId || user.id,
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    role: user.role
});

/** The partner record this request is allowed to act on, or a ready-made error response. */
async function resolveInvestor(user, requestedId) {
    if (user.role !== 'investor') {
        if (!requestedId) return { investor: null };
        if (!isObjectId(requestedId)) return { denied: NextResponse.json({ error: 'Investor not found' }, { status: 404 }) };
        const investor = await Investor.findById(requestedId);
        if (!investor) return { denied: NextResponse.json({ error: 'Investor not found' }, { status: 404 }) };
        return { investor };
    }
    return { investor: await findInvestorForUser(user) };
}

/** Apply the per-method rules and drop fields that do not belong to the chosen method. */
function normalisePayoutDetails(data) {
    const method = data.method || '';
    const accountName = data.accountName || '';
    const accountNumber = data.accountNumber || '';
    const bankName = data.bankName || '';
    const branch = data.branch || '';
    const note = data.note || '';

    if (!method) return { details: { ...EMPTY_DETAILS } };

    if (MOBILE_WALLET_METHODS.includes(method)) {
        if (!accountNumber) return { error: 'Wallet number is required.' };
        if (!isValidBdPhone(accountNumber)) return { error: 'Wallet number must be a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).' };
        return { details: { ...EMPTY_DETAILS, method, accountName, accountNumber: cleanPhone(accountNumber), note } };
    }
    if (method === 'bank_transfer') {
        if (!accountName) return { error: 'Account holder name is required.' };
        if (!bankName) return { error: 'Bank name is required.' };
        if (!accountNumber) return { error: 'Account number is required.' };
        if (!/^[0-9A-Za-z][0-9A-Za-z -]{4,32}[0-9A-Za-z]$/.test(accountNumber)) return { error: 'Account number must be 6 to 34 letters or digits.' };
        return { details: { method, accountName, accountNumber, bankName, branch, note } };
    }
    if (method === 'cheque') {
        if (!accountName) return { error: 'Payee name is required for a cheque.' };
        return { details: { ...EMPTY_DETAILS, method, accountName, note } };
    }
    // cash: collected in person, nothing else to store
    return { details: { ...EMPTY_DETAILS, method, note } };
}

export async function GET(request) {
    try {
        const { user, denied } = await requirePermission(request, 'investors', { alsoRoles: ['investor'] });
        if (denied) return denied;
        await connectToDatabase();

        const requestedId = new URL(request.url).searchParams.get('investorId');
        const { investor, denied: notFound } = await resolveInvestor(user, requestedId);
        if (notFound) return notFound;

        const json = investor ? investor.toJSON() : null;
        return NextResponse.json({
            success: true,
            account: accountView(user),
            investor: json,
            payoutDetails: json ? { ...EMPTY_DETAILS, ...(json.payoutDetails || {}) } : null
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/investors/settings');
    }
}

export async function PUT(request) {
    try {
        const { user, denied } = await requirePermission(request, 'investors', { alsoRoles: ['investor'] });
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const raw = body.payoutDetails;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return badRequest('payoutDetails must be an object.');
        const { data, error: inputError } = validate(raw, INVESTOR_PAYOUT_DETAILS_SCHEMA);
        if (inputError) return badRequest(inputError);
        const { details, error: ruleError } = normalisePayoutDetails(data);
        if (ruleError) return badRequest(ruleError);

        await connectToDatabase();
        const { investor, denied: notFound } = await resolveInvestor(user, body.investorId);
        if (notFound) return notFound;
        if (!investor) {
            return user.role !== 'investor'
                ? badRequest('investorId is required.')
                : NextResponse.json({ error: 'No partner account is linked to your login. Please contact the arena desk.' }, { status: 404 });
        }

        investor.payoutDetails = { ...details, updatedAt: new Date() };
        applyUpdateAudit(investor, user, { fallback: 'Investor Portal' });
        await investor.save();

        return NextResponse.json({
            success: true,
            message: details.method ? 'Payout preference saved.' : 'Payout preference cleared.',
            investor: investor.toJSON()
        });
    } catch (err) {
        return errorResponse(err, 'PUT /api/investors/settings');
    }
}
