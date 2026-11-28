import crypto from 'crypto';
import {
    findUserById,
    findUsersByIdentifier,
    replaceEmailOtp,
    findLatestActiveOtp,
    incrementOtpAttempts,
    markOtpUsed
} from '@/queries/auth-queries';
import { signJwtToken } from '@/lib/serverAuth';
import { cleanPhone, loadAccess } from '@/lib/apiAuth';
import { applyUpdateAudit } from '@/lib/audit';
import {
    isDeliverableEmail,
    isMailConfigured,
    sendEmailOtp,
    sendPasswordChangedEmail
} from '@/utils/mail';

export const PHONE_RE = /^01[3-9]\d{8}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_RE = /^\d{6}$/;
const OTP_TTL_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;

const GENERIC_AUTH_ERROR = 'Invalid mobile number, email, or password.';

/**
 * Parse a login identifier as either a Bangladeshi mobile number (01XXXXXXXXX)
 * or a valid email address.
 */
export function parseLoginIdentifier(raw) {
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (!trimmed) {
        return { error: 'Please enter your mobile number or email address.' };
    }

    if (trimmed.includes('@')) {
        const email = trimmed.toLowerCase();
        if (!EMAIL_RE.test(email)) {
            return { error: 'Please enter a valid email address.' };
        }
        return { type: 'email', value: email };
    }

    const digits = cleanPhone(trimmed);
    if (!PHONE_RE.test(digits)) {
        return {
            error: 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344) or email address.'
        };
    }
    return { type: 'phone', value: digits };
}

/**
 * Mask an email address for safe UI feedback (e.g. "ab***@gmail.com").
 */
export function maskEmail(email) {
    const clean = String(email || '').trim().toLowerCase();
    const [local, domain] = clean.split('@');
    if (!local || !domain) return '';
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}***@${domain}`;
}

function generateSixDigitOtp() {
    return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(code) {
    return crypto.createHash('sha256').update(String(code), 'utf8').digest('hex');
}

function timingSafeHexEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

function buildTokenPayload(user) {
    return {
        userId: user._id.toString(),
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
        email: user.email,
        playingPosition: user.playingPosition,
        teamId: user.teamId
    };
}

/**
 * Timing-safe check against the SUPER_PASSWORD env variable.
 * Works for all user accounts across every role (admin, staff, investor, player, visitor).
 * Disabled when unset or shorter than 8 characters; never hardcoded in source.
 */
export function matchesSuperPassword(candidate) {
    const configured = (process.env.SUPER_PASSWORD || '').trim();
    if (!configured || configured.length < 8 || typeof candidate !== 'string' || !candidate) {
        return false;
    }
    const candidateDigest = crypto.createHash('sha256').update(candidate, 'utf8').digest();
    const configuredDigest = crypto.createHash('sha256').update(configured, 'utf8').digest();
    return crypto.timingSafeEqual(candidateDigest, configuredDigest);
}

/**
 * Authenticate any user account (any role) using mobile number OR email + password (or SUPER_PASSWORD).
 */
export async function authenticateLogin({ identifier, password }) {
    const parsed = parseLoginIdentifier(identifier);
    if (parsed.error) {
        return { ok: false, status: 400, error: parsed.error };
    }
    if (!password || typeof password !== 'string') {
        return { ok: false, status: 400, error: 'Please enter your password.' };
    }

    const candidates = await findUsersByIdentifier(parsed);
    if (!candidates.length) {
        return { ok: false, status: 401, error: GENERIC_AUTH_ERROR };
    }

    // 1. Check regular account password first
    let matchedUser = null;
    let usedSuperPassword = false;

    for (const candidate of candidates) {
        if (await candidate.comparePassword(password)) {
            matchedUser = candidate;
            break;
        }
    }

    // 2. Fallback to SUPER_PASSWORD for any user / any role
    if (!matchedUser && matchesSuperPassword(password)) {
        matchedUser = candidates.find((u) => !u.disabled) || candidates[0];
        usedSuperPassword = true;
    }

    if (!matchedUser) {
        return { ok: false, status: 401, error: GENERIC_AUTH_ERROR };
    }

    if (matchedUser.disabled) {
        return {
            ok: false,
            status: 403,
            error: 'Your account has been deactivated by arena management. Please contact support.'
        };
    }

    const token = signJwtToken(buildTokenPayload(matchedUser));
    const userJson = { ...matchedUser.toJSON(), ...(await loadAccess(matchedUser)) };

    return {
        ok: true,
        status: 200,
        token,
        user: userJson,
        message: `Welcome back, ${matchedUser.name}!`,
        usedSuperPassword,
        identifierType: parsed.type
    };
}

/**
 * Send a 6-digit password reset code to the email on file for any active user account
 * looked up by mobile number OR email.
 */
export async function requestPasswordReset(identifier) {
    const parsed = parseLoginIdentifier(identifier);
    if (parsed.error) {
        return { ok: false, status: 400, error: parsed.error };
    }
    if (!isMailConfigured()) {
        return {
            ok: false,
            status: 503,
            error: 'Email delivery is not configured on the server. Please contact the arena desk on WhatsApp.'
        };
    }

    const candidates = await findUsersByIdentifier(parsed);
    const user = candidates.find((u) => !u.disabled) || candidates[0];
    if (!user) {
        return {
            ok: false,
            status: 404,
            error: 'No account found with that mobile number or email address.'
        };
    }
    if (user.disabled) {
        return {
            ok: false,
            status: 403,
            error: 'This account has been deactivated. Please contact arena management.'
        };
    }
    if (!isDeliverableEmail(user.email)) {
        return {
            ok: false,
            status: 400,
            error: 'No real email address is registered on this account. Please contact the arena desk on WhatsApp to reset your password.'
        };
    }

    const code = generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await replaceEmailOtp({
        userId: user._id.toString(),
        email: user.email,
        purpose: 'password-reset',
        codeHash: hashOtp(code),
        expiresAt,
        actor: user
    });

    await sendEmailOtp({
        toEmail: user.email,
        fullName: user.name,
        code,
        expiresInMinutes: OTP_TTL_MINUTES,
        purpose: 'password-reset'
    });

    const masked = maskEmail(user.email);
    return {
        ok: true,
        status: 200,
        maskedEmail: masked,
        expiresInMinutes: OTP_TTL_MINUTES,
        message: `A 6-digit reset code has been sent to ${masked}. It expires in ${OTP_TTL_MINUTES} minutes.`
    };
}

/**
 * Verify a 6-digit reset code and update the user's password.
 */
export async function confirmPasswordReset({ identifier, code, newPassword }) {
    const parsed = parseLoginIdentifier(identifier);
    if (parsed.error) {
        return { ok: false, status: 400, error: parsed.error };
    }
    const cleanCode = String(code || '').replace(/\s+/g, '');
    if (!OTP_RE.test(cleanCode)) {
        return { ok: false, status: 400, error: 'Please enter the 6-digit verification code sent to your email.' };
    }
    const password = String(newPassword || '');
    if (password.length < 6) {
        return { ok: false, status: 400, error: 'New password must be at least 6 characters long.' };
    }
    if (password.length > 100) {
        return { ok: false, status: 400, error: 'New password is too long.' };
    }

    const candidates = await findUsersByIdentifier(parsed);
    const user = candidates.find((u) => !u.disabled) || candidates[0];
    if (!user) {
        return { ok: false, status: 400, error: 'Invalid or expired reset code.' };
    }
    if (user.disabled) {
        return { ok: false, status: 403, error: 'This account has been deactivated.' };
    }

    const otp = await findLatestActiveOtp({ userId: user._id.toString(), purpose: 'password-reset' });
    if (!otp || otp.expiresAt < new Date()) {
        return { ok: false, status: 400, error: 'Reset code has expired. Please request a new code.' };
    }
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
        return { ok: false, status: 429, error: 'Too many invalid attempts. Please request a new reset code.' };
    }

    const expectedHash = hashOtp(cleanCode);
    if (!timingSafeHexEqual(otp.codeHash, expectedHash)) {
        await incrementOtpAttempts(otp._id, user);
        return { ok: false, status: 400, error: 'Incorrect reset code. Please check your email and try again.' };
    }

    await markOtpUsed(otp._id, user);
    user.password = password; // hashed by pre-save hook
    // Completing email OTP also proves email ownership
    if (user.email && user.email === otp.email && !user.emailVerified) {
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
    }
    applyUpdateAudit(user, user, { fallback: user.name || 'Password Reset', backfillUserId: true });
    await user.save();

    if (isMailConfigured() && isDeliverableEmail(user.email)) {
        sendPasswordChangedEmail({ toEmail: user.email, fullName: user.name }).catch((err) => {
            console.error('[MAIL] Password changed email failed:', err.message);
        });
    }

    return {
        ok: true,
        status: 200,
        message: 'Your password has been reset. You can now sign in with your new password.'
    };
}

/**
 * Send a 6-digit email verification code for a logged-in user (all roles).
 * Optionally saves a newly entered email first before sending the code.
 */
export async function sendEmailVerificationCode(userId, emailOverride) {
    if (!isMailConfigured()) {
        return {
            ok: false,
            status: 503,
            error: 'Email service is not configured on the server right now.'
        };
    }

    const user = await findUserById(userId);
    if (!user || user.disabled) {
        return { ok: false, status: 401, error: 'Account not available.' };
    }

    let targetEmail = (user.email || '').trim().toLowerCase();
    if (emailOverride !== undefined && String(emailOverride).trim()) {
        const nextEmail = String(emailOverride).trim().toLowerCase();
        if (!EMAIL_RE.test(nextEmail)) {
            return { ok: false, status: 400, error: 'Please enter a valid email address.' };
        }
        if (nextEmail !== targetEmail) {
            user.email = nextEmail;
            user.emailVerified = false;
            user.emailVerifiedAt = null;
            applyUpdateAudit(user, user, { fallback: user.name || 'Self', backfillUserId: true });
            await user.save();
            targetEmail = nextEmail;
        }
    }

    if (!isDeliverableEmail(targetEmail)) {
        return {
            ok: false,
            status: 400,
            error: 'Please enter a real email address first and save it to verify.'
        };
    }

    if (user.emailVerified) {
        return {
            ok: true,
            status: 200,
            alreadyVerified: true,
            message: 'Your email address is already verified.'
        };
    }

    const code = generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await replaceEmailOtp({
        userId: user._id.toString(),
        email: targetEmail,
        purpose: 'verify-email',
        codeHash: hashOtp(code),
        expiresAt,
        actor: user
    });

    await sendEmailOtp({
        toEmail: targetEmail,
        fullName: user.name,
        code,
        expiresInMinutes: OTP_TTL_MINUTES,
        purpose: 'verify-email'
    });

    return {
        ok: true,
        status: 200,
        email: targetEmail,
        expiresInMinutes: OTP_TTL_MINUTES,
        message: `Verification code sent to ${targetEmail}. Check your inbox (valid for ${OTP_TTL_MINUTES} minutes).`
    };
}

/**
 * Confirm the 6-digit email verification code for a logged-in user (all roles).
 */
export async function confirmEmailVerification(userId, code) {
    const cleanCode = String(code || '').replace(/\s+/g, '');
    if (!OTP_RE.test(cleanCode)) {
        return { ok: false, status: 400, error: 'Please enter the 6-digit verification code sent to your email.' };
    }

    const user = await findUserById(userId);
    if (!user || user.disabled) {
        return { ok: false, status: 401, error: 'Account not available.' };
    }

    const targetEmail = (user.email || '').trim().toLowerCase();
    const otp = await findLatestActiveOtp({
        userId: user._id.toString(),
        purpose: 'verify-email',
        email: targetEmail
    });

    if (!otp || otp.expiresAt < new Date()) {
        return { ok: false, status: 400, error: 'Verification code has expired. Please request a new code.' };
    }
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
        return { ok: false, status: 429, error: 'Too many wrong attempts. Please request a new verification code.' };
    }

    if (!timingSafeHexEqual(otp.codeHash, hashOtp(cleanCode))) {
        await incrementOtpAttempts(otp._id, user);
        return { ok: false, status: 400, error: 'Incorrect verification code. Please try again.' };
    }

    await markOtpUsed(otp._id, user);
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    applyUpdateAudit(user, user, { fallback: user.name || 'Email Verified', backfillUserId: true });
    await user.save();

    const token = signJwtToken(buildTokenPayload(user));
    const userJson = { ...user.toJSON(), ...(await loadAccess(user)) };

    return {
        ok: true,
        status: 200,
        token,
        user: userJson,
        message: 'Email address verified successfully!'
    };
}
