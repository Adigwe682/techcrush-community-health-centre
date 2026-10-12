const express = require("express");

const {
  protect,
  authorizePermission,
} = require("../middleware/authMiddleware");

const {
  createClinicalEncounter,
  getClinicalEncounter,
  getPatientClinicalHistory,
  addDiagnosis,
  addPrescription,
  updateFollowUp,
  completeClinicalEncounter,
} = require("../controllers/clinicalController");

const router = express.Router();

// Create clinical encounter
router.post(
  "/",
  protect,
  authorizePermission("clinical:create"),
  createClinicalEncounter,
);

// View patient's clinical history
router.get(
  "/patient/:patientId",
  protect,
  authorizePermission("clinical:view"),
  getPatientClinicalHistory,
);

// Add diagnosis
router.post(
  "/:id/diagnosis",
  protect,
  authorizePermission("diagnosis:create"),
  addDiagnosis,
);

// Add prescription
router.post(
  "/:id/prescription",
  protect,
  authorizePermission("prescription:create"),
  addPrescription,
);

// Update follow-up
router.patch(
  "/:id/follow-up",
  protect,
  authorizePermission("clinical:create"),
  updateFollowUp,
);

// Complete clinical encounter
router.patch(
  "/:id/complete",
  protect,
  authorizePermission("clinical:create"),
  completeClinicalEncounter,
);

// View single clinical encounter
router.get(
  "/:id",
  protect,
  authorizePermission("clinical:view"),
  getClinicalEncounter,
);

module.exports = router;
