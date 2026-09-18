import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";

const router = express.Router();

// ── POST /api/users/register ────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Prevent overriding predefined admin
    if (cleanEmail === "admin@spicymomento.com" || cleanEmail === "admin") {
      return res.status(400).json({ success: false, message: "This email is reserved for system administration." });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email is already registered. Please login instead." });
    }

    // Create new user
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password, // Beginner-friendly implementation
      phone: phone || "+1 (555) 234-5678",
      address: address || "123 Spice Street, Apt 4B, Foodie City",
      memberTier: "🌶 Spice Club Member",
      role: "customer",
    });

    return res.status(201).json({
      success: true,
      message: `Welcome to Spicy Momento, ${newUser.name}!`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        memberTier: newUser.memberTier,
        role: newUser.role,
        registeredAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("[Users API] Register error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to register user" });
  }
});

// ── POST /api/users/login ───────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email/User ID and password are required" });
    }

    let cleanEmail = email.trim().toLowerCase();
    // Allow typing either "admin" or "admin@spicymomento.com" as the User ID
    if (cleanEmail === "admin") {
      cleanEmail = "admin@spicymomento.com";
    }

    const user = await User.findOne({ email: cleanEmail });

    // Strict validation: must exist in MongoDB
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "No account found with these credentials. Please check or register first.",
      });
    }

    // Strict password match
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid email/User ID or password" });
    }

    const role = user.role || (user.email === "admin@spicymomento.com" ? "admin" : "customer");

    return res.json({
      success: true,
      message: role === "admin" ? `Welcome to Admin Dashboard, ${user.name}!` : `Welcome back, ${user.name}!`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        memberTier: user.memberTier,
        role: role,
        loggedInAt: Date.now(),
      },
    });
  } catch (err) {
    console.error("[Users API] Login error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to log in" });
  }
});

// ── GET /api/users/profile ──────────────────────────────────────────────────
router.get("/profile", async (req, res) => {
  try {
    const { email } = req.query;
    let user;

    if (email) {
      user = await User.findOne({ email: email.trim().toLowerCase() });
    }

    if (!user) {
      user = await User.findOne().sort({ createdAt: 1 });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User profile not found" });
    }

    // Count user's orders
    const orderCount = await Order.countDocuments({ customerEmail: user.email });

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        memberTier: user.memberTier,
        role: user.role || (user.email === "admin@spicymomento.com" ? "admin" : "customer"),
        favorites: user.favorites,
        orderCount,
      },
    });
  } catch (err) {
    console.error("[Users API] Profile fetch error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch profile" });
  }
});

// ── PUT /api/users/profile ──────────────────────────────────────────────────
router.put("/profile", async (req, res) => {
  try {
    const { email, name, phone, address } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required to update profile" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();

    const updatedUser = await User.findOneAndUpdate(
      { email: cleanEmail },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        memberTier: updatedUser.memberTier,
        role: updatedUser.role || "customer",
      },
    });
  } catch (err) {
    console.error("[Users API] Profile update error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update profile" });
  }
});

// ── GET /api/users (List all customers for Admin) ───────────────────────────
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    // Enrich users with order statistics
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const userOrders = await Order.find({ customerEmail: u.email });
        const orderCount = userOrders.length;
        const totalSpent = userOrders
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

        return {
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          address: u.address,
          memberTier: u.memberTier || "🌶 Spice Club Member",
          orderCount,
          totalSpent: Number(totalSpent.toFixed(2)),
          createdAt: u.createdAt,
        };
      })
    );

    return res.json({
      success: true,
      count: enrichedUsers.length,
      users: enrichedUsers,
    });
  } catch (err) {
    console.error("[Users API] List users error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// ── POST /api/users (Admin create customer) ─────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, address, memberTier, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password || "spicy123456",
      phone: phone?.trim() || "+1 (555) 234-5678",
      address: address?.trim() || "Foodie Plaza, Suite 10",
      memberTier: memberTier?.trim() || "🌶 Spice Club Member",
    });

    return res.status(201).json({
      success: true,
      message: `Customer ${newUser.name} created successfully!`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        memberTier: newUser.memberTier,
        orderCount: 0,
        totalSpent: 0,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("[Users API] Create user error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to create user" });
  }
});

// ── PUT /api/users/:id (Admin update customer) ──────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, memberTier } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (email) updateFields.email = email.trim().toLowerCase();
    if (phone) updateFields.phone = phone.trim();
    if (address) updateFields.address = address.trim();
    if (memberTier) updateFields.memberTier = memberTier.trim();

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: `Customer ${updated.name} updated successfully!`,
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        memberTier: updated.memberTier,
      },
    });
  } catch (err) {
    console.error("[Users API] Update user error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update user" });
  }
});

// ── DELETE /api/users/:id (Admin delete customer) ───────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: `Customer ${deleted.name} deleted successfully!`,
      user: deleted,
    });
  } catch (err) {
    console.error("[Users API] Delete user error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

export default router;
