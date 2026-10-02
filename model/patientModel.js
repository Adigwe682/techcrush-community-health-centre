import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    name: {type: String, required: true},
    dateOfBirth: {type: Date, required: true},
    gender: {type: String, required: true},
    address: {type: String, required: true},
    phoneNumber: {type: String, required: true},
    nextOfKin: {type: String, required: true},
    religion: {type: String, required: true},
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;