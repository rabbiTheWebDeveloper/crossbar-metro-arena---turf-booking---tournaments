import mongoose, { Schema } from 'mongoose';

const ExpenseSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Expense title is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Expense category is required'],
        trim: true,
        default: 'other'
    },
    amount: {
        type: Number,
        required: [true, 'Expense amount is required'],
        min: [0, 'Amount must be positive']
    },
    date: {
        type: String,
        required: [true, 'Expense date is required'], // YYYY-MM-DD
        index: true
    },
    receiptNote: {
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

ExpenseSchema.index({ date: -1 });

export const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
export default Expense;
