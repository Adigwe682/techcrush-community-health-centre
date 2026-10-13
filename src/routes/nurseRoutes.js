const express = require("express");
const router = express.Router();
const { gettriageQueue, getfullpatientHistory, saveTriageDraft, completeAndSendPatientToDoctor } = require("../controllers/nurseController");
const { protect } = require("../middleware/authMiddleware"); //I wrote the code myself byt the AI assist thing said I should add this even though I'm not sure what it is

router.use(protect); // Applies auth to all routes below

router.get("/triage-queue", gettriageQueue);
router.get("/patient-history/:patientId", getfullpatientHistory);
router.post("/save-triage-draft", saveTriageDraft);   
router.post("/complete-triage", completeAndSendPatientToDoctor);


module.exports = router;