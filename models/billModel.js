const mongoose = require("mongoose");


const billSchema = new mongoose.Schema({
  patientID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },

  visitID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Visit",
    required: true
  },

  items: [
    {
      type: {
        type: String,
        enum: ["service", "drug"],
        required: true
      },

      name: {
        type: String,
        required: true
      },

      quantity: {
        type: Number,
        default: 1
      },

      price: {
        type: Number,
        required: true
      },

      total: {
        type: Number,
        required: true
      }
    }
  ],

  totalAmount: {
    type: Number,
    required: true
  },

  amountPaid: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["unpaid", "partially_paid", "paid"],
    default: "unpaid"
  }

}, { timestamps: true });

const Bill = mongoose.model("Bill", billSchema);

export default Bill;