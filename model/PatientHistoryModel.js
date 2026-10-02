import mongoose from 'mongoose';

const patientHistorySchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    medicalHistory: { type: String, required: true },
    medications: { type: [String], required: true },
    allergies: { type: [String], required: true },
    mainComplaint: { type: String, required: true },
    dateOfVisit: { type: Date, required: true },
});

const PatientHistory = mongoose.model('PatientHistory', patientHistorySchema);
export default PatientHistory;
