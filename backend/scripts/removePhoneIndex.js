const mongoose = require("mongoose");
require("dotenv").config({ path: "backend/config/config.env" });

const removePhoneIndex = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ Connected to database\n");

    const collection = mongoose.connection.db.collection("users");

    // Drop the old "phone" index
    try {
      await collection.dropIndex("phone_1");
      console.log("✅ Dropped old 'phone' index");
    } catch (e) {
      if (e.code === 27) {
        console.log("ℹ️  'phone' index not found (already removed)");
      } else {
        console.log("⚠️  Error dropping phone index:", e.message);
      }
    }

    // Show final indexes
    console.log("\n📋 Final Indexes:");
    const indexes = await collection.indexes();
    indexes.forEach((idx, i) => {
      console.log(`${i + 1}. ${JSON.stringify(idx.key)} - Unique: ${idx.unique || false}`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Done! Try registering again now.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

removePhoneIndex();

