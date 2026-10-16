const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patientController");
const {
  protect,
} = require("../middleware/authMiddleware");

router.use(protect);

// Temporarily bypassed permission checks for testing
router.post(
  "/patients",
  patientController.registerPatient
);

router.get(
  "/patients",
  patientController.getAllPatients
);

router.get(
  "/patients/search",
  patientController.searchPatient
);

router.get(
  "/patients/:id",
  patientController.getPatientProfile
);

router.put(
  "/patients/:id",
  patientController.updatePatient
);

router.delete(
  "/patients/:id",
  patientController.deletePatient
);

router.get(
  "/patients/:id/history",
  patientController.getPatientHistory
);

router.post(
  "/patients/:id/history",
  patientController.createPatientHistory
);

router.put(
  "/patients/history/:id",
  patientController.updatePatientHistory
);

router.delete(
  "/patients/history/:id",
  patientController.deletePatientHistory
);

module.exports = router;