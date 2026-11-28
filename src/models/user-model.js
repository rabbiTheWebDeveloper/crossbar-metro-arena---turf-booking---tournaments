import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { AUDIT_SCHEMA_FIELDS } from '../lib/audit.js';

const UserSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        required: [true, 'Bangladeshi mobile number is required'],
        unique: true,
        trim: true,
        index: true,
        match: [/^01[3-9]\d{8}$/, 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344)']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: {
            values: ['visitor', 'player', 'admin', 'staff', 'investor'],
            message: '{VALUE} is not a valid user role'
        },
        default: 'player'
    },
    // For role "staff": the staff role (models/role-model.js) that decides what they can do in the admin portal
    staffRoleId: {
        type: String,
        trim: true,
        default: ''
    },
    playingPosition: {
        type: String,
        enum: ['GK', 'DEF', 'MID', 'FWD'],
        default: 'MID'
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        index: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerifiedAt: {
        type: Date,
        default: null
    },
    teamId: {
        type: String,
        trim: true
    },
    disabled: {
        type: Boolean,
        default: false
    },
    ...AUDIT_SCHEMA_FIELDS
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            delete ret.password;
            ret.id = ret._id.toString();
            return ret;
        }
    }
});

// Normalize phone number before validation
UserSchema.pre('validate', function () {
    if (this.phone) {
        let clean = this.phone.replace(/[^0-9]/g, '');
        if (clean.startsWith('8801')) {
            clean = clean.substring(2);
        }
        this.phone = clean;
    }
});

// Hash password & ensure self-audit defaults before saving
UserSchema.pre('save', async function () {
    if (this.isNew) {
        if (!this.userId && this._id) this.userId = String(this._id);
        if (!this.createdBy) this.createdBy = this.name ? `${this.name} (Self)` : 'System';
        if (!this.updatedBy) this.updatedBy = this.createdBy;
        if (!this.createdById && this._id) this.createdById = String(this._id);
        if (!this.updatedById && this._id) this.updatedById = this.createdById;
    }
    if (!this.isModified('password'))
        return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password || !candidatePassword) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Static helper to find by phone
UserSchema.statics.findByPhone = function (rawPhone) {
    if (!rawPhone) return null;
    let clean = rawPhone.replace(/[^0-9]/g, '');
    if (clean.startsWith('8801')) {
        clean = clean.substring(2);
    }
    return this.findOne({ phone: clean });
};

// Export model (prevent recompilation in hot reload)
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
