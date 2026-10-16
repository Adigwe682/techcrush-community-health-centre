const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");

// ======================================================
// LOGIN
// ======================================================

const login = async (req, res) => {
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

const createStaff = async (req, res) => {
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

const updateAccountStatus = async (req, res) => {
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
// PUBLIC REGISTRATION (WITH ROLE SELECTION)
// ======================================================

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "First name, last name, email, and password are required",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists",
      });
    }

    let userRole;

    if (role) {
      // Look up role by Name (e.g. "Doctor", "Admin", "Nurse") OR by ID
      const isObjectId = mongoose.Types.ObjectId.isValid(role);
      userRole = await Role.findOne({
        $or: [{ name: role }, ...(isObjectId ? [{ _id: role }] : [])],
      });

      if (!userRole) {
        return res.status(404).json({ message: `Role '${role}' not found` });
      }
    } else {
      // Fallback to default "patient" role if no role was provided
      userRole = await Role.findOne({ name: "patient" });
      if (!userRole) {
        userRole = await Role.create({
          name: "patient",
          description: "Standard Patient Account",
          permissions: [],
        });
      }
    }

    // Create user account
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: userRole._id,
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: userRole.name,
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

const logout = async (req, res) => {
  res.status(200).json({
    message: "Logout successful. Please remove the authentication token.",
  });
};


// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
  login,
  register,
  createStaff,
  updateAccountStatus,
  logout,
};