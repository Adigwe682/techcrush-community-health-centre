
const Patient = require("../models/Patient");
const PatientHistory = require("../models/PatientHistory");

const registerPatient = async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      gender,
      address,
      phoneNumber,
      nextOfKin,
      religion,
    } = req.body;

    const existingPatient = await Patient.findOne({
      name,
      dateOfBirth,
      phoneNumber,
    });

    if (existingPatient) {
      return res.status(409).json({
        message: "Patient may already be registered",
      });
    }

    const patient = await Patient.create({
      name,
      dateOfBirth,
      gender,
      address,
      phoneNumber,
      nextOfKin,
      religion,
    });

    return res.status(201).json({
      message: "Patient registered successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error registering patient",
      error: error.message,
    });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find();

    return res.status(200).json({
      message: "Patients retrieved successfully",
      data: patients,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving patients",
      error: error.message,
    });
  }
};

const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({ data: patient });
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving patient",
      error: error.message,
    });
  }
};

const searchPatient = async (req, res) => {
  try {
    const { name, dateOfBirth, phoneNumber } = req.query;
    const filters = {};

    if (name) filters.name = { $regex: name, $options: "i" };
    if (dateOfBirth) filters.dateOfBirth = dateOfBirth;
    if (phoneNumber) filters.phoneNumber = phoneNumber;

    const patients = await Patient.find(filters);

    return res.status(200).json({
      message: "Patient search completed",
      data: patients,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error searching patients",
      error: error.message,
    });
  }
};

const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({
      message: "Patient updated successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating patient",
      error: error.message,
    });
  }
};

const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({
      message: "Patient deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting patient",
      error: error.message,
    });
  }
};

const createPatientHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const history = await PatientHistory.create({
      ...req.body,
      patient: req.params.id,
    });

    return res.status(201).json({
      message: "Patient history created successfully",
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating patient history",
      error: error.message,
    });
  }
};

const getPatientHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const history = await PatientHistory.find({
      patient: req.params.id,
    });

    return res.status(200).json({
      message: "Patient history retrieved successfully",
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving patient history",
      error: error.message,
    });
  }
};

const updatePatientHistory = async (req, res) => {
  try {
    const history = await PatientHistory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!history) {
      return res.status(404).json({
        message: "Patient history not found",
      });
    }

    return res.status(200).json({
      message: "Patient history updated successfully",
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating patient history",
      error: error.message,
    });
  }
};

const deletePatientHistory = async (req, res) => {
  try {
    const history = await PatientHistory.findByIdAndDelete(req.params.id);

    if (!history) {
      return res.status(404).json({
        message: "Patient history not found",
      });
    }

    return res.status(200).json({
      message: "Patient history deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting patient history",
      error: error.message,
    });
  }
};

module.exports = {
  registerPatient,
  getAllPatients,
  getPatientProfile,
  searchPatient,
  updatePatient,
  deletePatient,
  getPatientHistory,
  createPatientHistory,
  updatePatientHistory,
  deletePatientHistory,
};
