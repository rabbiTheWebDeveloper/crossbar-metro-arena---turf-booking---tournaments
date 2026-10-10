import mongoose, { Schema } from "mongoose";

const domainSchema = new Schema(
  {
    domain_name: {
      required: true,
      type: String,
    },
    domain_status: {
      type: String,
      default: "pending",
      enum: ["pending", "connected", "failed", "disconnected", "rejected"],
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, versionKey: false }
);

export const DomainModel =
  mongoose.models.Domain ?? mongoose.model("Domain", domainSchema);
