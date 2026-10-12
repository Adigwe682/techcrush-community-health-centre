const express = require("express");
const {
  protect,
  authorizePermission,
} = require("../middleware/authMiddleware");

const {
  initializePayment,
  verifyPayment,
  recordManualPayment,
  getAllPayments,
  getPaymentById,
  getPayments,
} = require("../controllers/paymentController");

const router = express.Router();

// Paystack online payments
router.post("/initialize/:billID", protect, authorizePermission("payment:create"), initializePayment);
router.get("/verify/:reference", protect, authorizePermission("billing:view"), verifyPayment);

// Manual payments received by clinic staff
router.post(
  "/manual/:billID",
  protect,
  authorizePermission("billing:create"),
  recordManualPayment,
);

// Payment records
router.get("/", protect, authorizePermission("billing:view"), getAllPayments);
router.get(
  "/patient/:patientID",
  protect,
  authorizePermission("billing:view"),
  getPayments,
);
router.get(
  "/:id",
  protect,
  authorizePermission("billing:view"),
  getPaymentById,
);

module.exports = router;
