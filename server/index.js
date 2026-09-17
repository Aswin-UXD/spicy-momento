import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import usersRoutes from "./routes/users.js";
import menuRoutes from "./routes/menu.js";
import ordersRoutes from "./routes/orders.js";
import contactRoutes from "./routes/contact.js";
import locationsRoutes from "./routes/locations.js";
import { seedDatabase } from "./seed.js";

// ── 1. Configuration ────────────────────────────────────────────────────────
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spicy_momento";

// ── 2. Middlewares ──────────────────────────────────────────────────────────
// CORS configuration allows requests from all local development origins
app.use(
  cors({
    origin: true, // Reflects request origin, allowing localhost, 127.0.0.1, and any dev port
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
  })
);

app.use(express.json());

// Request logger for beginner-friendly debugging in console
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── 3. API Routes ───────────────────────────────────────────────────────────
app.use("/api/users", usersRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/catering", contactRoutes); // Alias for catering form submissions
app.use("/api/locations", locationsRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    success: true,
    message: "Spicy Momento API is healthy & running! 🌶",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ── 4. 404 & Error Handlers ─────────────────────────────────────────────────
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, _next) => {
  console.error("[Server Error]", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ── 5. Database Connection & Server Boot ────────────────────────────────────
const startServer = async () => {
  try {
    console.log("[MongoDB] Connecting to:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("[MongoDB] Connected successfully! 🍃");

    // Auto-seed collections if empty
    await seedDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Express] Spicy Momento Backend running on http://localhost:${PORT}`);
      console.log(`[Express] Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error("[MongoDB] Connection failed:", err.message);
    console.log("[Express] Starting Express server anyway for resilient operation...");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Express] Running on http://localhost:${PORT} (Database pending connection)`);
    });
  }
};

startServer();

export default app;
