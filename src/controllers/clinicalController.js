const ClinicalEncounter = require("../models/ClinicalEncounter");

// ======================================================
// CREATE CLINICAL ENCOUNTER
// ======================================================

const createClinicalEncounter = async (req, res) => {
  try {
    const {
      patient,
      visit,
      chiefComplaint,
      clinicalNotes,
      diagnosis,
      prescriptions,
      followUp,
    } = req.body;

    // FIX: Fallback to support both req.user.id (from JWT) and req.user.userId
    const doctorId = req.user.id || req.user.userId;

    if (!doctorId) {
      return res.status(401).json({ 
        message: "Unauthorized: Doctor ID missing from authentication token" 
      });
    }

    const encounter = await ClinicalEncounter.create({
      patient,
      visit,
      doctor: doctorId,
      chiefComplaint,
      clinicalNotes,
      diagnosis,
      prescriptions,
      followUp,
    });

    res.status(201).json({
      message: "Clinical encounter created successfully",
      encounter,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create clinical encounter",
      error: error.message,
    });
  }
};


// ======================================================
// GET SINGLE CLINICAL ENCOUNTER
// ======================================================

const getClinicalEncounter = async (req, res) => {
  try {
    const encounter = await ClinicalEncounter.findById(req.params.id)
      .populate("doctor", "-password")
      .populate("patient")
      .populate("visit");

    if (!encounter) {
      return res.status(404).json({
        message: "Clinical encounter not found",
      });
    }

    res.status(200).json({
      encounter,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get clinical encounter",
      error: error.message,
    });
  }
};


// ======================================================
// GET PATIENT CLINICAL HISTORY
// ======================================================

const getPatientClinicalHistory = async (req, res) => {
  try {
    const encounters = await ClinicalEncounter.find({
      patient: req.params.patientId,
    })
      .populate("doctor", "-password")
      .populate("visit")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: encounters.length,
      encounters,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get patient clinical history",
      error: error.message,
    });
  }
};


// ======================================================
// ADD DIAGNOSIS
// ======================================================

const addDiagnosis = async (req, res) => {
  try {
    const { condition, notes } = req.body;

    if (!condition) {
      return res.status(400).json({
        message: "Diagnosis condition is required",
      });
    }

    const encounter = await ClinicalEncounter.findById(req.params.id);

    if (!encounter) {
      return res.status(404).json({
        message: "Clinical encounter not found",
      });
    }

    if (encounter.status === "completed") {
      return res.status(400).json({
        message: "Cannot add diagnosis to a completed encounter",
      });
    }

    encounter.diagnosis.push({
      condition,
      notes,
    });

    await encounter.save();

    res.status(200).json({
      message: "Diagnosis added successfully",
      encounter,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add diagnosis",
      error: error.message,
    });
  }
};


// ======================================================
// ADD PRESCRIPTION
// ======================================================

const addPrescription = async (req, res) => {
  try {
    const {
      medication,
      dosage,
      frequency,
      duration,
      instructions,
    } = req.body;

    if (!medication || !dosage || !frequency || !duration) {
      return res.status(400).json({
        message: "Medication, dosage, frequency and duration are required",
      });
    }

    const encounter = await ClinicalEncounter.findById(req.params.id);

    if (!encounter) {
      return res.status(404).json({
        message: "Clinical encounter not found",
      });
    }

    if (encounter.status === "completed") {
      return res.status(400).json({
        message: "Cannot add prescription to a completed encounter",
      });
    }

    encounter.prescriptions.push({
      medication,
      dosage,
      frequency,
      duration,
      instructions,
    });

    await encounter.save();

    res.status(200).json({
      message: "Prescription added successfully",
      encounter,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add prescription",
      error: error.message,
    });
  }
};


// ======================================================
// UPDATE FOLLOW-UP
// ======================================================

const updateFollowUp = async (req, res) => {
  try {
    const {
      required,
      date,
      instructions,
    } = req.body;

    const encounter = await ClinicalEncounter.findById(req.params.id);

    if (!encounter) {
      return res.status(404).json({
        message: "Clinical encounter not found",
      });
    }

    if (encounter.status === "completed") {
      return res.status(400).json({
        message: "Cannot update follow-up for a completed encounter",
      });
    }

    encounter.followUp = {
      required,
      date,
      instructions,
    };

    await encounter.save();

    res.status(200).json({
      message: "Follow-up updated successfully",
      encounter,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update follow-up",
      error: error.message,
    });
  }
};


// ======================================================
// COMPLETE CLINICAL ENCOUNTER
// ======================================================

const completeClinicalEncounter = async (req, res) => {
  try {
    const encounter = await ClinicalEncounter.findById(req.params.id);

    if (!encounter) {
      return res.status(404).json({
        message: "Clinical encounter not found",
      });
    }

    if (encounter.status === "completed") {
      return res.status(400).json({
        message: "Clinical encounter is already completed",
      });
    }

    encounter.status = "completed";
    encounter.completedAt = new Date();

    await encounter.save();

    res.status(200).json({
      message: "Clinical encounter completed successfully",
      encounter,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to complete clinical encounter",
      error: error.message,
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createClinicalEncounter,
  getClinicalEncounter,
  getPatientClinicalHistory,
  addDiagnosis,
  addPrescription,
  updateFollowUp,
  completeClinicalEncounter,
};