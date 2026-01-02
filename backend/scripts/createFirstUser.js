const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "backend/config/config.env" });
const User = require("../models/userModel");

const createFirstUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ Connected to database");

    // Check if any admin user exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("\n⚠️  Admin user already exists!");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Mobile: ${existingAdmin.mobileNumber}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // First user data - MODIFY THESE VALUES AS NEEDED
    const plainPassword = "Admin@123"; // Change this password
    const firstUserData = {
      firstName: "Dipen",
      lastName: "Nareshbhai",
      email: "dnpatel2002@gmail.com",
      mobileNumber: "+916359585125", // Change this to your mobile number
      password: "Dipu@2002",
      address: {
        line1: "Admin Address",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pincode: "400001",
      },
      occupationType: "job",
      occupationTitle: "Administrator",
      maritalStatus: "single",
      role: "admin",
      status: "approved", // Auto-approve first admin
      isActive: true,
    };

    // Create user using new User() and save() to properly trigger hooks
    const user = new User(firstUserData);
    await user.save();

    console.log("\n✅ First admin user created successfully!");
    console.log("\n📋 User Details:");
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Mobile: ${user.mobileNumber}`);
    console.log(`   Password: ${plainPassword} (Please change this after first login)`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log("\n⚠️  IMPORTANT: Please change the password after first login!");
    console.log("\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating first user:", error.message);
    if (error.code === 11000) {
      console.error("User with this email or mobile already exists!");
    }
    console.error("Full error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
createFirstUser();

