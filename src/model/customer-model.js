import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerAddress: {
      type: String,
      required: true,
    },
    visitorId: {
      type: String,
      required: false,
    },
    customerNote: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false }
);

export const CustomerModel =
  mongoose.models.Customer ?? mongoose.model("Customer", customerSchema);
