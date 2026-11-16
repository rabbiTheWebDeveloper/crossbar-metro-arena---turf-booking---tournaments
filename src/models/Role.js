import mongoose, { Schema } from 'mongoose';
import { PERMISSION_KEYS } from '../lib/permissions.js';

/**
 * A staff role: a named set of admin-portal permissions (see lib/permissions.js).
 * Users with role "staff" point at one of these through User.staffRoleId.
 */
const RoleSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Role name is required'],
        trim: true,
        maxlength: [40, 'Role name cannot exceed 40 characters']
    },
    // Lower-cased name, used to keep role names unique regardless of capitalisation
    nameKey: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true, default: '', maxlength: [200, 'Description cannot exceed 200 characters'] },
    permissions: {
        type: [String],
        default: [],
        validate: {
            validator: (list) => list.every(k => PERMISSION_KEYS.includes(k)),
            message: 'Unknown permission.'
        }
    }
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id.toString();
            delete ret.nameKey;
            return ret;
        }
    }
});

export const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
export default Role;
