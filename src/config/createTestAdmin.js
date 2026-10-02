require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const Role = require("../models/Role");

const createTestAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminRole = await Role.findOne({ name: "Admin" });

    if (!adminRole) {
      throw new Error("Admin role not found");
    }

    const existingAdmin = await User.findOne({
      email: "admin@test.com",
    });

    if (existingAdmin) {
      console.log("Test Admin already exists");
      await mongoose.disconnect();
      return;
    }

    const admin = await User.create({
      firstName: "Test",
      lastName: "Admin",
      email: "admin@test.com",
      password: "Admin123!",
      role: adminRole._id,
    });

    console.log("Test Admin created successfully");
    console.log("Email: admin@test.com");
    console.log("Password: Admin123!");
    console.log("User ID:", admin._id);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed:", error.message);
    await mongoose.disconnect();
  }
};

createTestAdmin();