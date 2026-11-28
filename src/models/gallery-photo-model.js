import mongoose, { Schema } from 'mongoose';
import { AUDIT_SCHEMA_FIELDS } from '../lib/audit.js';

const GalleryPhotoSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Photo title is required'],
        trim: true
    },
    album: {
        type: String,
        default: 'Arena',
        trim: true,
        index: true
    },
    caption: {
        type: String,
        trim: true,
        default: ''
    },
    url: {
        type: String,
        required: [true, 'Photo URL is required'],
        trim: true
    },
    aspect: {
        type: String,
        enum: ['wide', 'square', 'portrait', 'tall'],
        default: 'wide'
    },
    featured: {
        type: Boolean,
        default: false
    },
    uploadedAt: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    },
    photographer: {
        type: String,
        trim: true,
        default: 'Crossbar Media Desk'
    },
    tags: {
        type: [String],
        default: []
    },
    ...AUDIT_SCHEMA_FIELDS
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id.toString();
            return ret;
        }
    }
});

export const GalleryPhoto = mongoose.models.GalleryPhoto || mongoose.model('GalleryPhoto', GalleryPhotoSchema);
export default GalleryPhoto;
