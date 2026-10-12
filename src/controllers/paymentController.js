const Bill = require("../models/Bill");
const Payment = require("../models/Payment");

const PAYSTACK_URL = "https://api.paystack.co";

const getRemainingBalance = (bill) =>
  Math.max(0, Number((bill.totalAmount - bill.amountPaid).toFixed(2)));

const getBillStatus = (bill) => {
  if (bill.amountPaid >= bill.totalAmount) return "paid";
  if (bill.amountPaid > 0) return "partially_paid";
  return "unpaid";
};

// Initialize an online Paystack payment.
const initializePayment = async (req, res) => {
  try {
    const { billID } = req.params;
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "A valid email address is required for Paystack.",
      });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        message: "Paystack is not configured on the server.",
      });
    }

    const bill = await Bill.findById(billID);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found." });
    }

    const remaining = getRemainingBalance(bill);

    if (remaining <= 0) {
      return res.status(400).json({ message: "This bill is already paid." });
    }

    const amountInKobo = Math.round(remaining * 100);

    const response = await fetch(`${PAYSTACK_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        metadata: {
          billID: String(bill._id),
          patientID: String(bill.patientID),
          expectedAmountKobo: amountInKobo,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      return res.status(502).json({
        message: "Could not initialize Paystack payment.",
      });
    }

    return res.status(200).json({
      message: "Payment initialized successfully.",
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid bill ID." });
    }

    return res.status(500).json({
      message: "Failed to initialize payment.",
      error: error.message,
    });
  }
};

// Verify a Paystack transaction before recording it.
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        message: "Paystack is not configured on the server.",
      });
    }

    // Avoid recording the same transaction twice.
    const existingPayment = await Payment.findOne({
      transactionReference: reference,
    });

    if (existingPayment) {
      return res.status(200).json({
        message: "This transaction has already been recorded.",
        payment: existingPayment,
      });
    }

    // Verify the transaction directly with Paystack.
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
      return res.status(502).json({
        message: "Could not verify the Paystack transaction.",
      });
    }

    const transaction = result.data;
    const metadata = transaction.metadata || {};

    if (transaction.status !== "success") {
      return res.status(400).json({
        message: "The transaction was not successful.",
      });
    }

    const billID = metadata.billID;
    const expectedAmountKobo = Number(metadata.expectedAmountKobo);

    if (
      !billID ||
      !Number.isSafeInteger(expectedAmountKobo) ||
      expectedAmountKobo <= 0 ||
      transaction.amount !== expectedAmountKobo ||
      transaction.currency !== "NGN"
    ) {
      return res.status(400).json({
        message: "Transaction details could not be validated.",
      });
    }

    const bill = await Bill.findById(billID);

    if (!bill) {
      return res.status(404).json({
        message: "Associated bill not found.",
      });
    }

    const amount = Number((transaction.amount / 100).toFixed(2));
    const remaining = getRemainingBalance(bill);

    if (amount <= 0 || amount > remaining) {
      return res.status(409).json({
        message: "Payment exceeds the remaining bill balance.",
      });
    }

    const newAmountPaid = Number((bill.amountPaid + amount).toFixed(2));
    const newStatus =
      newAmountPaid >= bill.totalAmount ? "paid" : "partially_paid";

    // Record the verified transaction. The unique reference helps
    // prevent the same Paystack transaction from being recorded twice.
    const payment = await Payment.create({
      billID: bill._id,
      patientID: bill.patientID,
      amount,
      paymentMethod: "online",
      status: "successful",
      transactionReference: reference,
      paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
    });

    try {
      // Update only if the bill balance has not changed.
      const updatedBill = await Bill.findOneAndUpdate(
        {
          _id: bill._id,
          amountPaid: bill.amountPaid,
          totalAmount: bill.totalAmount,
        },
        {
          $inc: { amountPaid: amount },
          $set: { status: newStatus },
        },
        { new: true, runValidators: true },
      );

      if (!updatedBill) {
        await Payment.deleteOne({ _id: payment._id });

        return res.status(409).json({
          message:
            "The bill changed during verification. Please review the transaction before retrying.",
        });
      }

      return res.status(200).json({
        message: "Payment verified and recorded successfully.",
        payment,
        bill: updatedBill,
      });
    } catch (error) {
      // Attempt to remove the payment record if the bill update fails.
      await Payment.deleteOne({ _id: payment._id });
      throw error;
    }
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid bill ID.",
      });
    }

    if (error.code === 11000) {
      const existingPayment = await Payment.findOne({
        transactionReference: req.params.reference,
      });

      if (existingPayment) {
        return res.status(200).json({
          message: "This transaction has already been recorded.",
          payment: existingPayment,
        });
      }
    }

    return res.status(500).json({
      message: "Failed to verify payment.",
      error: error.message,
    });
  }
};

// Record a payment received directly by authorized clinic staff.
const recordManualPayment = async (req, res) => {
  try {
    const { billID } = req.params;
    const { amount, paymentMethod } = req.body;
    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0 ||
      !["cash", "bank_transfer", "card"].includes(paymentMethod)
    ) {
      return res.status(400).json({
        message: "Provide a positive amount and a valid manual payment method.",
      });
    }

    const bill = await Bill.findById(billID);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found." });
    }

    const remaining = getRemainingBalance(bill);

    if (paymentAmount > remaining) {
      return res.status(400).json({
        message: "Payment cannot exceed the remaining bill balance.",
        remainingBalance: remaining,
      });
    }

    // Create a pending record first, then update the bill safely.
    const payment = await Payment.create({
      billID: bill._id,
      patientID: bill.patientID,
      amount: paymentAmount,
      paymentMethod,
      status: "pending",
      transactionReference: `MANUAL-${require("crypto").randomUUID()}`,
    });

    const updatedBill = await Bill.findOneAndUpdate(
      {
        _id: bill._id,
        amountPaid: bill.amountPaid,
        totalAmount: bill.totalAmount,
      },
      { $inc: { amountPaid: paymentAmount } },
      { new: true, runValidators: true },
    );

    if (!updatedBill) {
      await Payment.findByIdAndUpdate(payment._id, { status: "failed" });

      return res.status(409).json({
        message: "The bill changed. Please refresh and try again.",
      });
    }

    updatedBill.status = getBillStatus(updatedBill);
    await updatedBill.save();

    payment.status = "successful";
    payment.paidAt = new Date();
    await payment.save();

    return res.status(201).json({
      message: "Manual payment recorded successfully.",
      payment,
      bill: updatedBill,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid bill ID." });
    }

    return res.status(500).json({
      message: "Failed to record payment.",
      error: error.message,
    });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("patientID")
      .populate("billID")
      .sort({ createdAt: -1 });

    return res.status(200).json({ payments });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve payments.",
      error: error.message,
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("patientID")
      .populate("billID");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    return res.status(200).json({ payment });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid payment ID." });
    }

    return res.status(500).json({
      message: "Failed to retrieve payment.",
      error: error.message,
    });
  }
};

const getPayments = async (req, res) => {
  try {
    const filter = {};

    if (req.params.patientID) {
      filter.patientID = req.params.patientID;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod;
    }

    const payments = await Payment.find(filter)
      .populate("billID")
      .sort({ createdAt: -1 });

    return res.status(200).json({ payments });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid patient ID." });
    }

    return res.status(500).json({
      message: "Failed to filter payments.",
      error: error.message,
    });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  recordManualPayment,
  getAllPayments,
  getPaymentById,
  getPayments,
};
