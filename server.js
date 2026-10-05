import express from "express";
import appointmentRoutes from "./appointmentRoutes.js";

const app = express();

const PORT = 6868;

//Middleware for reading JSON
app.use(express.json());

//Appointment Routes
app.use("/api/appointments", appointmentRoutes);

// Basic route for testing
app.get("/appointments", (req, res) => {
    res.send("Welcome to the Appointment Booking API");
});

//Start server
app.listen(PORT, () => {
    console.log(
        `Community health center API is running on http://localhost:${PORT}`);
    });