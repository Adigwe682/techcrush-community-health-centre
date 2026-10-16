const express = require("express");
const {
  protect,
} = require("../middleware/authMiddleware");

const {
  createBill,
  getAllBills,
  getBillById,
  getBills,
  updateBill,
  deleteBill,
} = require("../controllers/billController");

const router = express.Router();

// Temporarily bypassed permission checks for testing
router.post("/", protect, createBill);

router.get("/", protect, getAllBills);
router.get("/search", protect, getBills);
router.get("/:id", protect, getBillById);

router.put("/:id", protect, updateBill);
router.delete("/:id", protect, deleteBill);

module.exports = router;