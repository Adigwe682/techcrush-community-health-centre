import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema ({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    licenceNumber: {type: String, required: true, unique: true},
    specialization: {type: String, required: true},
}, {timestamps: true});

export default mongoose.model("Doctor", doctorSchema);