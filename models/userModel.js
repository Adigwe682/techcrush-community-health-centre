import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String,
        enum: ['doctor', 'nurse', 'admin', 'patient'],
        required: true
    },

}, {timestamps: true});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const genSalt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, genSalt);
    next();
})

export default mongoose.model("User", userSchema);
