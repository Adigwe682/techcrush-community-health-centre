const mongoose = require("mongoose");

const clinicalEncounterSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visit",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    chiefComplaint: {
      type: String,
      required: true,
      trim: true,
    },

    clinicalNotes: {
      type: String,
      trim: true,
    },

    diagnosis: [
      {
        condition: {
          type: String,
          required: true,
          trim: true,
        },

        notes: {
          type: String,
          trim: true,
        },
      },
    ],

    prescriptions: [
      {
        medication: {
          type: String,
          required: true,
          trim: true,
        },

        dosage: {
          type: String,
          required: true,
          trim: true,
        },

        frequency: {
          type: String,
          required: true,
          trim: true,
        },

        duration: {
          type: String,
          required: true,
          trim: true,
        },

        instructions: {
          type: String,
          trim: true,
        },
      },
    ],

    followUp: {
      required: {
        type: Boolean,
        default: false,
      },

      date: {
        type: Date,
      },

      instructions: {
        type: String,
        trim: true,
      },
    },

    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ClinicalEncounter",
  clinicalEncounterSchema
);