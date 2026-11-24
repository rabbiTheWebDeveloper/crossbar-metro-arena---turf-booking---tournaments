import mongoose, { Schema } from 'mongoose';

const PayoutSchema = new Schema({
    investorId: {
        type: String,
        required: [true, 'Investor ID is required'],
        index: true
    },
    investorName: {
        type: String,
        required: [true, 'Investor name is required'],
        trim: true
    },
    month: {
        type: String,
        required: [true, 'Payout month is required'], // YYYY-MM
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Payout amount is required'],
        min: 0
    },
    datePaid: {
        type: String,
        required: true,
        default: () => new Date().toISOString().split('T')[0]
    },
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'bkash', 'nagad', 'rocket', 'cheque', 'cash'],
        default: 'bank_transfer'
    },
    transactionNote: {
        type: String,
        trim: true,
        default: ''
    },
    recordedBy: {
        type: String,
        trim: true,
        default: 'Admin'
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

PayoutSchema.index({ month: 1, investorId: 1 });

export const Payout = mongoose.models.Payout || mongoose.model('Payout', PayoutSchema);
export default Payout;
