import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

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
            values: ['visitor', 'player', 'admin', 'investor'],
            message: '{VALUE} is not a valid user role'
        },
        default: 'player'
    },
    playingPosition: {
        type: String,
        enum: ['GK', 'DEF', 'MID', 'FWD'],
        default: 'MID'
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    teamId: {
        type: String,
        trim: true
    },
    disabled: {
        type: Boolean,
        default: false
    }
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

// Hash password before saving
UserSchema.pre('save', async function () {
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
