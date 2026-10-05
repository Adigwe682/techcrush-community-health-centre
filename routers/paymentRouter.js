
const express = require("express");

const {
  initializePayment,
  verifyPayment,
  paystackWebhook,
  getAllPayments,
  getPaymentById,
  getPayments,
  updatePayment,
  deletePayment
} = require("../controllers/paymentController.js");

const router = express.Router();

// 1. initialization of  payment
// note: this route is for initializing payment, not for verifying it
//note:it accept a POST request with the following params: { billID}
router.post("/initialize/:billID",initializePayment);

// 2. Paystack sends payment confirmation using webhook
// since this route is for receiving webhook from paystack, it should be a POST request 
// with the following body: { event, data }
router.post( "/webhook",express.raw({ type: "application/json" }), paystackWebhook);

// router.post("/paystack/webhook", paystackWebhook);

// 3.verify payment
// note:it takes a path parameter 'reference' which is the transaction reference
//  returned by paystack after initializing payment
router.get("/verifyPayment/:reference",verifyPayment)

//4 getallpayment 
// note: it returns all payments in the database
router.get("/allPayments", getAllPayments);

//5 get payment by id
// note: it takes a path parameter 'id' which is the payment id
router.get("/getPaymentById/:id", getPaymentById);

//6 get payments using infomation provided
// note: it takes a path parameter 'patientID' which is the patient id
router.get("/getPayments/:patientID", getPayments);

//7 update payment
// note: it takes a path parameter 'id' which is the payment id
// and a body with the following fields: { billID, patientID, amount, paymentMethod, status, transactionReference, paidAt }
router.put("/updatePayment/:id", updatePayment);

//8 delete payment
// note: it takes a path parameter 'id' which is the payment id
router.delete("/deletePayment/:id", deletePayment);



export default router;