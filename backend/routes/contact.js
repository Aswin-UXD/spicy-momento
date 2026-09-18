import express from "express";
import ContactMessage from "../models/ContactMessage.js";

const router = express.Router();

// ── POST /api/contact ───────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    const newMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject?.trim() || "General Inquiry",
      message: message.trim(),
      type: "contact",
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! We received your message and will respond promptly. 🌶",
      inquiry: newMessage,
    });
  } catch (err) {
    console.error("[Contact API] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to submit message" });
  }
});

// ── POST /api/contact/catering (or /api/catering) ───────────────────────────
router.post("/catering", async (req, res) => {
  try {
    const { name, email, guestCount, eventDate, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const newCatering = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: `Catering Request for ${guestCount || "Group"} Guests`,
      message: message?.trim() || "Catering booking request",
      guestCount: Number(guestCount) || 25,
      eventDate: eventDate || "Upcoming Weekend",
      type: "catering",
    });

    return res.status(201).json({
      success: true,
      message: "Catering request received! Our food truck team will reach out within 24 hours. 🚚",
      inquiry: newCatering,
    });
  } catch (err) {
    console.error("[Catering API] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to submit catering request" });
  }
});

// ── GET /api/contact ────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(20);
    return res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    console.error("[Contact API] Fetch error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
});

// ── PATCH /api/contact/:id (Update message status) ──────────────────────────
router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const updated = await ContactMessage.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    return res.json({
      success: true,
      message: `Inquiry status updated to '${status}'`,
      inquiry: updated,
    });
  } catch (err) {
    console.error("[Contact API] Patch error:", err);
    return res.status(500).json({ success: false, message: "Failed to update inquiry status" });
  }
});

// ── DELETE /api/contact/:id (Delete message) ────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ContactMessage.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    return res.json({
      success: true,
      message: "Message deleted successfully!",
      inquiry: deleted,
    });
  } catch (err) {
    console.error("[Contact API] Delete error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete message" });
  }
});

export default router;
