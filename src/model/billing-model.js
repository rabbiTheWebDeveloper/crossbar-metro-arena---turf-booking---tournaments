import mongoose, { Schema } from "mongoose";

const BillingSchema = new Schema(
  {
    // Who this bill belongs to
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    // Invoice metadata
    invoiceNumber: { type: String, unique: true, required: true },
    invoiceTitle: { type: String, default: "Monthly Platform Fee" },

    // Billing period
    billingPeriodStart: { type: Date, required: true },
    billingPeriodEnd:   { type: Date, required: true },
    dueDate:            { type: Date, required: true },

    // Amounts (in BDT paisa to avoid floats, or just Number)
    amount:    { type: Number, required: true, default: 0 },
    currency:  { type: String, default: "BDT" },
    tax:       { type: Number, default: 0 },
    discount:  { type: Number, default: 0 },
    totalDue:  { type: Number, required: true },

    // Status
    status: {
      type: String,
      enum: ["unpaid", "paid", "overdue", "cancelled"],
      default: "unpaid",
      index: true,
    },

    // Payment info (filled when paid)
    paidAt:         { type: Date, default: null },
    paymentMethod:  { type: String, default: "" },
    transactionId:  { type: String, default: "" },

    // Plan info snapshot
    planName:  { type: String, default: "Basic" },
    planPrice: { type: Number, default: 0 },

    // Notes
    notes: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

// Auto-index for dashboard queries
BillingSchema.index({ userId: 1, status: 1 });
BillingSchema.index({ shopId: 1, createdAt: -1 });

export const BillingModel =
  mongoose.models.Billing ?? mongoose.model("Billing", BillingSchema);
