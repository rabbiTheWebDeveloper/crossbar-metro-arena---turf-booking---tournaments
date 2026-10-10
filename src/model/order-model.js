import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
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

    productId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    variationId: [],

    quantity: [
      {
        type: Number,
        min: 1,
      },
    ],

    orderType: {
      type: String,
      enum: ["website", "landing", "manual"],
      default: "website",
    },

    deliveryLocation: {
      type: String,
      enum: ["cash", "insideDhaka", "outsideDhaka"],
      default: "cash",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    shipping_cost: Number,
    grand_total: Number,
    discounted_total: Number,
    discount: Number,
    advanced: Number,
    due: Number,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const OrderModel =
  mongoose.models.Orders ?? mongoose.model("Orders", orderSchema);
