const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema(
  {
    amount_usd: { type: String, required: true },
    amount_crypto: { type: String, required: true },
    method: { type: String, required: true },
    telegramId: { type: String, required: true },
    userId: { type: String, required: true },
    status: { type: String, default: "pending" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const DepositeModel =
  mongoose.models.deposites ?? mongoose.model("deposites", CardSchema);
