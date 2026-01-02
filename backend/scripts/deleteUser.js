const mongoose = require("mongoose");
require("dotenv").config({ path: "backend/config/config.env" });
const User = require("../models/userModel");

// Get mobile number or email from command line arguments
const identifier = process.argv[2]; // mobile number or email

if (!identifier) {
  console.error("❌ Please provide a mobile number or email to delete.");
  console.log("Usage: node backend/scripts/deleteUser.js <mobile_or_email>");
  console.log("Example: node backend/scripts/deleteUser.js +919624099204");
  console.log("Example: node backend/scripts/deleteUser.js user@example.com");
  process.exit(1);
}

const deleteUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ Connected to database\n");

    // Find user by mobile or email
    let user;
    if (identifier.includes("@")) {
      // It's an email
      user = await User.findOne({ email: identifier.toLowerCase() });
    } else {
      // It's a mobile number - format it
      const cleaned = identifier.replace(/^\+91/, "").replace(/\s/g, "");
      const formatted = `+91${cleaned}`;
      user = await User.findOne({ mobileNumber: formatted });
    }

    if (!user) {
      console.log(`❌ User not found with identifier: ${identifier}`);
      await mongoose.connection.close();
      process.exit(1);
    }

    // Prevent deleting admin users
    if (user.role === "admin") {
      console.log("❌ Cannot delete admin user!");
      console.log(`   User: ${user.firstName} ${user.lastName} (${user.email})`);
      await mongoose.connection.close();
      process.exit(1);
    }

    // Display user info before deletion
    console.log("📋 User to be deleted:");
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.firstName} ${user.middleName || ""} ${user.lastName}`.trim());
    console.log(`   Email: ${user.email}`);
    console.log(`   Mobile: ${user.mobileNumber}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Created: ${user.createdAt}\n`);

    // Delete user
    await User.findByIdAndDelete(user._id);

    console.log("✅ User deleted successfully!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
deleteUser();

