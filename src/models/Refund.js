import mongoose, { Schema } from 'mongoose';

const RefundSchema = new Schema({
    bookingId: {
        type: String,
        default: ''
    },
    bookingCode: {
        type: String,
        required: [true, 'Booking code is required'],
        trim: true,
        index: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    reason: {
        type: String,
        default: 'player_cancelled'
    },
    refundMethod: {
        type: String,
        enum: ['bkash', 'nagad', 'rocket', 'bank', 'bank_transfer', 'card', 'cash'],
        default: 'bkash'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'completed', 'rejected'],
        default: 'pending',
        index: true
    },
    requestDate: {
        type: String,
        required: true,
        default: () => new Date().toISOString().split('T')[0]
    },
    refundedDate: {
        type: String,
        default: ''
    },
    transactionRef: {
        type: String,
        trim: true,
        default: ''
    },
    recordedBy: {
        type: String,
        trim: true,
        default: 'Admin Desk'
    }
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id.toString();
            return ret;
        }
    }
});

RefundSchema.index({ status: 1, requestDate: -1 });

export const Refund = mongoose.models.Refund || mongoose.model('Refund', RefundSchema);
export default Refund;
