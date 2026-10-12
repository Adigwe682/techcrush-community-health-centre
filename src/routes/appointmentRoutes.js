const express = require("express");
const {
    createAppointment,
    getAppointments,
    getDailyAppointments,
    rescheduleAppointment,
    cancelAppointment,
    checkInAppointment,
    markNoShow,
    getAppointmentStatus
} = require("../controllers/appointmentController");

const router = express.Router();

router.get("/daily", getDailyAppointments);
router.get("/status/:status", getAppointmentStatus);
router.get("/", getAppointments);
router.post("/", createAppointment);
router.patch("/:id/reschedule", rescheduleAppointment);
router.patch("/:id/cancel", cancelAppointment);
router.patch("/:id/checkin", checkInAppointment);
router.patch("/:id/noshow", markNoShow);

module.exports = router;