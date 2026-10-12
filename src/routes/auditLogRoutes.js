const express = require("express");

const {
  createAuditLog,
  getUserAuditLogs,
  getAllAuditLogs,
  getAuditLogById,
  deleteAuditLog,
} = require("../controllers/auditLogController");

const { protect, authorizePermission } = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// CREATE AUDIT LOG (Admin only)
// ======================================================
// Requires: audit:manage permission
router.post("/", protect, authorizePermission("audit:manage"), createAuditLog);

// ======================================================
// GET USER AUDIT LOGS
// ======================================================
router.get("/", protect, getUserAuditLogs);

// ======================================================
// GET ALL AUDIT LOGS (Admin only)
// ======================================================
router.get(
  "/all",
  protect,
  authorizePermission("audit:manage"),
  getAllAuditLogs
);

// ======================================================
// GET AUDIT LOG BY ID (Admin only)
// ======================================================
router.get(
  "/:id",
  protect,
  authorizePermission("audit:manage"),
  getAuditLogById
);

// ======================================================
// DELETE AUDIT LOG (Admin only)
// ======================================================
router.delete(
  "/:id",
  protect,
  authorizePermission("audit:manage"),
  deleteAuditLog
);

module.exports = router;
