// TEMPORARY. Section 1 (Auth & RBAC) owns the real version.
// This works with your current login: JWT payload { userId }, user loaded from userModel.
// When Section 1 ships theirs, change the import in dashboardRoute.js and delete this file.

import jwt from "jsonwebtoken";
import userModel from "../Backend/Model/userModel.js"; // <-- CHECK THIS PATH

// Your current schema uses "customer"; the design calls this role "patient".
const normalizeRole = (role) => (role === "customer" ? "patient" : role);

export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = user;
    req.userRole = normalizeRole(user.role);
    next();
  } catch (error) {
    // Token problems are 401. Database problems must not look like auth failures.
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
    console.error("Auth middleware error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.userRole)) {
    return res.status(403).json({ success: false, message: "You do not have access to this resource" });
  }
  next();
};