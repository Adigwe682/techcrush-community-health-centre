const Notification = require("../models/Notification");

// ======================================================
// CREATE NOTIFICATION
// ======================================================
const createNotification = async (req, res) => {
  try {
    const { title, message, type = "info", data = {} } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: "title and message are required",
      });
    }

    const notification = await Notification.create({
      user: req.user.userId,
      title,
      message,
      type,
      data,
    });

    res.status(201).json({
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    res.status(500).json({
      message: "Failed to create notification",
      error: error.message,
    });
  }
};

// ======================================================

// ======================================================
// DELETE NOTIFICATION
// ======================================================
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.userId,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found or you do not have permission",
      });
    }

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete notification:", error.message);
    res.status(500).json({
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE ALL NOTIFICATIONS
// ======================================================
const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user: req.user.userId,
    });

    res.status(200).json({
      message: "All notifications deleted successfully",
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error("Failed to delete all notifications:", error.message);
    res.status(500).json({
      message: "Failed to delete all notifications",
      error: error.message,
    });
  }
};

// ======================================================
// GET USER NOTIFICATIONS
// ======================================================
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, read, type, startDate, endDate } = req.query;

    const query = { user: req.user.userId };

    if (read !== undefined) query.read = read !== "true";
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);

      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),

      Notification.countDocuments(query),
    ]);

    res.status(200).json({
      message: "Notifications retrieved successfully",
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve notifications:", error.message);
    res.status(500).json({
      message: "Failed to retrieve notifications",
      error: error.message,
    });
  }
};

// ======================================================
// GET UNREAD NOTIFICATION COUNT
// ======================================================
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.userId,
      read: false,
    });

    res.status(200).json({
      message: "Unread count retrieved successfully",
      data: count,
    });
  } catch (error) {
    console.error("Failed to retrieve unread count:", error.message);
    res.status(500).json({
      message: "Failed to retrieve unread count",
      error: error.message,
    });
  }
};

// ======================================================
// MARK NOTIFICATION AS READ
// ======================================================
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found or you do not have permission",
      });
    }

    res.status(200).json({
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error.message);
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// ======================================================
// MARK ALL NOTIFICATIONS AS READ
// ======================================================
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.status(200).json({
      message: "All notifications marked as read",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error.message);
    res.status(500).json({
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};


// ======================================================
// EXPORT CONTROLLERS
// ======================================================
module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================
module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};
