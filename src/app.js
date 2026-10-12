const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const visitRoutes = require("./routes/visitRoutes");
const queueRoutes = require("./routes/queueRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const clinicalRoutes = require("./routes/clinicalRoutes");
const patientRoutes = require("./routes/patientRoutes");
const billRoutes = require("./routes/billRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

dotenv.config();

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());

// ======================================================
// ROUTES
// ======================================================

app.use("/api/auth", authRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/clinical", clinicalRoutes);
app.use("/api", patientRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/payments", paymentRoutes);

// API documentation endpoint
app.get("/api/docs", (req, res) => {
  res.json({
    message: "API Documentation",
    documentation: {
      version: "1.0.0",
      baseUrl: process.env.BASE_URL || "http://localhost:5000",
      endpoints: {
        "Authentication": [
          {
            method: "POST",
            path: "/api/auth/login",
            description: "Authenticate user and receive JWT token",
          },
          {
            method: "POST",
            path: "/api/auth/logout",
            description: "Logout and invalidate token",
          },
        ],
        "Audit Logs": [
          {
            method: "POST",
            path: "/api/audit",
            description: "Create audit log entry (Admin only)",
          },
          {
            method: "GET",
            path: "/api/audit",
            description: "Get user's audit logs",
          },
          {
            method: "GET",
            path: "/api/audit/all",
            description: "Get all audit logs (Admin only)",
          },
        ],
        "Notifications": [
          {
            method: "POST",
            path: "/api/notifications",
            description: "Create a notification",
          },
          {
            method: "GET",
            path: "/api/notifications",
            description: "Get user's notifications",
          },
          {
            method: "GET",
            path: "/api/notifications/unread-count",
            description: "Get unread notification count",
          },
        ],
      },
    },
  });
});

// ======================================================
// Audit log routes (Admin only)
app.use("/api/audit", require("./routes/auditLogRoutes"));

// Notification routes (all authenticated users)
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ======================================================
// 404 HANDLER
// ======================================================
const { notFoundHandler } = require("./middleware/errorHandler");
app.use(notFoundHandler);

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================
const { handleError } = require("./middleware/errorHandler");
app.use(handleError);


// MONGODB CONNECTION
// ======================================================

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
