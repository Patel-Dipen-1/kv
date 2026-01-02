const mongoose = require("mongoose");
require("dotenv").config({ path: "backend/config/config.env" });
const User = require("../models/userModel");

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ Connected to database\n");

    const collection = mongoose.connection.db.collection("users");

    // Get all indexes
    console.log("📋 Current Indexes:");
    const indexes = await collection.indexes();
    indexes.forEach((idx, i) => {
      console.log(`${i + 1}. ${JSON.stringify(idx.key)} - Unique: ${idx.unique || false}`);
    });

    // Drop duplicate indexes if they exist
    console.log("\n🔧 Fixing indexes...");
    
    try {
      // Drop the duplicate email index (keep the one from schema)
      await collection.dropIndex("email_1");
      console.log("✅ Dropped duplicate email index");
    } catch (e) {
      if (e.code !== 27) { // 27 = index not found
        console.log("ℹ️  Email index: " + e.message);
      }
    }

    try {
      // Drop the duplicate mobileNumber index (keep the one from schema)
      await collection.dropIndex("mobileNumber_1");
      console.log("✅ Dropped duplicate mobileNumber index");
    } catch (e) {
      if (e.code !== 27) { // 27 = index not found
        console.log("ℹ️  Mobile index: " + e.message);
      }
    }

    // Recreate indexes from schema
    await User.createIndexes();
    console.log("✅ Recreated indexes from schema\n");

    // Show final indexes
    console.log("📋 Final Indexes:");
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((idx, i) => {
      console.log(`${i + 1}. ${JSON.stringify(idx.key)} - Unique: ${idx.unique || false}`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Index fix complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

fixIndexes();

