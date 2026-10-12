const AuditLog = require("../models/AuditLog");

// ======================================================
// ACTIVITY LOG MIDDLEWARE
// ======================================================
// Logs every authenticated request to the audit log.
// This provides activity tracking for login/logout and all
// authenticated actions.

const activityLogMiddleware = async (req, res, next) => {
  // Skip logging for public routes
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/auth/health",
  ];

  const requestUrl = req.originalUrl || req.url;
  const isPublicRoute = publicRoutes.some((route) =>
    requestUrl.startsWith(route)
  );

  if (isPublicRoute) {
    return next();
  }

  // Skip logging for static files and favicon
  if (requestUrl.includes("favicon") || requestUrl.includes(".js") || requestUrl.includes(".css") || requestUrl.includes(".png") || requestUrl.includes(".jpg") || requestUrl.includes(".svg")) {
    return next();
  }

  // Check if user is authenticated
  const isAuthenticated = req.headers.authorization && req.headers.authorization.startsWith("Bearer ");

  const userId = isAuthenticated
    ? (req.user && req.user.userId) || (req.user && req.user.id) || (req.user && req.user._id)
    : null;

  const entityType = "System";
  const entityId = null;
  const action = isAuthenticated
    ? `AUTH_REQUEST_${req.method.toUpperCase()}`
    : `UNAUTHENTICATED_REQUEST_${req.method.toUpperCase()}`;

  const details = {
    ipAddress: req.ip || req.headers["x-forwarded-for"] || "unknown",
    userAgent: req.headers["user-agent"] || "unknown",
    endpoint: req.originalUrl || req.url,
    method: req.method,
    headers: {
      authorization: isAuthenticated ? "***" : "none",
    },
    query: req.query,
  };

  // Store audit log in a queue to avoid blocking the request
  // Process asynchronously after the response is sent
  const auditLog = {
    user: userId,
    entityType,
    entityId,
    action,
    details,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    endpoint: details.endpoint,
    status: null, // Will be updated after response
  };

  // Hook into response to update status after response is sent
  const originalEnd = res.end;
  res.end = function (...args) {
    auditLog.status = res.statusCode >= 200 && res.statusCode < 300 ? "success" : "failed";

    // Create audit log asynchronously
    if (auditLog.user) {
      AuditLog.create(auditLog)
        .then((log) => {
          // Log created successfully
        })
        .catch((err) => {
          console.error("Failed to create activity audit log:", err.message);
        });
    } else {
      // For unauthenticated requests, still log but with a fallback
      AuditLog.create(auditLog)
        .then((log) => {
          // Log created successfully
        })
        .catch((err) => {
          console.error("Failed to create activity audit log:", err.message);
        });
    }

    originalEnd.apply(res, args);
  };

  next();
};

module.exports = activityLogMiddleware;
