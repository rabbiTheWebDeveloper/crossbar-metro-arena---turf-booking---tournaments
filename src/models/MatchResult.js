import mongoose, { Schema } from 'mongoose';

const MatchScorerSchema = new Schema({
    playerName: { type: String, required: true },
    teamName: { type: String, required: true },
    minute: { type: Number, required: true }
}, { _id: false });

const MatchResultSchema = new Schema({
    date: {
        type: String,
        required: true,
        index: true
    },
    slotDisplay: {
        type: String,
        required: true
    },
    courtName: {
        type: String,
        default: 'Crossbar Metro Arena (Main Turf)'
    },
    homeTeam: {
        type: String,
        required: true,
        trim: true
    },
    awayTeam: {
        type: String,
        required: true,
        trim: true
    },
    homeScore: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    awayScore: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    scorers: {
        type: [MatchScorerSchema],
        default: []
    },
    yellowCards: {
        type: Number,
        default: 0
    },
    redCards: {
        type: Number,
        default: 0
    },
    playerOfTheMatch: {
        type: String,
        trim: true,
        default: ''
    },
    matchReport: {
        type: String,
        trim: true,
        default: ''
    },
    teamPhoto: {
        type: String,
        default: ''
    },
    matchType: {
        type: String,
        default: '7v7 Friendly'
    },
    postedBy: {
        type: String,
        default: 'Admin'
    },
    postedAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    status: {
        type: String,
        enum: ['pending_approval', 'published', 'rejected'],
        default: 'published',
        index: true
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

export const MatchResult = mongoose.models.MatchResult || mongoose.model('MatchResult', MatchResultSchema);
export default MatchResult;
