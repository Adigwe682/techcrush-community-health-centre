const express = require("express");
const useRoute = express.Router();
const { gettriageQueue, getfullpatientHistory, saveTriageDraft, completeAndSendPatientToDoctor } = require("../controllers/nurseController");
const { authenticateUser } = require("../middleware/authMiddleware");


useRoute.get("/triage-queue", authenticateUser, gettriageQueue);
useRoute.get("/patient-history/:patientId", authenticateUser, getfullpatientHistory);
useRoute.post("/save-triage-draft", authenticateUser, saveTriageDraft);   
useRoute.post("/complete-triage", authenticateUser, completeAndSendPatientToDoctor);


module.exports = useRoute