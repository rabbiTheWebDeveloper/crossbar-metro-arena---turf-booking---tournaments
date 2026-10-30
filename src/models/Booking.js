import mongoose, { Schema } from 'mongoose';
const BookingAddOnSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    iconName: { type: String }
}, { _id: false });

export const BOOKING_ACTIVE_STATUSES = ['pending_payment', 'confirmed_unpaid', 'paid_advance', 'paid_full', 'needs_refund'];

const BookingSchema = new Schema({
    bookingCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    courtId: { type: String, default: 'main-turf' },
    courtName: { type: String, default: 'Crossbar Metro Arena (Main Turf)' },
    date: { type: String, required: true, index: true }, // e.g. "2026-10-10"
    slotNumber: { type: Number, required: true, min: 1, max: 12 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    displayTime: { type: String, required: true },
    captainName: { type: String, required: true, trim: true },
    captainPhone: { type: String, required: true, trim: true, index: true },
    // Account that made the booking (when logged in). Used for "my bookings" and ownership checks.
    userId: { type: String, trim: true, index: true },
    teamName: { type: String, required: true, trim: true },
    playerCount: { type: Number, default: 14 },
    matchType: {
        type: String,
        enum: ['friendly', 'competitive', 'practice', 'corporate'],
        default: 'friendly'
    },
    addOns: { type: [BookingAddOnSchema], default: [] },
    courtPrice: { type: Number, required: true },
    addOnsPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    paymentType: {
        type: String,
        enum: ['advance_500', 'full_payment', 'pay_at_turf'],
        default: 'advance_500'
    },
    advanceAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: {
        type: String,
        enum: ['pay_at_turf', 'bkash', 'nagad', 'rocket', 'upay', 'card', 'cash'],
        default: 'bkash'
    },
    paymentStatus: {
        type: String,
        // pending_payment = slot held while the customer is on the payment gateway
        enum: ['pending_payment', 'confirmed_unpaid', 'paid_advance', 'paid_full', 'needs_refund', 'cancelled'],
        default: 'paid_advance',
        index: true
    },
    transactionId: { type: String, trim: true, index: true },
    gatewayTranId: { type: String, trim: true, index: true },
    gatewayValId: { type: String, trim: true },
    gatewayCardType: { type: String, trim: true },
    expectedAmount: { type: Number }, // amount the gateway must report for this booking
    paidAt: { type: Date },
    holdExpiresAt: { type: Number },
    isWalkIn: { type: Boolean, default: false },
    played: { type: Boolean, default: false },
    // Recurring / bulk bookings created from the admin panel (weekly fixed slots)
    isRecurring: { type: Boolean, default: false },
    seriesId: { type: String, trim: true, index: true },
    seriesLabel: { type: String, trim: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, trim: true },
    notes: { type: String, trim: true }
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

/**
 * STRICT DATABASE UNIQUE CONSTRAINT
 * No double booking: one active booking (including a live payment hold) per date + slot.
 * Partial indexes cannot use $ne, so the active statuses are listed with $in.
 */
BookingSchema.index({ date: 1, slotNumber: 1 }, {
    unique: true,
    partialFilterExpression: { paymentStatus: { $in: BOOKING_ACTIVE_STATUSES } }
});
BookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export default Booking;
