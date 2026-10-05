const Bill = require("../models/billModel.js");
//create a bill record 

const asynchandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const createBill = asynchandler(async (req, res) => {
    
    const { patientID, visitID, items } = req.body;

    const updatedItems = items.map((item) => ({
      type: item.type,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price
    }));

    const totalAmount = updatedItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const bill = await Bill.create({
      patientID,
      visitID,
      items: updatedItems,
      totalAmount,
      amountPaid: 0,
      status: "unpaid"
    });

    res.status(201).json({
      message: "Bill created successfully",
      document:bill
    });})

// get all bills
export const getAllBills = asynchandler(async (req, res) => {
  const bills = await Bill.find()//.populate("patientID visitID");
  res.status(200).json({message: "Bills retrieved successfully", documents: bills});
});

// get single bill by id
export const getBillById = asynchandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id)//.populate("patientID visitID");

  if (!bill) {
    return res.status(404).json({
      message: "Bill record not found"
    });
  }

  res.status(200).json({message: "Bill retrieved successfully", document: bill});
});
// Get bills based on any information provided

export const getBills = asynchandler(async (req, res) => {
  const {
    patientID,
    createdAt,
    totalAmount,
    amountPaid,
    status
  } = req.query;

  const filter = {};

  if (patientID) filter.patientID = patientID;
  if (visitID) filter.visitID = visitID;
  if (totalAmount) filter.totalAmount = Number(totalAmount);
  if (amountPaid) filter.amountPaid = Number(amountPaid);
  if (status) filter.status = status;

  const bills = await Bill.find(filter)//.populate("patientID visitID");

  if (bills.length === 0) {
    return res.status(404).json({
      message: "No bill records found"
    });
  }

  return res.status(200).json({
    message: "Bills found successfully",
    bills
  });
});

// update bill 
export const updateBill = asynchandler(async (req, res) => {

    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bill) {
      return res.status(404).json({
        message: "Bill record not found"
      });
    }

    res.status(200).json({
      message: "Bill updated successfully",
      bill
    });})

// delete bill record 
export const deleteBill = asynchandler(async (req, res) => {
  const bill = await Bill.findByIdAndDelete(req.params.id);

  if (!bill) {
    return res.status(404).json({
      message: "Bill record not found"
    });
  }

  return res.status(200).json({
    message: "Bill deleted successfully",
    bill
  });
});
 
  

