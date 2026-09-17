import express from "express";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

// ── GET /api/menu/categories ────────────────────────────────────────────────
router.get("/categories", async (req, res) => {
  try {
    const categories = await MenuItem.distinct("category");
    return res.json({ success: true, categories: ["All", ...categories] });
  } catch (err) {
    console.error("[Menu API] Categories error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
});

// ── GET /api/menu ───────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, spicy, bestPrice, all } = req.query;
    const filter = {};

    // Only filter by available: true if not explicitly requesting all items (e.g. for admin)
    if (all !== "true") {
      filter.available = true;
    }

    if (category && category !== "All") {
      filter.category = new RegExp(`^${category.trim()}$`, "i");
    }
    if (spicy !== undefined) {
      filter.isSpicy = spicy === "true";
    }
    if (bestPrice !== undefined) {
      filter.bestPrice = bestPrice === "true";
    }

    const items = await MenuItem.find(filter).sort({ id: 1 });
    return res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (err) {
    console.error("[Menu API] Fetch menu error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch menu items" });
  }
});

// ── GET /api/menu/:id ───────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const numericId = parseInt(req.params.id, 10);
    const item = await MenuItem.findOne({ id: numericId });

    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    return res.json({ success: true, item });
  } catch (err) {
    console.error("[Menu API] Fetch single item error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch menu item" });
  }
});

// ── POST /api/menu (Create item) ───────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, category, price, description, spiceLevel, isSpicy, bestPrice, image, available } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Item name is required" });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }
    if (price === undefined || Number(price) < 0) {
      return res.status(400).json({ success: false, message: "Valid price is required" });
    }

    // Auto-generate next integer id
    const highestItem = await MenuItem.findOne().sort({ id: -1 });
    const nextId = highestItem ? highestItem.id + 1 : 1;

    const newItem = await MenuItem.create({
      id: nextId,
      name: name.trim(),
      category: category.trim(),
      price: Number(Number(price).toFixed(2)),
      description: description?.trim() || "Delicious authentic food truck specialty.",
      spiceLevel: Number(spiceLevel) || 1,
      isSpicy: isSpicy === true || (spiceLevel && Number(spiceLevel) > 0),
      bestPrice: bestPrice === true,
      image: image?.trim() || "/assets/images/spicy-tacos.jpg",
      available: available !== false,
    });

    return res.status(201).json({
      success: true,
      message: `Menu item '${newItem.name}' created successfully! 🌶`,
      item: newItem,
    });
  } catch (err) {
    console.error("[Menu API] Create error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to create menu item" });
  }
});

// ── PUT /api/menu/:id (Update item) ─────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const numericId = parseInt(req.params.id, 10);
    const { name, category, price, description, spiceLevel, isSpicy, bestPrice, image, available } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (category) updateFields.category = category.trim();
    if (price !== undefined) updateFields.price = Number(Number(price).toFixed(2));
    if (description !== undefined) updateFields.description = description.trim();
    if (spiceLevel !== undefined) {
      updateFields.spiceLevel = Number(spiceLevel);
      updateFields.isSpicy = Number(spiceLevel) > 0;
    }
    if (isSpicy !== undefined) updateFields.isSpicy = isSpicy;
    if (bestPrice !== undefined) updateFields.bestPrice = bestPrice;
    if (image) updateFields.image = image.trim();
    if (available !== undefined) updateFields.available = available;

    const updated = await MenuItem.findOneAndUpdate(
      { id: numericId },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    return res.json({
      success: true,
      message: `Menu item '${updated.name}' updated successfully!`,
      item: updated,
    });
  } catch (err) {
    console.error("[Menu API] Update error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update menu item" });
  }
});

// ── DELETE /api/menu/:id (Delete item) ──────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const numericId = parseInt(req.params.id, 10);
    const deleted = await MenuItem.findOneAndDelete({ id: numericId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    return res.json({
      success: true,
      message: `Menu item '${deleted.name}' deleted successfully!`,
      item: deleted,
    });
  } catch (err) {
    console.error("[Menu API] Delete error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete menu item" });
  }
});

export default router;
