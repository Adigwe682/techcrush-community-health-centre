const express = require("express");
const {
  protect,
  authorizePermission,
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

router.post("/", protect, authorizePermission("billing:create"), createBill);

router.get("/", protect, authorizePermission("billing:view"), getAllBills);
router.get("/search", protect, authorizePermission("billing:view"), getBills);
router.get("/:id", protect, authorizePermission("billing:view"), getBillById);

router.put("/:id", protect, authorizePermission("billing:create"), updateBill);
router.delete("/:id", protect, authorizePermission("billing:create"), deleteBill);
module.exports = router;
