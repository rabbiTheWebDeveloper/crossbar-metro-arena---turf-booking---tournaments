import mongoose, { Schema } from 'mongoose';

const OtherIncomeSchema = new Schema({
    source: {
        type: String,
        enum: ['shop_sales', 'event_fees', 'sponsorship', 'other'],
        default: 'other',
        index: true
    },
    title: {
        type: String,
        required: [true, 'Income title is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Income amount is required'],
        min: 0
    },
    date: {
        type: String,
        required: true,
        index: true
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    },
    recordedBy: {
        type: String,
        trim: true,
        default: 'Staff'
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

export const OtherIncome = mongoose.models.OtherIncome || mongoose.model('OtherIncome', OtherIncomeSchema);
export default OtherIncome;
