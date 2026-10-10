import mongoose, { Schema, Document, Model } from 'mongoose';
import { SlotPriceItem } from '../types';
import { SCHEDULE_SLOTS_DEFINITION, VENUE_INFO } from '../data/initialData';

export interface ISetting extends Document {
  // Business & Venue Settings
  businessName: string;
  tagline: string;
  phone: string;
  phoneFormatted: string;
  whatsappUrl: string;
  email: string;
  address: string;
  metroStation: string;
  metroDetails: string;
  googleMapsUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  website: string;
  openingHours: string;
  aboutText: string;

  // 24 Slot Pricing Matrix & Booking Rules
  slotPrices: SlotPriceItem[];
  morningSlotPrice: number;
  afternoonSlotPrice: number;
  eveningSlotPrice: number;
  weekendSurcharge: number;
  advanceAmount: number;       // Default 500
  holdMinutes: number;         // Default 10
  bookingWindowDays: number;   // Default 60
  cancellationHours: number;   // Default 24
  weekendDays: string[];       // ['Friday', 'Saturday']
  approveResultsFirst: boolean;

  createdAt: Date;
  updatedAt: Date;
}

interface SettingModelInterface extends Model<ISetting> {
  getOrCreateSettings(): Promise<ISetting>;
}

const SlotPriceSchema = new Schema<SlotPriceItem>(
  {
    slotNumber: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    displayTime: { type: String, required: true },
    period: { type: String, enum: ['morning', 'afternoon', 'evening'], required: true },
    weekdayPrice: { type: Number, required: true },
    weekendPrice: { type: Number, required: true }
  },
  { _id: false }
);

const SettingSchema = new Schema<ISetting>(
  {
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
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        (ret as any).id = ret._id.toString();
        return ret;
      }
    }
  }
);

/**
 * Singleton getter: ensures a default configuration document exists
 */
SettingSchema.statics.getOrCreateSettings = async function (): Promise<ISetting> {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({
      slotPrices: SCHEDULE_SLOTS_DEFINITION
    });
    console.log('✅ Initialized default Crossbar Metro Arena Setting document in MongoDB');
  }
  return doc;
};

export const Setting: SettingModelInterface =
  (mongoose.models.Setting as SettingModelInterface) ||
  mongoose.model<ISetting, SettingModelInterface>('Setting', SettingSchema);

export default Setting;
