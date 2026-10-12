// ======================================================
// HEALTH CHECK CONTROLLER
// ======================================================
// Provides a health check endpoint for monitoring and
// load balancer health checks. Returns service status
// and database connectivity info.

const mongoose = require("mongoose");

const healthCheck = (req, res) => {
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  };

  // Add database status if connected
  if (mongoose.connection.readyState === 1) {
    healthStatus.database = {
      status: "connected",
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    };
  } else {
    healthStatus.database = {
      status: "disconnected",
      database: "Unknown",
    };
    healthStatus.status = "degraded";
  }

  // Add audit logging status
  healthStatus.auditLogging = {
    enabled: process.env.AUDIT_ENABLED !== "false",
  };

  // Add notification status
  healthStatus.notifications = {
    enabled: process.env.NOTIFICATION_ENABLED !== "false",
  };

  res.status(200).json(healthStatus);
};

module.exports = {
  healthCheck,
};
