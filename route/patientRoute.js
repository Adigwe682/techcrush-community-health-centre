import express from "express";
const router = express.Router();
import patientController from "../controller/controller.js";

router.post("/patients", patientController.registerPatient);
router.get("/patients", patientController.getAllPatients);
router.get("/patients/search", patientController.searchPatient);
router.get("/patients/:id", patientController.getPatientProfile);
router.put("/patients/:id", patientController.updatePatient);
router.delete("/patients/:id", patientController.deletePatient);
router.get("/patients/:id/history", patientController.getPatientHistory);
router.post("/patients/:id/history", patientController.createPatientHistory);


export default router;