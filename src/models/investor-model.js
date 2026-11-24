import mongoose, { Schema } from 'mongoose';

const InvestorSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Investor name is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    phone: {
        type: String,
        required: [true, 'Investor phone is required'],
        trim: true
    },
    sharePercentage: {
        type: Number,
        required: [true, 'Share percentage is required'],
        min: 0,
        max: 100
    },
    capitalInvested: {
        type: Number,
        default: 0
    },
    joinedDate: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    },
    payoutsPaid: {
        type: Number,
        default: 0
    },
    // Linked login account (User._id). Set by the admin so the investor portal shows the right partner.
    userId: { type: String, trim: true, default: '', index: true },
    // Where the partner wants dividends sent. Edited by the partner in /investor/settings
    // (PUT /api/investors/settings); never touched by the admin investor routes.
    payoutDetails: {
        method: { type: String, enum: ['', 'bank_transfer', 'bkash', 'nagad', 'rocket', 'cheque', 'cash'], default: '' },
        accountName: { type: String, trim: true, default: '' },
        accountNumber: { type: String, trim: true, default: '' },
        bankName: { type: String, trim: true, default: '' },
        branch: { type: String, trim: true, default: '' },
        note: { type: String, trim: true, default: '' },
        updatedAt: { type: Date, default: null }
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
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

export const Investor = mongoose.models.Investor || mongoose.model('Investor', InvestorSchema);
export default Investor;
