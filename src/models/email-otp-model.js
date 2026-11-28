import mongoose, { Schema } from 'mongoose';
import { AUDIT_ONLY_FIELDS } from '../lib/audit.js';

const EmailOtpSchema = new Schema({
    userId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    purpose: {
        type: String,
        enum: ['verify-email', 'password-reset'],
        required: true,
        index: true
    },
    codeHash: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        required: true
    },
    usedAt: {
        type: Date,
        default: null
    },
    ...AUDIT_ONLY_FIELDS
}, {
    timestamps: true
});

// Automatically purge expired OTP documents
EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
EmailOtpSchema.index({ userId: 1, purpose: 1, createdAt: -1 });

export const EmailOtp = mongoose.models.EmailOtp || mongoose.model('EmailOtp', EmailOtpSchema);
export default EmailOtp;
