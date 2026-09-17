import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    hours: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      default: 40.7128,
    },
    lng: {
      type: Number,
      default: -74.006,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Location = mongoose.model("Location", locationSchema);

export default Location;
