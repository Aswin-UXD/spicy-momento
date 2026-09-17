import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

const generateOrderNumber = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "SM-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// ── GET /api/orders ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    const filter = {};

    if (email) {
      filter.customerEmail = email.trim().toLowerCase();
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error("[Orders API] Fetch orders error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// ── GET /api/orders/:id ─────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const param = req.params.id;
    let order;

    if (param.startsWith("SM-")) {
      order = await Order.findOne({ orderNumber: param });
    } else {
      order = await Order.findById(param);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, order });
  } catch (err) {
    console.error("[Orders API] Fetch single order error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
});

// ── POST /api/orders ────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      items,
      specialNotes,
      totalAmount,
      paymentMethod,
      paymentStatus,
      transactionId,
      deliveryAddress,
      phone,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must contain at least one item" });
    }

    if (!customerEmail || !customerEmail.trim()) {
      return res.status(400).json({ success: false, message: "Login is required to place an order" });
    }

    const name = customerName?.trim() || "Spicy Foodie";
    const email = customerEmail.trim().toLowerCase();

    // Calculate subtotal
    const subtotal = items.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      return acc + price * qty;
    }, 0);

    const tax = subtotal * 0.08875;
    const computedTotal = subtotal + tax;
    const finalTotal = totalAmount ? Number(totalAmount) : Number(computedTotal.toFixed(2));

    const orderNumber = generateOrderNumber();

    // Payment handling
    const validMethod = ["card", "upi", "cod"].includes(paymentMethod) ? paymentMethod : "card";
    const finalPaymentStatus = paymentStatus || (validMethod === "cod" ? "pending" : "paid");
    const finalTxnId =
      transactionId ||
      (validMethod === "cod"
        ? ""
        : `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);

    const newOrder = await Order.create({
      orderNumber,
      customerName: name,
      customerEmail: email,
      items: items.map((i) => ({
        id: Number(i.id),
        name: i.name,
        price: Number(i.price),
        quantity: Number(i.quantity) || 1,
      })),
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      totalAmount: finalTotal,
      status: "confirmed",
      paymentMethod: validMethod,
      paymentStatus: finalPaymentStatus,
      transactionId: finalTxnId,
      deliveryAddress: deliveryAddress?.trim() || "123 Spice Street, Foodie City",
      phone: phone?.trim() || "+1 (555) 000-0000",
      specialNotes: specialNotes || "",
    });

    return res.status(201).json({
      success: true,
      message: `Order ${orderNumber} placed successfully! 🌶`,
      order: newOrder,
    });
  } catch (err) {
    console.error("[Orders API] Create order error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to create order" });
  }
});

// ── PATCH /api/orders/:id ───────────────────────────────────────────────────
router.patch("/:id", async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const param = req.params.id;

    if (!status && !paymentStatus) {
      return res.status(400).json({ success: false, message: "status or paymentStatus is required" });
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    const filter = param.startsWith("SM-") ? { orderNumber: param } : { _id: param };
    const updated = await Order.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({
      success: true,
      message: `Order ${updated.orderNumber} updated successfully`,
      order: updated,
    });
  } catch (err) {
    console.error("[Orders API] Patch order error:", err);
    return res.status(500).json({ success: false, message: "Failed to update order" });
  }
});

// ── DELETE /api/orders/:id ──────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const param = req.params.id;
    const { permanent } = req.query;
    const filter = param.startsWith("SM-") ? { orderNumber: param } : { _id: param };

    if (permanent === "true") {
      const deleted = await Order.findOneAndDelete(filter);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      return res.json({
        success: true,
        message: `Order ${deleted.orderNumber} permanently deleted`,
        order: deleted,
      });
    }

    const cancelled = await Order.findOneAndUpdate(
      filter,
      { $set: { status: "cancelled" } },
      { new: true }
    );

    if (!cancelled) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({
      success: true,
      message: `Order ${cancelled.orderNumber} has been cancelled`,
      order: cancelled,
    });
  } catch (err) {
    console.error("[Orders API] Cancel order error:", err);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
});

export default router;
