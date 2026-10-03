import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import 'dotenv/config';
import patientRoute from "./routes/patientRoute.js";



const atlas_String = process.env.MONGODB_URI

mongoose.connect(atlas_String)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("Error connecting to MongoDB:", err));


const app = express();
const port = process.env.PORT || 4000;

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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})