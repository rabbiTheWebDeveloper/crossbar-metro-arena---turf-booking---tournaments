import mongoose, { Schema } from "mongoose";

const SliderSchema = new Schema(
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

// Prevent model overwrite in dev
export const SliderModel =
  mongoose.models.Slider ?? mongoose.model("Slider", SliderSchema);
