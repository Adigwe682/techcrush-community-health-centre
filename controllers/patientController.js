import Patient from "../models/patientModel.js";

export const createPatientProfile = async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, phone, address, bloodGroup, gender, allergies, bodyWeight, height } = req.body;

        const newPatient = await Patient.create({
            firstName,
            lastName,
            dateOfBirth,
            phone,
            address,
            bloodGroup,
            gender,
            allergies,
            bodyWeight,
            height
        })
        return res.status(201).json({
            message: "Patient created successfully",
            data: newPatient
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const getAllPatientProfiles = async (req, res) => {
    try {
        const getPatients = await Patient.find();

        return res.status(200).json({
            message: "Patients fetched successfully",
            data: getPatients
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
}

export const getPatientById = async (req, res) => {
    try {
        const {id} = req.params
        const getPatient = await Patient.findById(id);

        if (!getPatient) {
            return res.status(404).json({
                message: "Patient not found"
            })
        }
        return res.status(200).json({
            message: "Patient fetched successfully",
            data: getPatient
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const updatePatient = async (req, res) => {
    try {
        const {id} = req.params
        const {firstName, lastName, dateOfBirth, phone, address, bloodGroup, gender, allergies, bodyWeight, height} = req.body;

        const updatedPatient = await Patient.findByIdAndUpdate(id, {
            firstName,
            lastName,
            dateOfBirth,
            phone,
            address,
            bloodGroup,
            gender,
            allergies,
            bodyWeight,
            height
        }, { new: true })

        if (!updatedPatient) {
            return res.status(404).json({
                message: "Patient not found"
            })
        }

        return res.status(200).json({
            message: "Patient updated successfully",
            data: updatedPatient
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const deletePatient = async (req, res) => {
    try {
        const {id} = req.params
        const deletedPatient = await Patient.findByIdAndDelete(id);

        if (!deletedPatient) {
            return res.status(404).json({
                message: "Patient not found"
            })
        }
        return res.status(200).json({
            message: "Patient deleted successfully",
            data: deletedPatient
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};
