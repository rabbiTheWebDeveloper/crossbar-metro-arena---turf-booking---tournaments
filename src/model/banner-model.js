import mongoose, { Schema } from "mongoose";

const bannerSchema = new Schema(
  {
    url: {
      type: String,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    images: [
      {
        url: String,
        filename: String,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const BannerModel =
  mongoose.models.Banner ?? mongoose.model("Banner", bannerSchema);
