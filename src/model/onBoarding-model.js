import mongoose, { Schema } from "mongoose";

const onBoardingSchema = new Schema(
  {
    name: {
      type: String,
      required: true, // Name is required
      trim: true, // Removes extra spaces
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensures no duplicate emails
      match: /.+\@.+\..+/, // Basic email pattern validation
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10,15}$/, // Ensures the phone number is 10-15 digits
    },
    status: {
      type: String,
      default: "pending",
      // enum:['pending','approved','rejected' ,'cancelled' ,'completed' ,'followup']
    },
    paymentStatus: {
      type: String,
      default: "unpaid",
      enum: ["unpaid", "paid"],
    },
    note: {
      type: String,
    },
    followUpDate: {
      type: String,
      // default: null,
    },
    type: {
      type: String,
      default: "website",
    },
    ref :{
      type: String,
      default:""
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const OnBoardingModel =
  mongoose.models.onboarding ?? mongoose.model("onboarding", onBoardingSchema);
