import mongoose from 'mongoose';

const ChallengeSchema = new mongoose.Schema({
    teamName: { type: String, required: true },
    captainName: { type: String, required: true },
    captainPhone: { type: String, required: true },
    courtName: { type: String, default: 'Crossbar Metro Arena' },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    format: { type: String, default: '7 vs 7 Friendly Match' },
    level: { type: String, default: 'Casual' },
    lookingFor: { type: String, default: 'Opponent Team' },
    costShare: { type: String, default: '50/50 Split' },
    notes: { type: String, default: '' },
    userId: { type: String, default: '', index: true },
    matchedTeamName: { type: String, default: '' },
    matchedCaptainName: { type: String, default: '' },
    matchedPhone: { type: String, default: '' },
    status: { type: String, enum: ['open', 'matched', 'closed'], default: 'open' },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        }
    }
});

export const Challenge = mongoose.models.Challenge || mongoose.model('Challenge', ChallengeSchema);
