import express from "express";

const adminRoute = express.Router();

import {createAdminProfile, getAllAdminProfile, getAdminProfileById, updateAdminProfile, deleteAdminProfile} from "../controllers/adminController.js";

patientRoute.post("/new-admin", createAdminProfile);
patientRoute.get("/all-admins", getAllAdminProfile);
patientRoute.get("/admin/:id", getAdminProfileById);
patientRoute.patch("/update-admin/:id", updateAdminProfile);
patientRoute.delete("/delete-admin/:id", deleteAdminProfile);

export default adminRoute;