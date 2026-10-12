const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "info",
        "success",
        "warning",
        "error",
        "system",
        "permission_granted",
        "permission_denied",
        "login",
        "logout",
        "account_activated",
        "account_deactivated",
        "appointment_created",
        "appointment_updated",
        "appointment_cancelled",
        "queue_updated",
        "billing_updated",
        "payment_received",
      ],
      default: "info",
    },

    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for common query patterns
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
