const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
  {
    visit: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Visit",
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Patient",
    },

    queueNumber: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "called",
        "in-service",
        "completed",
        "cancelled",
      ],
      default: "waiting",
    },

    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },

    calledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Queue", queueSchema);