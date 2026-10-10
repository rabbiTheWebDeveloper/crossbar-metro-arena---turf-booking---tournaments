const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g. VISA
    category: { type: String, required: true }, // e.g. worldmix_valid 90%
    expiry: { type: String, required: true }, // e.g. 06/29
    level: { type: String },
    bin: { type: String },
    bank: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    zip: { type: String },
    seller: { type: String },
    price: { type: String, required: true },
    status: { type: String, default: "available" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const CardModel =
  mongoose.models.Card ?? mongoose.model("Card", CardSchema);
