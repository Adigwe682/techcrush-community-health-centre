const express = require("express");
const {
  nurseDashboard,
  doctorDashboard,
  adminDashboard,
  patientDashboard,
  operationsReport,
  financialReport,
  patientFlowReport,
} = require("../controllers/dashboardController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/nurse", authorize("Nurse"), nurseDashboard);
router.get("/doctor", authorize("Doctor"), doctorDashboard);
router.get("/admin", authorize("Admin"), adminDashboard);
router.get("/patient", authorize("Patient"), patientDashboard);

router.get("/reports/operations", authorize("Admin"), operationsReport);
router.get(
  "/reports/financial",
  authorize("Admin", "Cashier"),
  financialReport,
);
router.get("/reports/patient-flow", authorize("Admin"), patientFlowReport);

module.exports = router;
