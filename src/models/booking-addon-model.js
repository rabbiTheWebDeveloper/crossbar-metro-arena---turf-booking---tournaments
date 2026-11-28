import mongoose, { Schema } from 'mongoose';
import { BOOKING_ADDONS } from '../data/initialData.js';
import { AUDIT_SCHEMA_FIELDS } from '../lib/audit.js';
import { Setting } from './setting-model.js';

const BookingAddOnModelSchema = new Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Add-on name is required'],
        trim: true,
        maxlength: [100, 'Add-on name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        default: '',
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    price: {
        type: Number,
        required: [true, 'Add-on price is required'],
        min: [0, 'Price cannot be negative'],
        max: [100000, 'Price cannot exceed 100,000']
    },
    iconName: {
        type: String,
        trim: true,
        default: ''
    },
    enabled: {
        type: Boolean,
        default: true,
        index: true
    },
    sortOrder: {
        type: Number,
        default: 0,
        index: true
    },
    ...AUDIT_SCHEMA_FIELDS
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

function toSlug(raw, fallback = 'addon') {
    const clean = String(raw || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
    return clean || fallback;
}

/**
 * Seeds the default 4 turf equipment add-ons once on initial setup.
 * If Super Admin later deletes every add-on, the empty state is respected until "Restore Defaults" is clicked.
 */
BookingAddOnModelSchema.statics.ensureSeeded = async function () {
    const settings = await Setting.getOrCreateSettings();
    if (settings.bookingAddOnsSeeded) {
        return;
    }

    const existingCount = await this.countDocuments();
    if (existingCount === 0) {
        const docs = BOOKING_ADDONS.map((item, idx) => ({
            slug: toSlug(item.id || item.name, `addon-${idx + 1}`),
            name: item.name,
            description: item.description || '',
            price: Number(item.price) || 0,
            iconName: item.iconName || '',
            enabled: item.enabled !== false,
            sortOrder: idx + 1,
            createdBy: 'System',
            updatedBy: 'System'
        }));
        await this.insertMany(docs, { ordered: false }).catch(() => { /* ignore duplicate race */ });
    }

    settings.bookingAddOnsSeeded = true;
    await settings.save();
};

BookingAddOnModelSchema.statics.buildUniqueSlug = async function (name, excludeId = null) {
    const base = toSlug(name, 'addon');
    let candidate = base;
    let suffix = 1;
    while (true) {
        const query = excludeId
            ? { slug: candidate, _id: { $ne: excludeId } }
            : { slug: candidate };
        const clash = await this.exists(query);
        if (!clash) return candidate;
        suffix += 1;
        candidate = `${base.slice(0, 34)}-${suffix}`;
    }
};

export const BookingAddOn = mongoose.models.BookingAddOn || mongoose.model('BookingAddOn', BookingAddOnModelSchema);
export default BookingAddOn;
