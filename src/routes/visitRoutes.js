const express = require("express");

const {
  createVisit,
  getAllVisits,
  getVisitById,
  updateVisitStatus,
} = require("../controllers/visitController");

const router = express.Router();

// Create a visit
router.post("/", createVisit);

// Get all visits
router.get("/", getAllVisits);

// Get one visit
router.get("/:id", getVisitById);

// Update visit status
router.patch("/:id/status", updateVisitStatus);

module.exports = router;