import mongoose, { Schema } from 'mongoose';
import { CUSTOMER_SOURCES, POSITIONS } from '../lib/customerMeta.js';
import { AUDIT_ONLY_FIELDS } from '../lib/audit.js';

/**
 * Customer list: everyone the arena has dealt with, with or without a login account.
 * The mobile number is the identity (bookings, registrations and shop orders all carry it), so it is unique and
 * cannot be edited after creation. Login accounts live in models/user-model.js and are linked through `userId`.
 *
 * How people get here (see lib/customers.js): sign-up, online booking, counter booking, fixed slots, tournament
 * registration, shop orders, team captains, the "sync from all records" backfill, or added individually by staff.
 */
const CustomerSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        required: [true, 'Bangladeshi mobile number is required'],
        unique: true,
        trim: true,
        match: [/^01[3-9]\d{8}$/, 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344)']
    },
    email: { type: String, trim: true, lowercase: true, default: '' },
    playingPosition: { type: String, enum: ['', ...POSITIONS], default: '' },
    area: { type: String, trim: true, maxlength: [80, 'Area cannot exceed 80 characters'], default: '' },
    notes: { type: String, trim: true, maxlength: [1000, 'Notes cannot exceed 1000 characters'], default: '' },
    tags: { type: [String], default: [] },
    // The way they first came in, and every way they have come in since
    source: { type: String, enum: CUSTOMER_SOURCES, default: 'manual' },
    sources: { type: [String], default: [] },
    // Linked login account (models/user-model.js), '' when they have none
    userId: { type: String, trim: true, default: '', index: true },
    lastActivityAt: { type: Date, default: Date.now },
    ...AUDIT_ONLY_FIELDS
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

CustomerSchema.index({ createdAt: -1 });
CustomerSchema.index({ lastActivityAt: -1 });
CustomerSchema.index({ sources: 1 });

export const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
export default Customer;
