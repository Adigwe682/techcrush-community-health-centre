import Nurse from "../models/nurseModel.js";


export const createNurseProfile = async (req, res) => {
    try {
        const { firstName, lastName, licenseNumber, qualification} = req.body;

        if (!firstName || !lastName || !licenseNumber || !qualification) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const newNurse = await Nurse.create({
            firstName,
            lastName,
            licenseNumber,
            qualification
        })

        return res.status(201).json({
            message: "Nurse profile created successfully",
            data: newNurse
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const getAllNursesProfile = async (req, res) => {
    try {
        const getNurses = await Nurse.find();

        return res.status(200).json({
            message: "Nurses profiles fetched successfully",
            data: getNurses
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const getNurseProfileById = async (req, res) => {
    try {
        const {id} = req.params
        const getNurse = await Nurse.findById(id);

        if (!getNurse) {
            return res.status(404).json({
                message: "Nurse profile not found"
            })
        }
        return res.status(200).json({
            message: "Nurse profile fetched successfully",
            data: getNurse
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const updateNurseProfile = async (req, res) => {
    try {
        const {id} = req.params
        const {firstName, lastName, licenseNumber, qualification} = req.body;

        const updatedNurse = await Nurse.findByIdAndUpdate(id, {
            firstName,
            lastName,
            licenseNumber,
            qualification

        }, {new: true})
        return res.status(200).json({
            message: "Nurse profile updated successfully",
            data: updatedNurse
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const deleteNurseProfile = async (req, res) => {
    try {
        const {id} = req.params
        const deletedNurse = await Nurse.findByIdAndDelete(id);

        if (!deletedNurse) {
            return res.status(404).json({
                message: "Nurse profile not found"
            })
        }
        return res.status(200).json({
            message: "Nurse profile deleted successfully",
            data: deletedNurse
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};