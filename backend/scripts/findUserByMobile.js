const mongoose = require("mongoose");
require("dotenv").config({ path: "backend/config/config.env" });
const User = require("../models/userModel");

// Get mobile number from command line arguments
const mobileNumber = process.argv[2];

if (!mobileNumber) {
  console.error("❌ Please provide a mobile number to search.");
  console.log("Usage: node backend/scripts/findUserByMobile.js <mobile_number>");
  console.log("Example: node backend/scripts/findUserByMobile.js +919624099204");
  process.exit(1);
}

const findUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ Connected to database\n");

    // Format mobile number
    const cleaned = mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
    const formatted = `+91${cleaned}`;
    
    console.log(`🔍 Searching for mobile: ${formatted}\n`);

    // Try different search patterns
    const searches = [
      { mobileNumber: formatted },
      { mobileNumber: cleaned },
      { mobileNumber: mobileNumber },
    ];

    let found = false;
    for (const search of searches) {
      const user = await User.findOne(search).select("-password -passwordResetToken -passwordResetExpires");
      if (user) {
        found = true;
        console.log("✅ User Found:");
        console.log(`   ID: ${user._id}`);
        console.log(`   Name: ${user.firstName} ${user.middleName || ""} ${user.lastName}`.trim());
        console.log(`   Email: ${user.email}`);
        console.log(`   Mobile: ${user.mobileNumber}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.createdAt}`);
        break;
      }
    }

    if (!found) {
      console.log("❌ No user found with this mobile number.");
      console.log("   This mobile number should be available for registration.");
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
findUser();

