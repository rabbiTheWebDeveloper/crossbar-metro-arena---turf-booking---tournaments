import mongoose, { Schema } from 'mongoose';

const RegisteredPlayerSchema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    number: { type: Number },
    position: { type: String, default: 'MID' }
}, { _id: false });

const TournamentRegistrationSchema = new Schema({
    tournamentId: {
        type: String,
        required: [true, 'Tournament ID is required'],
        index: true
    },
    tournamentTitle: {
        type: String,
        required: true,
        trim: true
    },
    teamName: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true
    },
    captainName: {
        type: String,
        required: [true, 'Captain name is required'],
        trim: true
    },
    captainPhone: {
        type: String,
        required: [true, 'Captain phone is required'],
        trim: true
    },
    playerCount: {
        type: Number,
        default: 10
    },
    players: {
        type: [RegisteredPlayerSchema],
        default: []
    },
    paymentMethod: {
        type: String,
        enum: ['bkash', 'nagad', 'bank', 'cash', 'pay_at_turf'],
        default: 'bkash'
    },
    transactionId: {
        type: String,
        trim: true,
        default: ''
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected'],
        default: 'pending',
        index: true
    },
    notes: {
        type: String,
        trim: true,
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

TournamentRegistrationSchema.index({ tournamentId: 1, teamName: 1 });

export const TournamentRegistration = mongoose.models.TournamentRegistration || mongoose.model('TournamentRegistration', TournamentRegistrationSchema);
export default TournamentRegistration;
