import express from "express";
import mongoose from "mongoose";
import patientRoute from "./route/PatientRoute.js";

const app = express();
const port = 3333;

const compass_string = "mongodb://localhost:27017/darby";

const atlas_string = "mongodb+srv://darbychic26_db_user:darby@cluster0.ntc6c3h.mongodb.net/?appName=Cluster0";

import dns from 'dns'
dns.setServers(['8.8.8.8', '8.8.4.4']);

app.use(express.json());

app.use("/", patientRoute);

mongoose.connect(atlas_string)
    .then(() => {
        console.log("Connected to MongoDB");

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB:", error);
    });






    