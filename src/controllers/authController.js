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
 * @desc    Register a new user (Supports optional role selection)
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // 1. Check if required fields are provided
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Please provide firstName, lastName, email, and password.",
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // 3. Resolve User Role (Case-Insensitive Match)
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
      // Fallback to default "patient" role (case-insensitive search or auto-creation)
      userRole = await Role.findOne({ name: { $regex: /^patient$/i } });

      if (!userRole) {
        userRole = await Role.create({
          name: "patient",
          description: "Standard Patient Account",
          permissions: [],
        });
      }
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create and save new user
    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole._id,
    });

    // 6. Generate JWT Token
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
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password." });
    }

    // Find user by email and populate role details
    const user = await User.findOne({ email: email.toLowerCase() }).populate("role");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare passwords
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
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      message: "Server error fetching user profile",
      error: error.message,
    });
  }
};