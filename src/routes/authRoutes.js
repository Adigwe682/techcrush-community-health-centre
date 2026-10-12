import express from "express";

import {
  login,
  createStaff,
  updateAccountStatus,
  logout,
} from "../controllers/authController.js";

import {
  protect,
  authorizePermission,
} from "../middleware/authMiddleware.js";

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


export default router;