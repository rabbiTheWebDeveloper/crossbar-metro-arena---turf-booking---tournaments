import mongoose, { Schema } from 'mongoose';
import {
    DEFAULT_CUSTOMER_SETTINGS, CONTACT_CHANNELS, REMINDER_HOURS, BOOKING_MATCH_TYPES, BOOKING_PAYMENT_CHOICES
} from '../lib/customerMeta.js';
import { AUDIT_SCHEMA_FIELDS } from '../lib/audit.js';

const D = DEFAULT_CUSTOMER_SETTINGS;

/**
 * A customer's own preferences, edited from the customer panel (one document per customer).
 *  - notifications / preferredChannel: what the arena should message them about and how (the desk sees this too)
 *  - bookingDefaults: pre-filled into the booking form
 * The venue-wide configuration (prices, rules, contact details) stays in models/setting-model.js.
 */
const CustomerSettingSchema = new Schema({
    customerId: { type: String, required: true, unique: true, trim: true },
    preferredChannel: { type: String, enum: CONTACT_CHANNELS, default: D.preferredChannel },
    notifications: {
        bookingConfirmations: { type: Boolean, default: D.notifications.bookingConfirmations },
        bookingReminders: { type: Boolean, default: D.notifications.bookingReminders },
        reminderHoursBefore: { type: Number, enum: REMINDER_HOURS, default: D.notifications.reminderHoursBefore },
        matchResults: { type: Boolean, default: D.notifications.matchResults },
        tournamentUpdates: { type: Boolean, default: D.notifications.tournamentUpdates },
        offers: { type: Boolean, default: D.notifications.offers }
    },
    bookingDefaults: {
        teamName: { type: String, trim: true, maxlength: 60, default: D.bookingDefaults.teamName },
        matchType: { type: String, enum: BOOKING_MATCH_TYPES, default: D.bookingDefaults.matchType },
        paymentChoice: { type: String, enum: BOOKING_PAYMENT_CHOICES, default: D.bookingDefaults.paymentChoice }
    },
    ...AUDIT_SCHEMA_FIELDS
}, {
    timestamps: true,
    minimize: false,
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        }
    }
});

/** The stored settings of a customer, or the defaults (not saved) when they have never changed anything. */
CustomerSettingSchema.statics.forCustomer = async function (customerId) {
    const doc = await this.findOne({ customerId: String(customerId) });
    return doc ? doc.toJSON() : { customerId: String(customerId), ...JSON.parse(JSON.stringify(D)) };
};

export const CustomerSetting = mongoose.models.CustomerSetting || mongoose.model('CustomerSetting', CustomerSettingSchema);
export default CustomerSetting;
