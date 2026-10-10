import mongoose, { Schema } from "mongoose";

const ShopUserSchema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["Shop Owner", "Shop Manager", "Shop Staff"],
      default: "Shop Staff",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    permissions: {
      type: [String], // Example: ['manage_orders', 'view_reports', 'edit_products']
      default: [],
    },
  },
  {
    timestamps: true, // auto adds createdAt, updatedAt
  }
);

export const ShopUserModel =
  mongoose.models.ShopUser ?? mongoose.model("ShopUser", ShopUserSchema);
