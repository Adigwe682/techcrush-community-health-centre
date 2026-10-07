const Queue = require("../models/Queue").default;
const Visit = require("../models/Visit").default;

// Add a visit to the queue
const addToQueue = async (req, res) => {
  try {
    const { visit, priority } = req.body;

    // Find the visit
    const existingVisit = await Visit.findById(visit);

    if (!existingVisit) {
      return res.status(404).json({
        message: "Visit not found",
      });
    }

    // Check if the visit is already in the queue
    const alreadyInQueue = await Queue.findOne({ visit });

    if (alreadyInQueue) {
      return res.status(400).json({
        message: "This visit is already in the queue",
      });
    }

    // Find the latest queue number
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const latestQueue = await Queue.findOne({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({
      queueNumber: -1,
    });

    const queueNumber = latestQueue ? latestQueue.queueNumber + 1 : 1;

    // Create queue entry
    const queueEntry = await Queue.create({
      visit: existingVisit._id,
      patient: existingVisit.patient,
      queueNumber,
      priority: priority || "normal",
    });

    res.status(201).json({
      message: "Patient added to queue successfully",
      queueEntry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add patient to queue",
      error: error.message,
    });
  }
};

// Get all queue entries
const getQueue = async (req, res) => {
  try {
    const queue = await Queue.find()
      .populate("patient")
      .populate("visit")
      .sort({
        priority: -1,
        queueNumber: 1,
      });

    res.status(200).json({
      queue,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch queue",
      error: error.message,
    });
  }
};

// Get one queue entry
const getQueueById = async (req, res) => {
  try {
    const queueEntry = await Queue.findById(req.params.id)
      .populate("patient")
      .populate("visit");

    if (!queueEntry) {
      return res.status(404).json({
        message: "Queue entry not found",
      });
    }

    res.status(200).json({
      queueEntry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch queue entry",
      error: error.message,
    });
  }
};

// Call a patient
const callPatient = async (req, res) => {
  try {
    const queueEntry = await Queue.findByIdAndUpdate(
      req.params.id,
      {
        status: "called",
        calledAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!queueEntry) {
      return res.status(404).json({
        message: "Queue entry not found",
      });
    }

    res.status(200).json({
      message: "Patient called successfully",
      queueEntry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to call patient",
      error: error.message,
    });
  }
};

// Start service
const startService = async (req, res) => {
  try {
    const queueEntry = await Queue.findByIdAndUpdate(
      req.params.id,
      {
        status: "in-service",
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!queueEntry) {
      return res.status(404).json({
        message: "Queue entry not found",
      });
    }

    // Also update the visit status
    await Visit.findByIdAndUpdate(queueEntry.visit, {
      status: "in-progress",
    });

    res.status(200).json({
      message: "Service started successfully",
      queueEntry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to start service",
      error: error.message,
    });
  }
};

// Complete queue entry
const completeQueue = async (req, res) => {
  try {
    const queueEntry = await Queue.findByIdAndUpdate(
      req.params.id,
      {
        status: "completed",
        completedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!queueEntry) {
      return res.status(404).json({
        message: "Queue entry not found",
      });
    }

    // Also mark the visit as completed
    await Visit.findByIdAndUpdate(queueEntry.visit, {
      status: "completed",
      completedAt: new Date(),
    });

    res.status(200).json({
      message: "Queue entry completed successfully",
      queueEntry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to complete queue entry",
      error: error.message,
    });
  }
};

// Cancel queue entry
const cancelQueue = async (req, res) => {
  try {
    const queueEntry = await Queue.findByIdAndUpdate(
      req.params.id,
      {
        status: "cancelled",
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!queueEntry) {
      return res.status(404).json({
        message: "Queue entry not found",
      });
    }

    // Also cancel the visit
    await Visit.findByIdAndUpdate(queueEntry.visit, {
      status: "cancelled",
    });

    res.status(200).json({
      message: "Queue entry cancelled successfully",
      queueEntry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel queue entry",
      error: error.message,
    });
  }
};

module.exports = {
  addToQueue,
  getQueue,
  getQueueById,
  callPatient,
  startService,
  completeQueue,
  cancelQueue,
};
