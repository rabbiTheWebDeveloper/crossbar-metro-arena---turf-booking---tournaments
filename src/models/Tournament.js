import mongoose, { Schema } from 'mongoose';

const TournamentSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Tournament title is required'],
        trim: true
    },
    edition: {
        type: String,
        trim: true,
        default: 'Season Cup'
    },
    category: {
        type: String,
        trim: true,
        default: '7v7 Championship'
    },
    format: {
        type: String,
        trim: true,
        default: '7 vs 7 Knockouts'
    },
    dates: {
        type: String,
        required: true
    },
    registrationDeadline: {
        type: String,
        required: true
    },
    entryFee: {
        type: Number,
        required: true,
        min: 0
    },
    prizePool: {
        type: Number,
        required: true,
        min: 0
    },
    firstPrize: {
        type: String,
        default: ''
    },
    runnerUpPrize: {
        type: String,
        default: ''
    },
    maxTeams: {
        type: Number,
        required: true,
        default: 16
    },
    registeredCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: 'open',
        index: true
    },
    highlights: {
        type: [String],
        default: []
    },
    rules: {
        type: [String],
        default: []
    },
    bannerUrl: {
        type: String,
        default: ''
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

export const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
export default Tournament;
