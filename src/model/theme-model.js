import mongoose, { Schema } from "mongoose";

const ThemeSchema = new mongoose.Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    primary: { type: String, default: "#3b82f6" },
    secondary: { type: String, default: "#f59e0b" },
    background: { type: String, default: "#ffffff" },
    text: { type: String, default: "#1f2937" },
    muted: { type: String, default: "#6b7280" },
    accent: { type: String, default: "#10b981" },
    banner: { type: String, default: "#e2e8f0" },
    footer: { type: String, default: "#1e293b" },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

export const ThemeModel =
  mongoose.models.Theme ?? mongoose.model("Theme", ThemeSchema);
