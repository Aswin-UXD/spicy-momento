import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      trim: true,
      lowercase: true,
    },
    items: {
      type: [orderItemSchema],
      required: [true, "Order must contain at least one item"],
      validate: [
        (val) => val && val.length > 0,
        "Order items cannot be empty",
      ],
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
      default: "confirmed",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "cod"],
      default: "card",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "failed"],
      default: "paid",
    },
    transactionId: {
      type: String,
      default: "",
    },
    deliveryAddress: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    specialNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
