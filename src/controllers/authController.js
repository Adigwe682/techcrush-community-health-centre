const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Helper function to generate JWT Token
const generateToken = (userId, roleName) => {
  return jwt.sign(
    { id: userId, role: roleName },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "7d" }
  );
};

/**
 * @desc    Register a new user (Public)
 * @route   POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Please provide firstName, lastName, email, and password.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    let userRole;
    if (role) {
      const isObjectId = mongoose.Types.ObjectId.isValid(role);
      userRole = await Role.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${role.trim()}$`, "i") } }, // Case-insensitive match
          ...(isObjectId ? [{ _id: role }] : []),
        ],
      });

      if (!userRole) {
        return res.status(404).json({ message: `Role '${role}' not found in database.` });
      }
    } else {
      userRole = await Role.findOne({ name: { $regex: /^patient$/i } });
      if (!userRole) {
        userRole = await Role.create({
          name: "patient",
          description: "Standard Patient Account",
          permissions: [],
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole._id,
    });

    const token = generateToken(newUser._id, userRole.name);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: userRole.name,
      },
    });
  } catch (error) {
    console.error("Error in registration:", error);
    return res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password." });
    }

    // Explicitly select password since it's hidden by default in Mongoose schemas
    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password")
      .populate("role");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const roleName = user.role ? user.role.name : "patient";
    const token = generateToken(user._id, roleName);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleName,
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
};

/**
 * @desc    Create a staff member (Protected + permission check)
 * @route   POST /api/auth/staff
 */
exports.createStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        message: "Please provide firstName, lastName, email, password, and role.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(role);
    const userRole = await Role.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${role.trim()}$`, "i") } },
        ...(isObjectId ? [{ _id: role }] : []),
      ],
    });

    if (!userRole) {
      return res.status(404).json({ message: `Role '${role}' not found.` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole._id,
    });

    return res.status(201).json({
      message: "Staff member created successfully",
      staff: {
        id: newStaff._id,
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        email: newStaff.email,
        role: userRole.name,
      },
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    return res.status(500).json({
      message: "Server error creating staff",
      error: error.message,
    });
  }
};

/**
 * @desc    Activate or Deactivate staff account status
 * @route   PATCH /api/auth/staff/:userId/status
 */
exports.updateAccountStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "Please provide a boolean value for isActive." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({
      message: `User account status updated successfully to ${isActive ? "Active" : "Inactive"}`,
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating account status:", error);
    return res.status(500).json({
      message: "Server error updating account status",
      error: error.message,
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({
      message: "Server error during logout",
      error: error.message,
    });
  }
};