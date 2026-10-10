import mongoose, { Schema } from "mongoose";

const SeoMarketingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },

    // Google Tag Manager
    gtmId: { type: String, default: "" },
    gtmAnalytics: { type: String, default: "" },

    // Facebook Pixel
    facebookPixelId: { type: String, default: "" },
    facebookPixelToken: { type: String, default: "" },
    facebookTestEventId: { type: String, default: "" },

    // TikTok Pixel
    tikTokPixelId: { type: String, default: "" },
    tikTokPixelToken: { type: String, default: "" },
    tikTokTestEventCode: { type: String, default: "" },

    // // Optional logs
    // lastUpdatedBy: {
    //   type: Schema.Types.ObjectId,
    //   ref: "User",
    // },
    // logs: [
    //   {
    //     updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    //     updatedAt: { type: Date, default: Date.now },
    //   },
    // ],
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// Optional: prevent model overwrite error in Next.js
export const SeoMarketingModel =
  mongoose.models.SeoMarketing ??
  mongoose.model("SeoMarketing", SeoMarketingSchema);
