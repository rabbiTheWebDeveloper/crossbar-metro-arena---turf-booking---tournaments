import crypto from 'crypto';
import mongoose, { Schema } from 'mongoose';

const InvoiceItemSchema = new Schema({
    description: {
        type: String,
        required: [true, 'Line item description is required'],
        trim: true,
        maxlength: 160
    },
    meta: {
        type: String,
        trim: true,
        default: '',
        maxlength: 120
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        max: 10000,
        default: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
        max: 100000000,
        default: 0
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    }
}, { _id: false });

const InvoiceSchema = new Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    category: {
        type: String,
        enum: ['booking', 'investor_payout', 'shop_order', 'tournament', 'sponsorship', 'custom'],
        default: 'custom',
        index: true
    },
    recipientRole: {
        type: String,
        enum: ['customer', 'investor', 'organization'],
        default: 'customer'
    },
    recipientName: {
        type: String,
        required: [true, 'Recipient name is required'],
        trim: true,
        maxlength: 100
    },
    recipientPhone: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    recipientEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    recipientSubtitle: {
        type: String,
        trim: true,
        default: '',
        maxlength: 140
    },
    userId: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    investorId: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    issueDate: {
        type: String,
        required: true,
        default: () => new Date().toISOString().slice(0, 10)
    },
    dueDate: {
        type: String,
        trim: true,
        default: ''
    },
    items: {
        type: [InvoiceItemSchema],
        validate: {
            validator: (arr) => Array.isArray(arr) && arr.length >= 1 && arr.length <= 30,
            message: 'Invoice must contain between 1 and 30 line items.'
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    discount: {
        type: Number,
        min: 0,
        default: 0
    },
    tax: {
        type: Number,
        min: 0,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    paidAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    dueAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    status: {
        type: String,
        enum: ['paid', 'partial', 'unpaid', 'disbursed', 'cancelled'],
        default: 'unpaid',
        index: true
    },
    paymentMethod: {
        type: String,
        trim: true,
        default: 'cash'
    },
    transactionRef: {
        type: String,
        trim: true,
        default: ''
    },
    notes: {
        type: String,
        trim: true,
        default: '',
        maxlength: 500
    },
    createdBy: {
        type: String,
        trim: true,
        default: 'Admin Desk'
    },
    updatedBy: {
        type: String,
        trim: true,
        default: ''
    },
    createdById: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    updatedById: {
        type: String,
        trim: true,
        default: '',
        index: true
    }
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

InvoiceSchema.index({ createdAt: -1 });

InvoiceSchema.statics.generateInvoiceNumber = function (prefix = 'CMA-INV') {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(5);
    let code = '';
    for (let i = 0; i < 5; i++) code += alphabet[bytes[i] % alphabet.length];
    return `${prefix}-${ym}-${code}`;
};

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
export default Invoice;
