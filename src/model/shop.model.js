import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

// Function to generate 6 digit shopId
function generateShopId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const shopSchema = new Schema(
  {
    shopId: {
      type: String,
      unique: true,
      default: generateShopId,
      minlength: 6,
      maxlength: 6
    },
    shopName: { type: String, required: true, trim: true },
    shopSlug: { type: String, unique: true, index: true }, // Add slug field
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true ,  versionKey: false,   strict: true,}
);

// Pre-save hook to generate slug
shopSchema.pre("save", function () {
  if (this.isModified("shopName")) {
    this.shopSlug = slugify(this.shopName, { lower: true, strict: true });
  }
});

if (mongoose.models.Shop) {
  delete mongoose.models.Shop;
}
const Shop = mongoose.model("Shop", shopSchema);
export default Shop;
