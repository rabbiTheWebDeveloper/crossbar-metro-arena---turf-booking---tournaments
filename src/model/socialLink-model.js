import mongoose from "mongoose";
const { Schema } = mongoose;

const SocialLinkSchema = new Schema(
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

    facebook: {
      type: String,
      default: "",
    },
    instagram: {
      type: String,
      default: "",
    },
    twitter: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
    youtube: {
      type: String,
      default: "",
    },
    whatsapp: {
      type: String,
      default: "",
    },

    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    logs: [
      {
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

export const SocialLinkModel =
  mongoose.models.SocialLink ?? mongoose.model("SocialLink", SocialLinkSchema);
