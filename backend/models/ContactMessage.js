import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      default: "General Question",
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["contact", "catering"],
      default: "contact",
    },
    guestCount: {
      type: Number,
      default: 0,
    },
    eventDate: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "contacted"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

export default ContactMessage;
