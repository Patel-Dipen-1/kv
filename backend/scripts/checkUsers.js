const mongoose = require("mongoose");
require("dotenv").config({ path: "backend/config/config.env" });
const User = require("../models/userModel");

const checkUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ Connected to database\n");

    // Get all users
    const users = await User.find().select("-password -passwordResetToken -passwordResetExpires").sort({ createdAt: -1 });

    console.log(`📊 Total Users: ${users.length}\n`);

    if (users.length === 0) {
      console.log("No users found in database.");
      await mongoose.connection.close();
      process.exit(0);
    }

    // Display users
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User Details:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.firstName} ${user.middleName || ""} ${user.lastName}`.trim());
      console.log(`   Email: ${user.email}`);
      console.log(`   Mobile: ${user.mobileNumber}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt}`);
    });

    // Check for duplicates
    const emails = users.map(u => u.email.toLowerCase());
    const mobiles = users.map(u => u.mobileNumber);
    
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    const duplicateMobiles = mobiles.filter((mobile, index) => mobiles.indexOf(mobile) !== index);

    if (duplicateEmails.length > 0) {
      console.log(`\n⚠️  Duplicate Emails Found: ${[...new Set(duplicateEmails)].join(", ")}`);
    }
    if (duplicateMobiles.length > 0) {
      console.log(`\n⚠️  Duplicate Mobile Numbers Found: ${[...new Set(duplicateMobiles)].join(", ")}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
checkUsers();

