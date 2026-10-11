const AuditLog = require("../models/AuditLog");

// ======================================================
// CREATE AUDIT LOG
// ======================================================
const createAuditLog = async (req, res) => {
  try {
    const {
      entityType,
      entityId,
      action,
      details = {},
      ipAddress,
      userAgent,
      endpoint,
      status = "success",
    } = req.body;

    // Validate required fields
    if (!entityType || !entityId || !action) {
      return res.status(400).json({
        message: "entityType, entityId, and action are required",
      });
    }

    const auditLog = await AuditLog.create({
      user: req.user
        ? req.user.userId || req.user.id || req.user._id
        : null,
      entityType,
      entityId,
      action,
      details,
      ipAddress,
      userAgent,
      endpoint,
      status,
    });

    res.status(201).json({
      message: "Audit log created successfully",
      data: auditLog,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error.message);

    res.status(500).json({
      message: "Failed to create audit log",
      error: error.message,
    });
  }
};

// ======================================================
// GET USER AUDIT LOGS
// ======================================================
const getUserAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, entityType, action, startDate, endDate } =
      req.query;

    const query = { user: req.user.userId };

    if (entityType) query.entityType = entityType;
    if (action) query.action = action;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "firstName lastName email"),

      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      message: "Audit logs retrieved successfully",
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve audit logs:", error.message);

    res.status(500).json({
      message: "Failed to retrieve audit logs",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL AUDIT LOGS (Admin only)
// ======================================================
const getAllAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, user, entityType, action, startDate, endDate } =
      req.query;

    const query = {};

    if (user) query.user = user;
    if (entityType) query.entityType = entityType;
    if (action) query.action = action;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "firstName lastName email email"),

      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      message: "Audit logs retrieved successfully",
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve audit logs:", error.message);

    res.status(500).json({
      message: "Failed to retrieve audit logs",
      error: error.message,
    });
  }
};

// ======================================================
// GET AUDIT LOG BY ID
// ======================================================
const getAuditLogById = async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id).populate(
      "user",
      "firstName lastName email"
    );

    if (!auditLog) {
      return res.status(404).json({
        message: "Audit log not found",
      });
    }

    res.status(200).json({
      message: "Audit log retrieved successfully",
      data: auditLog,
    });
  } catch (error) {
    console.error("Failed to retrieve audit log:", error.message);

    res.status(500).json({
      message: "Failed to retrieve audit log",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE AUDIT LOG
// ======================================================
const deleteAuditLog = async (req, res) => {
  try {
    const auditLog = await AuditLog.findByIdAndDelete(req.params.id);

    if (!auditLog) {
      return res.status(404).json({
        message: "Audit log not found",
      });
    }

    res.status(200).json({
      message: "Audit log deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete audit log:", error.message);

    res.status(500).json({
      message: "Failed to delete audit log",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================
module.exports = {
  createAuditLog,
  getUserAuditLogs,
  getAllAuditLogs,
  getAuditLogById,
  deleteAuditLog,
};
