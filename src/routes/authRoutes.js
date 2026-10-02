const express = require("express");

const {
  login,
  createStaff,
  updateAccountStatus,
  logout,
} = require("../controllers/authController");

const {
  protect,
  authorizePermission,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// LOGIN
// ======================================================

router.post("/login", login);


// ======================================================
// CREATE STAFF
// ======================================================
// Requires staff:create permission

router.post(
  "/staff",
  protect,
  authorizePermission("staff:create"),
  createStaff
);


// ======================================================
// ACTIVATE / DEACTIVATE STAFF
// ======================================================
// Requires staff:update permission

router.patch(
  "/staff/:userId/status",
  protect,
  authorizePermission("staff:update"),
  updateAccountStatus
);


// ======================================================
// LOGOUT
// ======================================================

router.post(
  "/logout",
  protect,
  logout
);


module.exports = router;