require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const billRoutes = require("./routes/billRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Routes ─────────────────────────────────────────────────────
const historyRoutes = require("./routes/historyRoutes");
app.use("/api/bills", billRoutes);
app.use("/api/history", historyRoutes);

// ── Health check ───────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "AI Bill Splitter API is running" });
});

// ── Global error handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Global error:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Server error",
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API health: http://localhost:${PORT}/api/health\n`);
});