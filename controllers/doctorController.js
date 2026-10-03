import Doctor from "../models/doctorModel.js";

export const createDoctorProfile = async (req, res) => {
    try {
        const { firstName, lastName, licenseNumber, specialization} = req.body;

        if (!firstName || !lastName || !licenseNumber || !specialization) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const newDoctor = await Doctor.create({
            firstName,
            lastName,
            licenseNumber,
            specialization
        })

        return res.status(201).json({
            message: "Doctor profile created successfully",
            data: newDoctor
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const getAllDoctorsProfile = async (req, res) => {
    try {
        const getDoctors = await Doctor.find();

        return res.status(200).json({
            message: "Doctors profiles fetched successfully",
            data: getDoctors
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const getDoctorProfileById = async (req, res) => {
    try {
        const {id} = req.params
        const getDoctor = await Doctor.findById(id);

        if (!getDoctor) {
            return res.status(404).json({
                message: "Doctor profile not found"
            })
        }
        return res.status(200).json({
            message: "Doctor profile fetched successfully",
            data: getDoctor
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const updateDoctorProfile = async (req, res) => {
    try {
        const {id} = req.params
        const {firstName, lastName, licenseNumber, specialization} = req.body;

        const updatedDoctor = await Doctor.findByIdAndUpdate(id, {
            firstName,
            lastName,
            licenseNumber,
            specialization

        }, {new: true})
        return res.status(200).json({
            message: "Doctor profile updated successfully",
            data: updatedDoctor
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const deleteDoctorProfile = async (req, res) => {
    try {
        const {id} = req.params
        const deletedDoctor = await Doctor.findByIdAndDelete(id);

        if (!deletedDoctor) {
            return res.status(404).json({
                message: "Doctor profile not found"
            })
        }
        return res.status(200).json({
            message: "Doctor profile deleted successfully",
            data: deletedDoctor
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
}