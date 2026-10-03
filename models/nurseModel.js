import mongoose from "mongoose";

const nurseSchema = new mongoose.Schema ({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    licenceNumber: {type: String, required: true, unique: true},
    qualification: {type: String, required: true},
}, {timestamps: true});

export default mongoose.model("Nurse", nurseSchema);
