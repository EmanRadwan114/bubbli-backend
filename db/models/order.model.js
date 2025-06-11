import { Schema, model, Types } from "mongoose";

const orderSchema = new Schema(
  {
    userID: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    totalPriceBeforeDiscount: {
      type: Number,
      required: true,
    },

    totalPriceAfterDiscount: {
      type: Number,
      required: true,
    },

    // Final total price including shipping
    totalPrice: {
      type: Number,
      required: true,
    },

    couponCode: {
      type: String,
    },

    shippingPrice: {
      type: Number,
      default: 50,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function (v) {
          return /^01[0125][0-9]{8}$/.test(v);
        },
        message: "Phone must be a valid Egyptian number (e.g., 010xxxxxxxx)",
      },
    },

    orderItems: [
      {
        productId: {
          type: Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],

    shippingAddress: {
      type: String,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "cash",
      required: true,
    },

    orderStatus: {
      type: String,
      enum: ["paid", "waiting", "cancelled"],
      default: "waiting",
    },

    shippingStatus: {
      type: String,
      enum: ["pending", "prepared", "shipped", "cancelled"],
      default: "pending",
    },
    transactionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Order = model("Order", orderSchema);
export default Order;
