import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    phone: {
      type: String,
      default: "+1 (555) 234-5678",
    },
    address: {
      type: String,
      default: "123 Spice Street, Apt 4B, Foodie City",
    },
    memberTier: {
      type: String,
      default: "🌶 Spice Club VIP",
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    favorites: {
      type: [Number],
      default: [1, 2, 4],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
