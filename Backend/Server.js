import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";

import dashboardRoute from "./dashboardRoute.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount Dashboard Routes
// Accessible at /api/dashboard/... and /api/reports/...
app.use("/api", dashboardRoute);

// Root health check endpoint
app.get("/", (req, res) => {
  res.json({ success: true, message: "FluxPay Clinic Dashboard API is running" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// Database Connection & Server Startup
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/clinic_db";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });