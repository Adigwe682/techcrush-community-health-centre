import mongoose from "mongoose";

const adminSchema = new mongoose.Schema ({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    permissions: [{type: String }],
}, {timestamps: true});

export default mongoose.model("Admin", adminSchema);