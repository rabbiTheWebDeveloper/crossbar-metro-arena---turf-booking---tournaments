import mongoose, { Schema } from 'mongoose';
import { AUDIT_SCHEMA_FIELDS } from '../lib/audit.js';

export const SMS_LOG_CATEGORIES = [
    'manual',
    'bulk_campaign',
    'booking_confirmed',
    'payment_success',
    'pre_match_reminder',
    'bulk_booking_series',
    'test'
];

export const SMS_LOG_STATUSES = [
    'submitted',
    'scheduled',
    'completed',
    'partial',
    'failed'
];

const SmsLogSchema = new Schema({
    requestId: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    category: {
        type: String,
        enum: SMS_LOG_CATEGORIES,
        default: 'manual',
        index: true
    },
    // Normalized 11-digit Bangladeshi numbers ("01XXXXXXXXX")
    recipients: {
        type: [String],
        default: []
    },
    recipientCount: {
        type: Number,
        default: 1,
        min: 0
    },
    recipientSummary: {
        type: String,
        trim: true,
        default: ''
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    encoding: {
        type: String,
        enum: ['GSM-7', 'Unicode'],
        default: 'GSM-7'
    },
    partsPerRecipient: {
        type: Number,
        default: 1
    },
    totalSegments: {
        type: Number,
        default: 1
    },
    schedule: {
        type: String,
        trim: true,
        default: ''
    },
    senderId: {
        type: String,
        trim: true,
        default: ''
    },
    contentId: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: SMS_LOG_STATUSES,
        default: 'submitted',
        index: true
    },
    errorCode: {
        type: Number,
        default: 0
    },
    errorMessage: {
        type: String,
        trim: true,
        default: ''
    },
    charge: {
        type: String,
        trim: true,
        default: ''
    },
    gatewayStatus: {
        type: String,
        trim: true,
        default: ''
    },
    deliveryReport: {
        type: Schema.Types.Mixed,
        default: null
    },
    lastCheckedAt: {
        type: Date,
        default: null
    },
    bookingCode: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    sentBy: {
        type: String,
        trim: true,
        default: 'System'
    },
    ...AUDIT_SCHEMA_FIELDS
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        }
    }
});

SmsLogSchema.index({ createdAt: -1 });
SmsLogSchema.index({ category: 1, createdAt: -1 });

export const SmsLog = mongoose.models.SmsLog || mongoose.model('SmsLog', SmsLogSchema);
export default SmsLog;
