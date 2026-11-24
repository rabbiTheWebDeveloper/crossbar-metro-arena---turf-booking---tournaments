import mongoose, { Schema } from 'mongoose';

const PaymentSchema = new Schema({
    bookingId: { type: String, trim: true, index: true, default: '' },
    bookingCode: { type: String, trim: true, uppercase: true, index: true, default: '' },
    merchantTransactionId: { type: String, trim: true, unique: true, sparse: true, index: true },
    gatewayTransactionId: { type: String, trim: true, index: true, default: '' },
    gateway: {
        type: String,
        enum: ['eps', 'sslcommerz', 'counter'],
        default: 'eps',
        index: true
    },
    status: {
        type: String,
        enum: ['initiated', 'success', 'failed', 'cancelled', 'refunded'],
        default: 'initiated',
        index: true
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
    paymentMethod: { type: String, trim: true, default: 'eps' },
    financialEntity: { type: String, trim: true, default: '' },
    customerName: { type: String, trim: true, default: '' },
    customerPhone: { type: String, trim: true, index: true, default: '' },
    customerEmail: { type: String, trim: true, lowercase: true, default: '' },
    teamName: { type: String, trim: true, default: '' },
    slotDate: { type: String, trim: true, index: true, default: '' },
    slotNumber: { type: Number, default: 0 },
    slotDisplay: { type: String, trim: true, default: '' },
    sandbox: { type: Boolean, default: false },
    recordedBy: { type: String, trim: true, default: '' },
    verifiedAt: { type: Date, default: null },
    errorCode: { type: String, trim: true, default: '' },
    errorMessage: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' }
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

PaymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
export default Payment;
