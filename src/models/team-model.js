import mongoose, { Schema } from 'mongoose';

const PlayerItemSchema = new Schema({
    id: { type: String, default: () => `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` },
    name: { type: String, required: true },
    number: { type: Number, default: 10 },
    position: { type: String, enum: ['GK', 'DEF', 'MID', 'FWD'], default: 'MID' },
    role: { type: String, default: 'Player' },
    phone: { type: String, default: '' },
    goals: { type: Number, default: 0 },
    matchesPlayed: { type: Number, default: 0 }
}, { _id: false });

const TeamSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        unique: true,
        trim: true,
        index: true
    },
    shortCode: {
        type: String,
        trim: true,
        uppercase: true,
        default: ''
    },
    captainName: {
        type: String,
        required: true,
        trim: true
    },
    captainPhone: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    homeColor: {
        type: String,
        default: '#4cbf02'
    },
    area: {
        type: String,
        default: 'Uttara, Dhaka'
    },
    badgeUrl: {
        type: String,
        default: ''
    },
    stats: {
        played: { type: Number, default: 0 },
        won: { type: Number, default: 0 },
        drawn: { type: Number, default: 0 },
        lost: { type: Number, default: 0 },
        gf: { type: Number, default: 0 },
        ga: { type: Number, default: 0 },
        points: { type: Number, default: 0 },
        form: { type: [String], default: [] }
    },
    players: {
        type: [PlayerItemSchema],
        default: []
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

export const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
export default Team;
