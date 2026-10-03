import Admin from "../models/adminModel.js";


export const createAdminProfile = async (req, res) => {
    try {
        const { firstName, lastName, permission} = req.body;

        if (!firstName || !lastName || !permission ) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const newAdmin = await Admin.create({
            firstName,
            lastName,
            permission
        })

        return res.status(201).json({
            message: "Admin profile created successfully",
            data: newAdmin
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const getAllAdminProfiles = async (req, res) => {
    try {
        const getAdmins = await Admin.find();

        return res.status(200).json({
            message: "Admins fetched successfully",
            data: getAdmins
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const getAdminProfileById = async (req, res) => {
    try {
        const {id} = req.params
        const getAdmin = await Admin.findById(id);

        if (!getAdmin) {
            return res.status(404).json({
                message: "Admin profile not found"
            })
        }
        return res.status(200).json({
            message: "Admin profile fetched successfully",
            data: getAdmin
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const updateAdminProfile = async (req, res) => {
    try {
        const {id} = req.params
        const {firstName, lastName, permission} = req.body;

        const updatedAdmin = await Admin.findByIdAndUpdate(id, {
            firstName,
            lastName,
            permission

        }, {new: true})
        return res.status(200).json({
            message: "Admin profile updated successfully",
            data: updatedAdmin
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
};

export const deleteAdminProfile = async (req, res) => {
    try {
        const {id} = req.params
        const deletedAdmin = await Admin.findByIdAndDelete(id);

        if (!deletedAdmin) {
            return res.status(404).json({
                message: "Admin profile not found"
            })
        }
        return res.status(200).json({
            message: "Admin profile deleted successfully",
            data: deletedAdmin
        })
    }catch (error) {
        return res.status(500).json({
            message: error.message || "internal server error"
        })
    }
}