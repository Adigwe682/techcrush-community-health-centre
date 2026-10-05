const express = require("express");

const {
  createBill,
  getAllBills,
  getBillById,
  getBills,
  updateBill,
  deleteBill
} = require("../controllers/billController.js");

const router = express.Router();

router.post('/createBills', createBill);
router.get('/getAllBills', getAllBills);
router.get('/getBillsByID/:id', getBillById);
router.put('/updateBills/:id', updateBill);
router.delete('/deleteBills/:id', deleteBill);
router.get('/getBills', getBills);

export default router;