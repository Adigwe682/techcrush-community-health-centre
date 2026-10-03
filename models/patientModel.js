import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    dateOfBirth: {type: Date, required: true},
    phone: {type: String, required: true},
    address: {type: String, required: true},
    bloodGroup: {type: String, required: true},
    gender: { type: String, enum: ['male', 'female', 'other'], required: true},
    allergies: {
        type: String,
        severity: {type: String, 
            enum: ['mild', 'moderate', 'severe'], 
            required: true},
            diagnosedAt: {type: Date, required: true},
    },
    bodyWeight: {type: Number, required: true},
    height: {type: Number, required: true}
    
}, {timestamps: true});

export default mongoose.model('Patient', patientSchema);