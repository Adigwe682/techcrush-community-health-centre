const express = require("express");

const {
  addToQueue,
  getQueue,
  getQueueById,
  callPatient,
  startService,
  completeQueue,
  cancelQueue,
} = require("../controllers/queueController");

const router = express.Router();

// Add a visit to the queue
router.post("/", addToQueue);

// Get all queue entries
router.get("/", getQueue);

// Get one queue entry
router.get("/:id", getQueueById);

// Call a patient
router.patch("/:id/call", callPatient);

// Start service
router.patch("/:id/start", startService);

// Complete queue entry
router.patch("/:id/complete", completeQueue);

// Cancel queue entry
router.patch("/:id/cancel", cancelQueue);

module.exports = router;