import mongoose, { Schema } from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    slug: {
      type: String,
      unique: true,
    },
    image: {
      type: String,
      default: "",
    },
    imageFileId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  }
);
categorySchema.index({ shopId: 1, userId: 1 }); // for filtering
categorySchema.index({ createdAt: -1 }); // for sorting
const Category =
  mongoose.models.Category ?? mongoose.model("Category", categorySchema);
export default Category;
