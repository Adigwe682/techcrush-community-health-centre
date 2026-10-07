import express from "express";

const nurseRoute = express.Router();

import {createNurseProfile, getAllNursesProfile, getNurseProfileById, updateNurseProfile, deleteNurseProfile} from "../controllers/nurseController.js";

patientRoute.post("/new-nurse", createNurseProfile);
patientRoute.get("/all-nurses", getAllNursesProfile);
patientRoute.get("/nurse/:id", getNurseProfileById);
patientRoute.patch("/update-nurse/:id", updateNurseProfile);
patientRoute.delete("/delete-nurse/:id", deleteNurseProfile);

export default nurseRoute;