import express from "express";
import Location from "../models/Location.js";

const router = express.Router();

// ── GET /api/locations ──────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { all } = req.query;
    const filter = all === "true" ? {} : { isActive: true };

    const locations = await Location.find(filter).sort({ id: 1 });
    return res.json({
      success: true,
      count: locations.length,
      locations,
    });
  } catch (err) {
    console.error("[Locations API] Fetch error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch locations" });
  }
});

// ── POST /api/locations (Create) ────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, address, hours, phone, lat, lng, isActive } = req.body;

    if (!name || !address || !hours) {
      return res.status(400).json({ success: false, message: "Name, address, and hours are required" });
    }

    const highest = await Location.findOne().sort({ id: -1 });
    const nextId = highest ? highest.id + 1 : 1;

    const newLoc = await Location.create({
      id: nextId,
      name: name.trim(),
      address: address.trim(),
      hours: hours.trim(),
      phone: phone?.trim() || "+1 (555) 774-2900",
      lat: Number(lat) || 40.7128,
      lng: Number(lng) || -74.006,
      isActive: isActive !== false,
    });

    return res.status(201).json({
      success: true,
      message: `Food truck location '${newLoc.name}' created successfully! 📍`,
      location: newLoc,
    });
  } catch (err) {
    console.error("[Locations API] Create error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to create location" });
  }
});

// ── PUT /api/locations/:id (Update) ─────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const numericId = parseInt(req.params.id, 10);
    const { name, address, hours, phone, lat, lng, isActive } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (address) updateFields.address = address.trim();
    if (hours) updateFields.hours = hours.trim();
    if (phone) updateFields.phone = phone.trim();
    if (lat !== undefined) updateFields.lat = Number(lat);
    if (lng !== undefined) updateFields.lng = Number(lng);
    if (isActive !== undefined) updateFields.isActive = isActive;

    const updated = await Location.findOneAndUpdate(
      { id: numericId },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }

    return res.json({
      success: true,
      message: `Location '${updated.name}' updated successfully!`,
      location: updated,
    });
  } catch (err) {
    console.error("[Locations API] Update error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update location" });
  }
});

// ── DELETE /api/locations/:id (Delete) ──────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const numericId = parseInt(req.params.id, 10);
    const deleted = await Location.findOneAndDelete({ id: numericId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }

    return res.json({
      success: true,
      message: `Location '${deleted.name}' deleted successfully!`,
      location: deleted,
    });
  } catch (err) {
    console.error("[Locations API] Delete error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete location" });
  }
});

export default router;
