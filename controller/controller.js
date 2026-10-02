import patientModel from '../model/patientModel.js';
import patientHistoryModel from '../model/PatientHistoryModel.js';

const registerPatient = async (req, res) => {
    try {
        const { name, dateOfBirth, gender, address, phoneNumber, nextOfKin, religion } = req.body;
        const existingPatient = await patientModel.findOne({ name, dateOfBirth, gender, address, phoneNumber, nextOfKin, religion });
        if (existingPatient) {
            return res.status(409).json({ message: 'Patient already exists' });
        }
        const newPatient = new patientModel({ name, dateOfBirth, gender, address, phoneNumber, nextOfKin, religion });
        await newPatient.save();
        return res.status(201).json({ message: 'Patient registered successfully', data: newPatient });
    } catch (error) {
        return res.status(500).json({ message: 'Error registering patient', error });
    }
};

const getAllPatients = async (req, res) => {
    try {
        const patients = await patientModel.find();
        return res.status(200).json({ message: 'Patients retrieved successfully', data: patients });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving patients', error });
    }
};

const getPatientProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await patientModel.findById(id);
        if (!patient) {
            return res.status(404).json({ message : "Patient not found"})
        }
        return res.status(200).json({ message : "patient profile", data : patient})
    }catch(error) {
        return res.status(500).json({ message: 'Error retrieving patient profile', error });
    }
};

const searchPatient = async (req, res) => {
    try {
        const { name,dateOfBirth, phoneNumber } = req.query;
        const searchParameters = {};
        if (name) searchParameters.name = name;
        if (dateOfBirth) searchParameters.dateOfBirth = dateOfBirth;
        if (phoneNumber) searchParameters.phoneNumber = phoneNumber;
        const patients = await patientModel.find(searchParameters);

        return res.status(200).json({ message: 'Patients retrieved successfully', data: patients });
    } catch (error) {
        return res.status(500).json({ message: 'Error searching patients', error });
    };
};

const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, dateOfBirth, gender, address, phoneNumber, nextOfKin, religion } = req.body;
        const updatePatient = await patientModel.findByIdAndUpdate(id, { name, dateOfBirth, gender, address, phoneNumber, nextOfKin, religion }, { new: true });
        if (!updatePatient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        return res.status(200).json({ message: 'Patient updated successfully', data: updatePatient });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating patient', error });
    }
};

const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const deletePatient = await patientModel.findByIdAndDelete(id);
        if (!deletePatient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        return res.status(200).json({ message: 'Patient deleted successfully'});
    }catch (error) {
        return res.status(500).json({ message: 'Error deleting patient', error });
    }
};

const createPatientHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { medicalHistory, medications, allergies, mainComplaint, dateOfVisit } = req.body;
        const patient = await patientModel.findById(id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        const newPatientHistory = new patientHistoryModel({ patient: id, medicalHistory, medications, allergies, mainComplaint, dateOfVisit });
        await newPatientHistory.save();
        return res.status(201).json({ message: 'Patient history added successfully', data: newPatientHistory });
    } catch (error) {
        return res.status(500).json({ message: 'Error adding patient history', error });
    }
};

const getPatientHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const patientHistory = await patientHistoryModel.find({ patient: id});
        if (patientHistory.length === 0) {
            return res.status(404).json({ message: 'Patient history not found' });
        }
        return res.status(200).json({ message: 'Patient history retrieved successfully', data: patientHistory });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving patient history', error });
    }
};



export default {
    registerPatient,
    getAllPatients,
    getPatientProfile,
    searchPatient,
    updatePatient,
    deletePatient,
    getPatientHistory,
    createPatientHistory
};
