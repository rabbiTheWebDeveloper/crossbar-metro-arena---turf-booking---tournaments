import mongoose, { Schema } from "mongoose";

const ShippingCostSchema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deliveryChargeInside: {
      type: Number,
      required: true,
      default: 0,
    },
    deliveryChargeOutside: {
      type: Number,
      required: true,
      default: 0,
    },
    deliveryChargeSubarea: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingStatus: {
      type: Boolean,
      default: true, // true = ON, false = OFF
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent model overwrite in dev
export const deliveryModel =
  mongoose.models.ShippingCost ??
  mongoose.model("ShippingCost", ShippingCostSchema);
