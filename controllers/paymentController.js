const crypto = require("crypto");

const nodemailer = require("nodemailer");

const Bill = require("../models/billModel.js");

const Payment = require("../models/paymentModel.js");

const dotenv = require("dotenv");

dotenv.config();

const asynchandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);}


// PAY INITIALIZATION

export const initializePayment = asynchandler(async (req, res) => {

  const { billID } = req.params;

  // Find the bill
  const bill = await Bill.findById(billID);

  if (!bill) {
    return res.status(404).json({
      message: "Bill record not found"
    });
  }

  // Calculate remaining amount
  const remainingAmount = bill.totalAmount - bill.amountPaid;

  if (remainingAmount <= 0) {
    return res.status(400).json({
      message: "This bill has already been fully paid"
    });
  }

  // Create a unique reference for this payment
  const reference = `PAY-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  /*// Get patient email
  const patient = await bill.populate("patientID");*/

  const email = 'Chinaecheremudobuzor@gmail.com';//patient.patientID.email;

  if (!email) {
    return res.status(400).json({
      message: "Patient email not found"
    });
  }

  // Send payment request to Paystack
  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email: email,
        amount: remainingAmount * 100,
        currency: "NGN",

        //reference: reference,

        metadata: {
          billId: bill._id.toString(),
          //patientId: patient.patientID.toString()
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    return res.status(400).json({
      message: data.message || "Payment initialization failed"
    });
  }


  return res.status(200).json({
    message: "Payment initialized successfully",

    authorization_url: data.data.authorization_url,

    transactionReference: data.data.reference

  });})

//PAYMENT VERIFICATION

export const verifyPayment = asynchandler(async (req, res) => {

  const { reference } = req.params;

  if (!reference) {
    return res.status(400).json({
      message: "Payment reference is required"
    });
  }

  // Ask Paystack about the transaction
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    return res.status(400).json({
      message: data.message || "Payment verification failed"
    });
  }

  // Get the actual transaction information
  const transaction = data.data;

  // Make sure Paystack says the payment was successful
  if (transaction.status !== "success") {
    return res.status(400).json({
      message: "Payment was not successful",
      status: transaction.status
    });
  }

  // Get information we stored in Paystack metadata
  const billID = transaction.metadata.billID;

  if (!billID || !patientID) {
    return res.status(400).json({
      message: "Payment metadata is missing"
    });
  }

  // Find the bill
  const bill = await Bill.findById(billID);

  if (!bill) {
    return res.status(404).json({
      message: "Bill record not found"
    });
  }

  // Paystack amount is in kobo, so convert to naira
  const paystackAmount = transaction.amount / 100;

  // Check that the amount paid is correct
  if (paystackAmount > bill.totalAmount - bill.amountPaid) {
    return res.status(400).json({
      message: "Payment amount is greater than the remaining bill amount"
    });
  }

  // Check if this reference has already been recorded
  const existingPayment = await Payment.findOne({
    reference: transaction.reference
  });

  if (existingPayment) {
    return res.status(200).json({
      message: "Payment has already been recorded",
      payment: existingPayment
    });
  }

  // NOW create the Payment record
  const payment = await Payment.create({
    patient: patientID,
    bill: bill._id,
    amount: paystackAmount,
    paymentMethod: transaction.channel,
    reference: transaction.reference,
    status: "successful",
    paidAt: new Date()
  });

  // Update the bill
  bill.amountPaid += paystackAmount;

  if (bill.amountPaid >= bill.totalAmount) {
    bill.status = "paid";
  }

  await bill.save();

  return res.status(200).json({
    message: "Payment verified and recorded successfully",
    payment,
    bill
  });
});




// PAYMENT WEBHOOK

export const paystackWebhook = asynchandler(async (req, res) => {
   console.log("🔥🔥🔥 PAYSTACK WEBHOOK ENTERED 🔥🔥🔥");

  // 1. Create our own signature
  console.log("STEP 1 - Creating signature");

  const hash = crypto
    .createHmac(
      "sha512",
      process.env.PAYSTACK_SECRET_KEY
    )
    .update(req.body)
    .digest("hex");


  // 2. Compare our signature with Paystack's signature
  console.log("STEP 2 - Comparing signatures");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.sendStatus(401);
  }


  // 3. Convert raw body into JavaScript object
  console.log("STEP 3 - Converting raw body to JavaScript object");
  const event = JSON.parse(req.body.toString());


  // 4. We only care about successful payments
  console.log("STEP 4 - Checking payment status");
  if (event.event !== "charge.success") {
    return res.sendStatus(200);
  }


  // 5. Get transaction information
  console.log("STEP 5 - Getting transaction information");
  const transaction = event.data;

  const reference = transaction.reference;


  // 6. Make sure Paystack says the payment was successful
  console.log("STEP 6 - Checking payment success");
  if (transaction.status !== "success") {
    return res.sendStatus(200);
  }


  // 7. Get the Bill ID and Patient ID
  console.log("STEP 7 - Getting Bill and Patient IDs");


 /* console.log("FULL TRANSACTION:");
  console.log(transaction);

  console.log("METADATA:");
  console.log(transaction.metadata);*/

  const billID = transaction.metadata?.billId;
 // const patientID = transaction.metadata?.patientID;


  if (!billID) {                                         ////|| !patientID
    return res.sendStatus(400);
  }


  // 8. Find the bill
  console.log("STEP 8 - Finding the bill");
  const bill = await Bill.findById(billID);

  if (!bill) {
    return res.sendStatus(404);
  }


  // 9. Check the amount Paystack says was paid
  console.log("STEP 9 - Checking payment amount");
  const paystackAmount = transaction.amount / 100;


  // Calculate how much is still owed
  const remainingAmount = bill.totalAmount - bill.amountPaid;


  // Make sure patient did not pay more than the remaining bill
  if (paystackAmount > remainingAmount) {
    return res.sendStatus(400);
  }


  // 10. Check whether this payment has already been recorded
  console.log("STEP 10 - Checking for existing payment");
  const existingPayment = await Payment.findOne({
    reference: reference
  });


  // If it already exists, don't create another Payment
  if (existingPayment) {
    return res.sendStatus(200);
  }


  // 11. NOW create the Payment record
  // because Paystack has confirmed SUCCESS
  console.log("STEP 11 - Creating payment record");
  const payment = await Payment.create({

    patientID:"68f2a7c91d4e6b3a8c5f1027", //patientID,

    billID: billID,

    amount: paystackAmount,

    paymentMethod: transaction.channel,

    reference: reference,

    status: "successful",

    paidAt: new Date()

  });


  // 12. Update the bill
  console.log("STEP 12 - Updating the bill");
  bill.amountPaid += paystackAmount;


  // 13. If the entire bill has been paid
  console.log("STEP 13 - Checking if bill is fully paid");
  if (bill.amountPaid >= bill.totalAmount) {
    bill.status = "paid";
  }


  // 14. Save the updated bill
  await bill.save();


  // 15. Send email to hospital admin
  console.log("STEP 15 - Sending email to hospital admin");
  const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
      user: process.env.ADMIN_EMAIL,

      pass: process.env.ADMIN_EMAIL_APP_PASSWORD
    }

  });

  console.log("PAYMENT CREATED:", payment);

  await transporter.sendMail({

    from: process.env.ADMIN_EMAIL,

    to: process.env.ADMIN_EMAIL,

    subject: "Hospital Payment Received",

    text: `
A patient has successfully paid a hospital bill.

Bill ID: ${bill._id}

Payment ID: ${payment._id}

Patient ID:68f2a7c91d4e6b3a8c5f1027                    //${patientID}

Amount Paid: ₦${payment.amount}

Payment Method: ${payment.paymentMethod}

Payment Reference: ${payment.reference}

Payment Status: Successful

Please check the hospital payment records.
    `

  });


  // 16. Tell Paystack we received the webhook
  return res.sendStatus(200);

});


// ======================================================
// GET ALL PAYMENTS
// ======================================================

export const getAllPayments = asynchandler(async (req, res) => {

  const payments = await Payment.find()
    //.populate("patient")
    //.populate("bill");

  return res.status(200).json({
    message: "Payments retrieved successfully",
    documents: payments
  });
});


// ======================================================
// GET PAYMENT BY ID
// ======================================================

export const getPaymentById = asynchandler(async (req, res) => {

  const payment = await Payment.findById(req.params.id).populate("billID")

    //.populate("patient")
    
  if (!payment) {
    return res.status(404).json({
      message: "Payment record not found"
    });
  }

  return res.status(200).json({
    message: "Payment retrieved successfully",
    document: payment
  });
});


// ======================================================
// GET PAYMENTS BASED ON INFORMATION PROVIDED
// ======================================================

export const getPayments = asynchandler(async (req, res) => {

  const {
    amount,
    paymentMethod,
    reference,
    status
  } = req.query;


  const filter = {};

  if (amount) {
    filter.amount = Number(amount);
  }

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  if (reference) {
    filter.reference = reference;
  }

  if (status) {
    filter.status = status;
  }


  const payments = await Payment.find(filter)
    // .populate("patient")
    .populate("bill");


  if (payments.length === 0) {
    return res.status(404).json({
      message: "No payment records found"
    });
  }


  return res.status(200).json({
    message: "Payments found successfully",
    payments
  });
});



// UPDATE PAYMENT


export const updatePayment = asynchandler(async (req, res) => {

  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!payment) {
    return res.status(404).json({
      message: "Payment record not found"
    });
  }

  return res.status(200).json({
    message: "Payment updated successfully",
    payment
  });
});


// ======================================================
// DELETE PAYMENT
// ======================================================

export const deletePayment = asynchandler(async (req, res) => {

  const payment = await Payment.findByIdAndDelete(
    req.params.id
  );

  if (!payment) {
    return res.status(404).json({
      message: "Payment record not found"
    });
  }

  return res.status(200).json({
    message: "Payment deleted successfully",
    payment
  });
});
