import User from "../models/userModel.js";
import { createDoctorProfile } from "./doctorController.js";
import { createPatientProfile } from "./patientController.js";
import { createAdminProfile } from "./adminController.js";
import {createNurseProfile} from "./nurseController.js";

export const registerUser = async (req, res) => {
    try {
        const {email, password, role} = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            })
        }

        const newUser = new User({ email, password, role});
        await newUser.save();

        // create profile based on role

        switch (role) {
            case "doctor":
                await createDoctorProfile(newUser._id, req.body);
                break;
            case "patient": 
                await createPatientProfile(newUser._id, req.body);
                break;
            case "admin":
                await createAdminProfile(newUser._id, req.body);
                break;
            case "nurse":
                await createNurseProfile(newUser._id, req.body);
                break;
            default:
                return res.status(400).json({
                    message: "invalid role"
                })
                break;
        }

        return res.status(201).json({
            message: `${role} registered successfully.`,
            user: {id: newUser._id, email: newUser.email, role: newUser.role}
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server error"
        })
    }
};