import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Investor } from '@/models/investor-model';
import { User } from '@/models/user-model';
import { readJson, badRequest, errorResponse } from '@/lib/validate';
import { requirePermission, isObjectId, cleanPhone, isValidBdPhone } from '@/lib/apiAuth';
import { applyUpdateAudit, stampCreate } from '@/lib/audit';
import { canEditAccount, withStaffRoleNames, EMAIL_RE } from '@/lib/userAdmin';
import { replaceEmailOtp } from '@/queries/auth-queries';
import {
    isMailConfigured,
    isDeliverableEmail,
    sendInvestorWelcomeEmail,
    safeSendInvestorWelcomeEmail,
    safeSendAdminPasswordResetEmail,
    sendEmailOtp
} from '@/utils/mail';

const OTP_TTL_MINUTES = 15;

function hashOtp(code) {
    return crypto.createHash('sha256').update(String(code), 'utf8').digest('hex');
}

function generateSixDigitOtp() {
    return String(crypto.randomInt(100000, 1000000));
}

async function resolveLinkedUser(investor) {
    if (isObjectId(investor.userId)) {
        const byId = await User.findById(investor.userId);
        if (byId) return byId;
    }
    const phone = cleanPhone(investor.phone);
    if (phone) {
        return User.findOne({ phone });
    }
    return null;
}

function resolveEmail(override, investor, user) {
    const candidates = [override, investor?.email, user?.email];
    for (const candidate of candidates) {
        const clean = String(candidate || '').trim().toLowerCase();
        if (isDeliverableEmail(clean)) return clean;
    }
    return '';
}

/**
 * POST /api/investors/:id/mail
 * Body: { action: 'resend_welcome' | 'send_reset_code' | 'reset_password' | 'create_login', ... }
 */
export async function POST(request, { params }) {
    try {
        const { user: actor, denied } = await requirePermission(request, 'investors');
        if (denied) return denied;
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Investor not found' }, { status: 404 });

        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const action = String(body.action || '').trim();
        const rawEmailOverride = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (rawEmailOverride && (!EMAIL_RE.test(rawEmailOverride) || rawEmailOverride.length > 120)) {
            return badRequest('Enter a valid email address.');
        }

        await connectToDatabase();
        const investor = await Investor.findById(id);
        if (!investor) return NextResponse.json({ error: 'Investor not found' }, { status: 404 });

        // 1. Resend Welcome / Partner Account Email
        if (action === 'resend_welcome') {
            const linkedUser = await resolveLinkedUser(investor);
            const targetEmail = resolveEmail(rawEmailOverride, investor, linkedUser);
            if (!targetEmail) {
                return badRequest('No valid email address is on file for this investor. Add an email address first.');
            }
            if (!isMailConfigured()) {
                return NextResponse.json(
                    { error: 'Email service is not configured on the server (set GMAIL_USER and GMAIL_APP_PASSWORD in .env).' },
                    { status: 503 }
                );
            }

            if (rawEmailOverride && body.saveEmail !== false && rawEmailOverride !== investor.email) {
                investor.email = rawEmailOverride;
                applyUpdateAudit(investor, actor, { fallback: 'Admin Desk' });
                await investor.save();
            }

            await sendInvestorWelcomeEmail({
                toEmail: targetEmail,
                fullName: investor.name,
                phone: investor.phone,
                sharePercentage: investor.sharePercentage,
                capitalInvested: investor.capitalInvested
            });

            return NextResponse.json({
                success: true,
                message: `Welcome email sent to ${targetEmail}.`,
                investor: investor.toJSON(),
                emailStatus: { sent: true, toEmail: targetEmail }
            });
        }

        // 2. Send 6-Digit Password Reset Code (OTP) Email
        if (action === 'send_reset_code') {
            const linkedUser = await resolveLinkedUser(investor);
            if (!linkedUser) {
                return NextResponse.json(
                    { error: 'This investor has no login account yet. Create a login account first.' },
                    { status: 404 }
                );
            }
            if (!canEditAccount(actor, linkedUser)) {
                return NextResponse.json({ error: 'You do not have permission to manage this login account.' }, { status: 403 });
            }
            if (linkedUser.disabled) {
                return NextResponse.json({ error: 'This login account is disabled. Enable it under Users first.' }, { status: 403 });
            }

            const targetEmail = resolveEmail(rawEmailOverride, investor, linkedUser);
            if (!targetEmail) {
                return badRequest('No valid email address is on file for this investor. Add an email address first.');
            }
            if (!isMailConfigured()) {
                return NextResponse.json(
                    { error: 'Email service is not configured on the server (set GMAIL_USER and GMAIL_APP_PASSWORD in .env).' },
                    { status: 503 }
                );
            }

            // Ensure the login account carries the email so OTP verification & login by email work seamlessly
            if (!isDeliverableEmail(linkedUser.email) || (rawEmailOverride && body.saveEmail !== false && rawEmailOverride !== linkedUser.email)) {
                linkedUser.email = targetEmail;
                linkedUser.emailVerified = false;
                linkedUser.emailVerifiedAt = null;
                applyUpdateAudit(linkedUser, actor, { fallback: 'Admin Desk' });
                await linkedUser.save();
            }
            if (rawEmailOverride && body.saveEmail !== false && rawEmailOverride !== investor.email) {
                investor.email = rawEmailOverride;
                applyUpdateAudit(investor, actor, { fallback: 'Admin Desk' });
                await investor.save();
            }

            const code = generateSixDigitOtp();
            const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
            await replaceEmailOtp({
                userId: linkedUser._id.toString(),
                email: targetEmail,
                purpose: 'password-reset',
                codeHash: hashOtp(code),
                expiresAt,
                actor
            });

            await sendEmailOtp({
                toEmail: targetEmail,
                fullName: investor.name || linkedUser.name,
                code,
                expiresInMinutes: OTP_TTL_MINUTES,
                purpose: 'password-reset'
            });

            const [userJson] = await withStaffRoleNames([linkedUser.toJSON()]);
            return NextResponse.json({
                success: true,
                message: `Password reset code sent to ${targetEmail} (valid for ${OTP_TTL_MINUTES} minutes).`,
                investor: investor.toJSON(),
                user: userJson,
                emailStatus: { sent: true, toEmail: targetEmail }
            });
        }

        // 3. Direct Admin Password Reset (+ optional email delivery of new credentials)
        if (action === 'reset_password') {
            const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';
            if (newPassword.length < 6) return badRequest('Password must be at least 6 characters.');
            if (newPassword.length > 100) return badRequest('Password is too long.');

            const linkedUser = await resolveLinkedUser(investor);
            if (!linkedUser) {
                return NextResponse.json(
                    { error: 'This investor has no login account yet. Create a login account first.' },
                    { status: 404 }
                );
            }
            if (!canEditAccount(actor, linkedUser)) {
                return NextResponse.json({ error: 'You do not have permission to reset this login account password.' }, { status: 403 });
            }

            const targetEmail = resolveEmail(rawEmailOverride, investor, linkedUser);
            if (targetEmail && !isDeliverableEmail(linkedUser.email)) {
                linkedUser.email = targetEmail;
            }
            if (rawEmailOverride && body.saveEmail !== false && rawEmailOverride !== investor.email) {
                investor.email = rawEmailOverride;
                applyUpdateAudit(investor, actor, { fallback: 'Admin Desk' });
                await investor.save();
            }

            linkedUser.password = newPassword; // hashed by pre-save hook
            applyUpdateAudit(linkedUser, actor, { fallback: 'Admin Desk' });
            await linkedUser.save();

            let emailStatus = { sent: false, reason: 'skipped_by_admin' };
            if (body.sendEmail !== false) {
                emailStatus = await safeSendAdminPasswordResetEmail({
                    toEmail: targetEmail,
                    fullName: investor.name || linkedUser.name,
                    phone: linkedUser.phone,
                    newPassword,
                    role: linkedUser.role
                });
            }

            const [userJson] = await withStaffRoleNames([linkedUser.toJSON()]);
            return NextResponse.json({
                success: true,
                message: emailStatus.sent
                    ? `Password reset and emailed to ${emailStatus.toEmail}.`
                    : `Password reset for ${linkedUser.name}.`,
                investor: investor.toJSON(),
                user: userJson,
                emailStatus
            });
        }

        // 4. Create Investor Login Account for an existing investor record (+ welcome email with credentials)
        if (action === 'create_login') {
            const password = typeof body.password === 'string' ? body.password.trim() : '';
            if (password.length < 6) return badRequest('Password must be at least 6 characters.');
            if (password.length > 100) return badRequest('Password is too long.');

            const phone = cleanPhone(investor.phone);
            if (!isValidBdPhone(phone)) {
                return badRequest('Update the investor with a valid 11-digit Bangladeshi mobile number before creating a login.');
            }

            const existing = await User.findOne({ phone });
            if (existing) {
                return NextResponse.json(
                    { error: `A ${existing.role} login account already exists for ${phone}. Use Link Login or Reset Password instead.` },
                    { status: 409 }
                );
            }

            const targetEmail = resolveEmail(rawEmailOverride, investor, null);
            if (rawEmailOverride && rawEmailOverride !== investor.email) {
                investor.email = rawEmailOverride;
            }

            const newUser = new User({
                name: investor.name,
                phone,
                email: targetEmail,
                password,
                role: 'investor',
                disabled: false,
                ...stampCreate(actor, { fallback: 'Admin Desk' })
            });
            await newUser.save();

            investor.userId = String(newUser._id);
            applyUpdateAudit(investor, actor, { fallback: 'Admin Desk' });
            await investor.save();

            let emailStatus = { sent: false, reason: 'skipped_by_admin' };
            if (body.sendEmail !== false) {
                emailStatus = await safeSendInvestorWelcomeEmail({
                    toEmail: targetEmail,
                    fullName: investor.name,
                    phone,
                    sharePercentage: investor.sharePercentage,
                    capitalInvested: investor.capitalInvested,
                    password
                });
            }

            const [userJson] = await withStaffRoleNames([newUser.toJSON()]);
            return NextResponse.json({
                success: true,
                message: emailStatus.sent
                    ? `Investor login created and welcome email sent to ${emailStatus.toEmail}.`
                    : `Investor login account created for ${investor.name}.`,
                investor: investor.toJSON(),
                user: userJson,
                emailStatus
            }, { status: 201 });
        }

        return badRequest('Unsupported action. Use resend_welcome, send_reset_code, reset_password, or create_login.');
    } catch (err) {
        return errorResponse(err, 'POST /api/investors/[id]/mail');
    }
}
