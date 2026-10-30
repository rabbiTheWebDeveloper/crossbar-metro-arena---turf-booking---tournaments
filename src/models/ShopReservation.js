import mongoose, { Schema } from 'mongoose';

const ShopItemSchema = new Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    size: { type: String, default: '' },
    image: { type: String, default: '' }
}, { _id: false });

const ShopReservationSchema = new Schema({
    reservationCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        unique: true,
        index: true
    },
    userId: { type: String, default: '', index: true },
    collectedAt: { type: Date },
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
    productName: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    size: {
        type: String,
        default: ''
    },
    items: {
        type: [ShopItemSchema],
        default: []
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['reserved_pickup', 'picked_up', 'collected', 'cancelled'],
        default: 'reserved_pickup',
        index: true
    },
    pickupDate: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id.toString();
            if (!ret.productName && ret.items && ret.items.length > 0) {
                ret.productName = ret.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
            }
            if (!ret.price && ret.totalAmount) {
                ret.price = ret.totalAmount;
            }
            return ret;
        }
    }
});

ShopReservationSchema.index({ createdAt: -1 });

export const ShopReservation = mongoose.models.ShopReservation || mongoose.model('ShopReservation', ShopReservationSchema);
export default ShopReservation;
