import express from "express";

const doctorRoute = express.Router();

import {createDoctorProfile, getAllDoctorsProfile, getDoctorProfileById, updateDoctorProfile, deleteDoctorProfile} from "../controllers/doctorController.js";

patientRoute.post("/new-doctor", createDoctorProfile);
patientRoute.get("/all-doctors", getAllDoctorsProfile);
patientRoute.get("/doctor/:id", getDoctorProfileById);
patientRoute.patch("/update-doctor/:id", updateDoctorProfile);
patientRoute.delete("/delete-doctor/:id", deleteDoctorProfile);

export default doctorRoute;