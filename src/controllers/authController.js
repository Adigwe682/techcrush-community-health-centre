import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./userModel.js"; // Adjust path if your User/userModel file is located elsewhere
import Role from "../models/Role.js"; // Adjust path if needed

// ======================================================
// LOGIN
// ======================================================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user and load their role
    const user = await User.findOne({ email }).populate("role");

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is inactive",
      });
    }

    // Compare entered password with hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // Send successful response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ======================================================
// CREATE STAFF ACCOUNT
// ======================================================

export const createStaff = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
    } = req.body;

    // Check required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists",
      });
    }

    // Check if selected role exists
    const selectedRole = await Role.findById(role);

    if (!selectedRole) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    // Create staff account
    // Password will automatically be hashed
    // by the User model before saving
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    res.status(201).json({
      message: "Staff account created successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ======================================================
// ACTIVATE / DEACTIVATE STAFF ACCOUNT
// ======================================================

export const updateAccountStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Make sure isActive is actually true or false
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false",
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Update account status
    user.isActive = isActive;

    await user.save();

    res.status(200).json({
      message: isActive
        ? "Account activated successfully"
        : "Account deactivated successfully",

      user: {
        id: user._id,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ======================================================
// LOGOUT
// ======================================================

export const logout = async (req, res) => {
  res.status(200).json({
    message: "Logout successful. Please remove the authentication token.",
  });
};