import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
    },
    doctorName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    reasonForVisit: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW', 'COMPLETED'],
      default: 'SCHEDULED',
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
const Appointment = mongoose.model(
    'Appointment',
    appointmentSchema
);
export default Appointment

;
