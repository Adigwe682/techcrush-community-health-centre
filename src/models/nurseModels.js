const mongoose = require("mongoose");

const nurseSchema = new mongoose.Schema({
    nurse: {type:mongoose.Schema.Types.ObjectId,ref: "User",required:true},
    patient: {type: mongoose.Schema.Types.ObjectId,ref: "Patient",required: true},
    visit: {type: mongoose.Schema.Types.ObjectId,ref: "Visit", required: true},
    vitals: {
        bloodPressure:String,
        heartRate:String,
        height:String,
        weight:String,
        bodyTemperature:String,
        OxygenSaturation:String,
    },
    status:{type: String, enum: ["waiting", "in-progress", "completed"], default: "waiting"},
    observations: {type: String},
    nursingNotes: {type: String},
    completedAt: {type: Date, default: null},
    triage:{type: String, enum: ["Red", "Yellow", "Green", "Black"], default: "Green", required: true},

},
    {timestamps: true} 
);


module.exports = mongoose.model("Nurse", nurseSchema);