const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Permission = require("../models/Permission");
// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================
// Checks whether the user has a valid JWT token.

const protect = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Check Bearer token format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Store decoded information
    req.user = decoded;

    // Continue
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};


// ======================================================
// ROLE-BASED AUTHORIZATION
// ======================================================
// Example:
// authorize("Admin")
// authorize("Doctor", "Admin")

const authorize = (...roles) => {
  return (req, res, next) => {
    // Make sure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Check user's role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};


// ======================================================
// PERMISSION-BASED AUTHORIZATION
// ======================================================
// Example:
// authorizePermission("staff:create")
// authorizePermission("patient:create")

const authorizePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // Make sure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      // Find the current user and load:
      // User -> Role -> Permissions
      const user = await User.findById(req.user.userId)
        .populate({
          path: "role",
          populate: {
            path: "permissions",
          },
        });

      // User doesn't exist
      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      // Account has been deactivated
      if (!user.isActive) {
        return res.status(403).json({
          message: "Account is inactive",
        });
      }

      // Make sure the user has a role
      if (!user.role) {
        return res.status(403).json({
          message: "User role not found",
        });
      }

      // Check whether the role has the required permission
      const hasPermission = user.role.permissions.some(
        (permission) => permission.name === permissionName
      );

      // Permission not found
      if (!hasPermission) {
        return res.status(403).json({
          message: "You do not have permission to perform this action",
        });
      }

      // Permission exists
      next();
    } catch (error) {
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  };
};


// ======================================================
// EXPORT MIDDLEWARE
// ======================================================

module.exports = {
  protect,
  authorize,
  authorizePermission,
};