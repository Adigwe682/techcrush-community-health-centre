const Bill = require("../models/Bill");

const createBill = async (req, res) => {
  try {
    const { patientID, visitID, items } = req.body;

    if (!patientID || !visitID || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message:
          "Patient ID, visit ID, and at least one bill item are required.",
      });
    }

    for (const item of items) {
      if (
        !["service", "drug"].includes(item.type) ||
        !item.name ||
        !Number.isInteger(Number(item.quantity ?? 1)) ||
        Number(item.quantity ?? 1) < 1 ||
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) < 0
      ) {
        return res.status(400).json({
          message:
            "Each item must have a valid type, name, quantity, and price.",
        });
      }
    }

    const billItems = items.map((item) => ({
      type: item.type,
      name: item.name,
      quantity: Number(item.quantity ?? 1),
      price: Number(item.price),
      total: Number(item.quantity ?? 1) * Number(item.price),
    }));

    const totalAmount = billItems.reduce((sum, item) => sum + item.total, 0);

    const bill = await Bill.create({
      patientID,
      visitID,
      items: billItems,
      totalAmount,
      amountPaid: 0,
      status: "unpaid",
    });

    return res.status(201).json({
      message: "Bill created successfully.",
      bill,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid bill data.",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create bill.",
      error: error.message,
    });
  }
};

const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate("patientID")
      .populate("visitID")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bills });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve bills.",
      error: error.message,
    });
  }
};

const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("patientID")
      .populate("visitID");

    if (!bill) {
      return res.status(404).json({ message: "Bill not found." });
    }

    return res.status(200).json({ bill });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid bill ID." });
    }

    return res.status(500).json({
      message: "Failed to retrieve bill.",
      error: error.message,
    });
  }
};

const getBills = async (req, res) => {
  try {
    const filter = {};

    if (req.query.patientID) filter.patientID = req.query.patientID;
    if (req.query.visitID) filter.visitID = req.query.visitID;
    if (req.query.status) filter.status = req.query.status;

    const bills = await Bill.find(filter)
      .populate("patientID")
      .populate("visitID")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bills });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid patient or visit ID." });
    }

    return res.status(500).json({
      message: "Failed to filter bills.",
      error: error.message,
    });
  }
};

const updateBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found." });
    }

    if (bill.amountPaid > 0) {
      return res.status(400).json({
        message: "A bill with recorded payments cannot be edited.",
      });
    }

    const { patientID, visitID, items } = req.body;

    if (patientID !== undefined) bill.patientID = patientID;
    if (visitID !== undefined) bill.visitID = visitID;

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          message: "Provide at least one valid bill item.",
        });
      }

      for (const item of items) {
        if (
          !["service", "drug"].includes(item.type) ||
          !item.name ||
          !Number.isInteger(Number(item.quantity ?? 1)) ||
          Number(item.quantity ?? 1) < 1 ||
          !Number.isFinite(Number(item.price)) ||
          Number(item.price) < 0
        ) {
          return res.status(400).json({
            message:
              "Each item must have a valid type, name, quantity, and price.",
          });
        }
      }

      bill.items = items.map((item) => ({
        type: item.type,
        name: item.name,
        quantity: Number(item.quantity ?? 1),
        price: Number(item.price),
        total: Number(item.quantity ?? 1) * Number(item.price),
      }));

      bill.totalAmount = bill.items.reduce((sum, item) => sum + item.total, 0);
    }

    bill.status =
      bill.amountPaid >= bill.totalAmount
        ? "paid"
        : bill.amountPaid > 0
          ? "partially_paid"
          : "unpaid";

    await bill.save();

    return res.status(200).json({
      message: "Bill updated successfully.",
      bill,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid bill data.",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update bill.",
      error: error.message,
    });
  }
};

const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found." });
    }

    if (bill.amountPaid > 0) {
      return res.status(400).json({
        message: "A bill with recorded payments cannot be deleted.",
      });
    }

    await Bill.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Bill deleted successfully.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid bill ID." });
    }

    return res.status(500).json({
      message: "Failed to delete bill.",
      error: error.message,
    });
  }
};

module.exports = {
  createBill,
  getAllBills,
  getBillById,
  getBills,
  updateBill,
  deleteBill,
};
