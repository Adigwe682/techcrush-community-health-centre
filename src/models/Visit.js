const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    visitType: {
      type: String,
      enum: ["appointment", "walk-in"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "in-progress",
        "completed",
        "cancelled",
      ],
      default: "waiting",
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Visit", visitSchema);