const mongoose = require("mongoose");
require("dotenv").config({ path: "backend/config/config.env" });
const User = require("../models/userModel");

const checkAllMobiles = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ Connected to database\n");

    // Get ALL users with their mobile numbers
    const users = await User.find({}, { mobileNumber: 1, email: 1, firstName: 1, lastName: 1, _id: 1, status: 1 }).sort({ createdAt: -1 });

    console.log(`📊 Total Users: ${users.length}\n`);

    if (users.length === 0) {
      console.log("No users found.");
    } else {
      console.log("All Mobile Numbers in Database:");
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.mobileNumber} - ${user.firstName} ${user.lastName} (${user.email}) - Status: ${user.status}`);
      });
    }

    // Check specifically for the problematic mobile
    const targetMobile = "+919624099204";
    const cleaned = targetMobile.replace(/^\+91/, "").replace(/\s/g, "");
    const formatted = `+91${cleaned}`;

    console.log(`\n🔍 Checking for: ${targetMobile} (formatted: ${formatted})`);
    
    // Try multiple search patterns
    const patterns = [
      { mobileNumber: targetMobile },
      { mobileNumber: formatted },
      { mobileNumber: cleaned },
      { mobileNumber: { $regex: cleaned, $options: "i" } },
    ];

    for (const pattern of patterns) {
      const found = await User.findOne(pattern);
      if (found) {
        console.log(`✅ Found with pattern:`, pattern);
        console.log(`   User: ${found.firstName} ${found.lastName} - ${found.email}`);
        break;
      }
    }

    // Also check MongoDB directly
    const collection = mongoose.connection.db.collection("users");
    const allDocs = await collection.find({}).toArray();
    console.log(`\n📋 Raw MongoDB documents: ${allDocs.length}`);
    allDocs.forEach((doc, idx) => {
      console.log(`${idx + 1}. Mobile: ${doc.mobileNumber || "N/A"} - Email: ${doc.email || "N/A"}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

checkAllMobiles();

