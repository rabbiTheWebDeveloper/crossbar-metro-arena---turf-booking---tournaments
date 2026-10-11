import mongoose, { Schema } from 'mongoose';

const ProductSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['accessories', 'balls', 'apparel', 'footwear', 'drinks', 'equipment'],
        default: 'accessories',
        index: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    salePrice: {
        type: Number,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    sizes: {
        type: [String],
        default: []
    },
    badge: {
        type: String,
        trim: true,
        default: ''
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    specs: {
        type: [String],
        default: []
    },
    inStock: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    visible: {
        type: Boolean,
        default: true
    },
    image: {
        type: String,
        required: true
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

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export default Product;
