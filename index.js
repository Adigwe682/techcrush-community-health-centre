import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import 'dotenv/config';
import patientRoute from "./routes/patientRoute.js";
import doctorRoute from "./routes/doctorRoute.js";
import nurseRoute from "./routes/nurseRoute.js";
import adminRoute from "./routes/adminRoute.js";

const app = express();
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

app.use(express.json());
app.use(cors());

// CORS middleware

// const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:4000'];
// app.use(cors({
//     origin: function (origin, callback) {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PATCH', 'DELETE'],
//     allowedHeaders:  ['Content-Type', 'Authorization'],
// }));

app.get("/", (req, res) => {
    res.send("API is Active");
})

app.use("/patients", patientRoute);
app.use("/doctors", doctorRoute);
app.use("/nurses", nurseRoute);
app.use("/admin", adminRoute);

// Start accepting requests only after the database connection succeeds.
const startServer = async () => {
  try {
    if (!mongoUri) {
      throw new Error("Set MONGODB_URI or MONGO_URI in your environment");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exitCode = 1;
  }
};

startServer();