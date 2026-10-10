import mongoose, { Schema, Document, Model } from 'mongoose';
import { BookingAddOn } from '../types';

export interface IBooking extends Document {
  bookingCode: string;
  courtId: string;
  courtName: string;
  date: string; // YYYY-MM-DD
  slotNumber: number; // 1 to 12
  startTime: string;
  endTime: string;
  displayTime: string;
  captainName: string;
  captainPhone: string;
  teamName: string;
  playerCount: number;
  matchType: 'friendly' | 'competitive' | 'practice' | 'corporate';
  addOns: BookingAddOn[];
  courtPrice: number;
  addOnsPrice: number;
  totalPrice: number;
  paymentType: 'advance_500' | 'full_payment' | 'pay_at_turf';
  advanceAmount: number;
  dueAmount: number;
  paymentMethod: 'pay_at_turf' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'card' | 'cash';
  paymentStatus: 'confirmed_unpaid' | 'paid_advance' | 'paid_full' | 'needs_refund' | 'cancelled';
  transactionId?: string;
  holdExpiresAt?: number;
  isWalkIn?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingAddOnSchema = new Schema<BookingAddOn>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    iconName: { type: String }
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    courtId: { type: String, default: 'main-turf' },
    courtName: { type: String, default: 'Crossbar Metro Arena (Main Turf)' },
    date: { type: String, required: true, index: true }, // e.g. "2026-10-10"
    slotNumber: { type: Number, required: true, min: 1, max: 12 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    displayTime: { type: String, required: true },
    captainName: { type: String, required: true, trim: true },
    captainPhone: { type: String, required: true, trim: true },
    teamName: { type: String, required: true, trim: true },
    playerCount: { type: Number, default: 14 },
    matchType: {
      type: String,
      enum: ['friendly', 'competitive', 'practice', 'corporate'],
      default: 'friendly'
    },
    addOns: { type: [BookingAddOnSchema], default: [] },
    courtPrice: { type: Number, required: true },
    addOnsPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    paymentType: {
      type: String,
      enum: ['advance_500', 'full_payment', 'pay_at_turf'],
      default: 'advance_500'
    },
    advanceAmount: { type: Number, default: 500 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ['pay_at_turf', 'bkash', 'nagad', 'rocket', 'upay', 'card', 'cash'],
      default: 'bkash'
    },
    paymentStatus: {
      type: String,
      enum: ['confirmed_unpaid', 'paid_advance', 'paid_full', 'needs_refund', 'cancelled'],
      default: 'paid_advance',
      index: true
    },
    transactionId: { type: String, trim: true },
    holdExpiresAt: { type: Number },
    isWalkIn: { type: Boolean, default: false },
    notes: { type: String, trim: true }
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
 * STRICT DATABASE UNIQUE CONSTRAINT
 * PRD Rule 1: "No double booking. A slot can have only one active booking.
 * This must be guaranteed by the database (a unique rule), not only by the screen."
 * We apply a partial unique index where paymentStatus is not cancelled.
 */
BookingSchema.index(
  { date: 1, slotNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { paymentStatus: { $ne: 'cancelled' } }
  }
);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
