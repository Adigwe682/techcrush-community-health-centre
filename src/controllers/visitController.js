const Visit = require("../models/Visit").default;

// Create a new visit
const createVisit = async (req, res) => {
  try {
    const { patient, appointment, visitType, createdBy } = req.body;

    const visit = await Visit.create({
      patient,
      appointment: appointment || null,
      visitType,
      createdBy,
      checkedInAt: new Date(),
    });

    res.status(201).json({
      message: "Visit created successfully",
      visit,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create visit",
      error: error.message,
    });
  }
};

// Get all visits
const getAllVisits = async (req, res) => {
  try {
    const visits = await Visit.find();

    res.status(200).json({
      visits,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch visits",
      error: error.message,
    });
  }
};

// Get one visit
const getVisitById = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        message: "Visit not found",
      });
    }

    res.status(200).json({
      visit,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch visit",
      error: error.message,
    });
  }
};

// Update visit status
const updateVisitStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!visit) {
      return res.status(404).json({
        message: "Visit not found",
      });
    }

    res.status(200).json({
      message: "Visit status updated successfully",
      visit,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update visit status",
      error: error.message,
    });
  }
};

module.exports = {
  createVisit,
  getAllVisits,
  getVisitById,
  updateVisitStatus,
};
