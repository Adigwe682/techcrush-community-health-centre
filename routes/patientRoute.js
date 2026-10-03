import express from "express";

const patientRoute = express.Router();

import {createPatientProfile, getAllPatientProfiles, getPatientById, updatePatient, deletePatient} from "../controllers/patientController.js";

patientRoute.post("/new-patient", createPatientProfile);
patientRoute.get("/all-patients", getAllPatientProfiles);
patientRoute.get("/patient/:id", getPatientById);
patientRoute.patch("/update-patient/:id", updatePatient);
patientRoute.delete("/delete-patient/:id", deletePatient);

export default patientRoute;