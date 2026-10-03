const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const clinicalRoutes = require("./routes/clinicalRoutes");
dotenv.config();

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());


// ======================================================
// ROUTES
// ======================================================

app.use("/api/auth", authRoutes);
app.use("/api/clinical",  clinicalRoutes);
app.get("/", (req, res) => {
  res.json({
    message: "Community Health Centre API is running",
  });
});


// ======================================================
// MONGODB CONNECTION
// ======================================================

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });