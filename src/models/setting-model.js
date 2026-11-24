import mongoose, { Schema } from 'mongoose';
import { SCHEDULE_SLOTS_DEFINITION, SLOT_SCHEDULE_VERSION, VENUE_INFO } from '../data/initialData.js';
const SlotPriceSchema = new Schema({
    slotNumber: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    displayTime: { type: String, required: true },
    period: { type: String, enum: ['morning', 'afternoon', 'evening'], required: true },
    // What the customer pays (the "offer price")
    weekdayPrice: { type: Number, required: true },
    weekendPrice: { type: Number, required: true },
    // Regular ("actual") price, shown struck through while it is higher than the price above. 0 = no offer.
    weekdayActualPrice: { type: Number, default: 0 },
    weekendActualPrice: { type: Number, default: 0 }
}, { _id: false });
const SettingSchema = new Schema({
    businessName: { type: String, default: VENUE_INFO.businessName },
    tagline: { type: String, default: VENUE_INFO.tagline },
    phone: { type: String, default: VENUE_INFO.phone },
    phoneFormatted: { type: String, default: VENUE_INFO.phoneFormatted },
    whatsappUrl: { type: String, default: VENUE_INFO.whatsappUrl },
    email: { type: String, default: VENUE_INFO.email },
    address: { type: String, default: VENUE_INFO.address },
    metroStation: { type: String, default: VENUE_INFO.metroStation },
    metroDetails: { type: String, default: VENUE_INFO.metroDetails },
    googleMapsUrl: { type: String, default: VENUE_INFO.googleMapsUrl },
    facebookUrl: { type: String, default: VENUE_INFO.facebookUrl },
    instagramUrl: { type: String, default: VENUE_INFO.instagramUrl },
    website: { type: String, default: 'bookcrossbar.com' },
    openingHours: { type: String, default: VENUE_INFO.openingHours },
    aboutText: { type: String, default: VENUE_INFO.aboutText },
    // Pricing & Rules
    slotPrices: {
        type: [SlotPriceSchema],
        default: SCHEDULE_SLOTS_DEFINITION
    },
    // Which built-in slot schedule this document was last brought in line with (see getOrCreateSettings)
    slotScheduleVersion: { type: Number, default: 1 },
    morningSlotPrice: { type: Number, default: 2200 },
    afternoonSlotPrice: { type: Number, default: 2600 },
    eveningSlotPrice: { type: Number, default: 3500 },
    weekendSurcharge: { type: Number, default: 500 },
    advanceAmount: { type: Number, default: 500 },
    holdMinutes: { type: Number, default: 10 },
    bookingWindowDays: { type: Number, default: 60 },
    cancellationHours: { type: Number, default: 24 },
    weekendDays: { type: [String], default: ['Friday', 'Saturday'] },
    approveResultsFirst: { type: Boolean, default: false }
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id.toString();
            return ret;
        }
    }
});
/**
 * Singleton getter: ensures a default configuration document exists
 */
SettingSchema.statics.getOrCreateSettings = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({
            slotPrices: SCHEDULE_SLOTS_DEFINITION,
            slotScheduleVersion: SLOT_SCHEDULE_VERSION
        });
        console.log('✅ Initialized default Crossbar Metro Arena Setting document in MongoDB');
        return doc;
    }
    // One-time upgrade: when the built-in schedule changes (new kick-off times / price list), the stored
    // slots are replaced with it once. Prices edited by the admin afterwards are kept as usual.
    if ((Number(doc.slotScheduleVersion) || 1) < SLOT_SCHEDULE_VERSION) {
        const previousVersion = Number(doc.slotScheduleVersion) || 1;
        doc.slotPrices = SCHEDULE_SLOTS_DEFINITION;
        // Only replace the opening hours when they still read as the previous default
        if (!doc.openingHours || /^6:00 AM\s*[–-]\s*12:00 AM/i.test(doc.openingHours)) doc.openingHours = VENUE_INFO.openingHours;
        doc.slotScheduleVersion = SLOT_SCHEDULE_VERSION;
        await doc.save();
        console.log(`✅ Slot schedule upgraded from v${previousVersion} to v${SLOT_SCHEDULE_VERSION} (new kick-off times and launch-offer prices)`);
    }
    return doc;
};
export const Setting = mongoose.models.Setting ||
    mongoose.model('Setting', SettingSchema);
export default Setting;
