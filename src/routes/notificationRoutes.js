const express = require("express");

const {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// CREATE NOTIFICATION
// ======================================================
router.post("/", protect, createNotification);

// ======================================================
// GET USER NOTIFICATIONS
// ======================================================
router.get("/", protect, getUserNotifications);

// ======================================================
// GET UNREAD COUNT
// ======================================================
router.get("/unread-count", protect, getUnreadCount);

// ======================================================
// MARK AS READ
// ======================================================
router.patch("/:id/read", protect, markAsRead);

// ======================================================
// MARK ALL AS READ
// ======================================================
router.patch("/read-all", protect, markAllAsRead);

// ======================================================
// DELETE NOTIFICATION
// ======================================================
router.delete("/:id", protect, deleteNotification);

// ======================================================
// DELETE ALL NOTIFICATIONS
// ======================================================
router.delete("/", protect, deleteAllNotifications);

module.exports = router;
