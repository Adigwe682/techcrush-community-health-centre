const nurseModel = require('../models/nurseModel');
const visitModel = require('../models/visitModel');
const patientModel = require('../models/patientModel');
const patientHistoryModel = require('../models/PatientHistory');

const gettriageQueue = async (req, res) => {
    try {
        const triageQueue = await nurseModel.find({ completedAt: null }).populate('patient').populate('visit');    
        return res.status(200).json({ message: "Triage queue retrieved successfully", data: triageQueue });

    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve triage queue." });
        }
};

const getfullpatientHistory = async (req, res) => {
    try {
            const { patientId } = req.params;
            const patient = await patientModel.findById(patientId);
        if (!patient) {
        return res.status(404).json({ message: "Patient not found." });
        }
        
        const patientHistory = await patientHistoryModel.find({patient: patientId,});
        const previousTriageRecords = await nurseModel.find({ patient: patientId }).populate("visit");
        return res.status(200).json({
        message: "Here is the patient history you currently have access to.",patient,patientHistory,previousTriageRecords,});
    
    }catch (error) {
        return res.status(500).json({
        message: "Failed to retrieve patient history.",
        error: error.message,
        });
    }
};


const saveTriageDraft = async (req, res) => {
  try {
    const nurseId = req.user?.userId;
    const { patient, visit, vitals, observations, nursingNotes, triage } = req.body;

    if (!patient || !visit) {
      return res.status(400).json({message: "Patient ID and Visit ID are required to save a draft.",});
    }

    // Check if a draft triage record already exists for this visit
    let triageRecord = await nurseModel.findOne({ visit });

    if (triageRecord) {
      if (vitals) triageRecord.vitals = { ...triageRecord.vitals, ...vitals };
      if (observations !== undefined) triageRecord.observations = observations;
      if (nursingNotes !== undefined) triageRecord.nursingNotes = nursingNotes;
      if (triage !== undefined) triageRecord.triage = triage;
      triageRecord.status = "Draft";

      await triageRecord.save();
    } else {
        // Create new draft triage record
      triageRecord = await nurseModel.create({nurse: nurseId, patient, visit, vitals, observations, nursingNotes,
        triage: triage || "Green",
        status: "Draft",
        completedAt: null,
      });
    }
    // Update visit status to reflect active triage in progress
    await visitModel.findByIdAndUpdate(visit, { status: "in-progress" });

    return res.status(200).json({
      message: "Triage draft saved successfully.",
      data: triageRecord,
    });
    
  } catch (error) {
    return res.status(500).json({
      message: "Failed to save triage draft.",
      error: error.message,
    });
  }
};


const completeAndSendPatientToDoctor = async (req, res) => {
    try {
        const nurseId = req.user?.userId;
        const { vitals, observations, nursingNotes, triage, patient, visit } = req.body;

        if (!patient || !visit) {
            return res.status(400).json({ message: "Visit ID and Patient ID are required." });
        }
        
        if(!vitals || !vitals.bloodPressure || !vitals.heartRate || !vitals.height || !vitals.weight || !vitals.bodyTemperature || !vitals.OxygenSaturation){
            return res.status(400).json({ message: "All vitals must be recorded before sending the patient to the doctor.",
            });
        }
        
        if(!observations || !nursingNotes){
            return res.status(400).json({ message: "Observations and nursing notes must be recorded before sending the patient to the doctor." })
        }
        
        if(!triage){
            return res.status(400).json({ message: "Triage level must be recorded before sending the patient to the doctor." });
        }
        
        let triageRecord = await nurseModel.findOne({ visit });

        if (triageRecord) {triageRecord.vitals = vitals;
            triageRecord.observations = observations;
            triageRecord.nursingNotes = nursingNotes;
            triageRecord.triage = triage;
            triageRecord.status = "Completed";
            triageRecord.completedAt = new Date();
            await triageRecord.save();
        } else {
            triageRecord = await nurseModel.create({nurse: nurseId,patient,visit,vitals,observations,nursingNotes,triage,status: "Completed",completedAt: new Date(),});
        }

        await visitModel.findByIdAndUpdate(visit, { status: "ready-for-doctor" });

        return res.status(200).json({
            message:"Patient has been successfully sent to the doctor for further evaluation and treatment.",
            data: triageRecord,
        });

    } catch (error) {
        return res.status(500).json({
        message: "Failed to complete triage.",
        error: error.message,
        });
    }
};

module.exports = {
    gettriageQueue,
    getfullpatientHistory,
    saveTriageDraft,
    completeAndSendPatientToDoctor
};