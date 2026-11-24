import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/user-model';
import { EmailOtp } from '@/models/email-otp-model';

/**
 * Find user account by MongoDB ObjectId.
 */
export async function findUserById(id) {
    if (!id) return null;
    await connectToDatabase();
    return User.findById(id);
}

/**
 * Find user account(s) by normalized Bangladeshi mobile number.
 * Returns an array of Mongoose User documents (0 or 1).
 */
export async function findUsersByPhone(cleanPhone) {
    if (!cleanPhone) return [];
    await connectToDatabase();
    const user = await User.findOne({ phone: cleanPhone });
    return user ? [user] : [];
}

/**
 * Find user account(s) by normalized lowercase email address.
 * Returns an array of Mongoose User documents.
 */
export async function findUsersByEmail(normalizedEmail) {
    if (!normalizedEmail) return [];
    await connectToDatabase();
    return User.find({ email: normalizedEmail }).limit(5);
}

/**
 * Find user account(s) from a parsed login identifier ({ type: 'phone' | 'email', value }).
 */
export async function findUsersByIdentifier(parsed) {
    if (!parsed?.type || !parsed?.value) return [];
    if (parsed.type === 'email') {
        return findUsersByEmail(parsed.value);
    }
    return findUsersByPhone(parsed.value);
}

/**
 * Replace any previous unused OTP for the same user + purpose and store a fresh hashed OTP.
 */
export async function replaceEmailOtp({ userId, email, purpose, codeHash, expiresAt }) {
    await connectToDatabase();
    await EmailOtp.deleteMany({ userId: String(userId), purpose, usedAt: null });
    return EmailOtp.create({
        userId: String(userId),
        email: String(email).trim().toLowerCase(),
        purpose,
        codeHash,
        attempts: 0,
        expiresAt
    });
}

/**
 * Retrieve the latest unused OTP for a user + purpose (optionally scoped to email).
 */
export async function findLatestActiveOtp({ userId, purpose, email }) {
    await connectToDatabase();
    const query = { userId: String(userId), purpose, usedAt: null };
    if (email) query.email = String(email).trim().toLowerCase();
    return EmailOtp.findOne(query).sort({ createdAt: -1 });
}

export async function incrementOtpAttempts(otpId) {
    await connectToDatabase();
    return EmailOtp.findByIdAndUpdate(otpId, { $inc: { attempts: 1 } }, { new: true });
}

export async function markOtpUsed(otpId) {
    await connectToDatabase();
    return EmailOtp.findByIdAndUpdate(otpId, { $set: { usedAt: new Date() } }, { new: true });
}
