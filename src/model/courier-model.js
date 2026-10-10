import mongoose, { Schema } from "mongoose";

const CourierSettingsSchema = new Schema(
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
    steadfast: {
      apiKey: { type: String, default: "" },
      secretKey: { type: String, default: "" },
      status: { type: Boolean, default: false },
    },
    redx: {
      token: { type: String, default: "" },
      status: { type: Boolean, default: false },
    },
    pathao: {
      clientId: { type: String, default: "" },
      clientSecret: { type: String, default: "" },
      username: { type: String, default: "" },
      password: { type: String, default: "" },
      storeId: { type: String, default: "" },
      status: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const CourierModel =
  mongoose.models.CourierSettings ??
  mongoose.model("CourierSettings", CourierSettingsSchema);
