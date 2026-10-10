const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ["system", "order", "alert", "balance", "deposit"],
      default: "system",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true
  }
);

notificationSchema.index({ user: 1, isRead: 1 });

export const NotificationModel =
  mongoose.models.Notification ??
  mongoose.model("Notification", notificationSchema);
