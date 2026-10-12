const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    entityType: {
      type: String,
      enum: [
        "User",
        "Role",
        "Permission",
        "Patient",
        "Appointment",
        "Queue",
        "ClinicalEncounter",
        "Diagnosis",
        "Prescription",
        "Billing",
        "Payment",
      ],
      required: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    details: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    endpoint: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["success", "error", "failed"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

// Index for common query patterns
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
