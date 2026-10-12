const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patientController");
const {
  protect,
  authorizePermission,
} = require("../middleware/authMiddleware");

router.use(protect);

router.post(
  "/patients",
  authorizePermission("patient:create"),
  patientController.registerPatient,
);

router.get(
  "/patients",
  authorizePermission("patient:view"),
  patientController.getAllPatients,
);

router.get(
  "/patients/search",
  authorizePermission("patient:view"),
  patientController.searchPatient,
);

router.get(
  "/patients/:id",
  authorizePermission("patient:view"),
  patientController.getPatientProfile,
);

router.put(
  "/patients/:id",
  authorizePermission("patient:update"),
  patientController.updatePatient,
);

router.delete(
  "/patients/:id",
  authorizePermission("patient:update"),
  patientController.deletePatient,
);

router.get(
  "/patients/:id/history",
  authorizePermission("patient:view"),
  patientController.getPatientHistory,
);

router.post(
  "/patients/:id/history",
  authorizePermission("patient:update"),
  patientController.createPatientHistory,
);

router.put(
  "/patients/history/:id",
  authorizePermission("patient:update"),
  patientController.updatePatientHistory,
);

router.delete(
  "/patients/history/:id",
  authorizePermission("patient:update"),
  patientController.deletePatientHistory,
);

module.exports = router;
