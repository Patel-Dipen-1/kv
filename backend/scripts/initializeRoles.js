/**
 * Script to initialize default system roles
 * Run this once after setting up the database
 * Usage: node backend/scripts/initializeRoles.js
 */

require("dotenv").config({ path: "backend/config/config.env" });
const mongoose = require("mongoose");
const { initializeSystemRoles } = require("../controllers/roleController");

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URI)
    .then((data) => {
      console.log(`Mongodb connected with server: ${data.connection.host}`);
    })
    .catch((err) => {
      console.error("Database connection error:", err);
      process.exit(1);
    });
};

const initializeRoles = async () => {
  try {
    console.log("Connecting to database...");
    connectDatabase();

    // Wait a bit for connection
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Initializing system roles...");
    const roles = await initializeSystemRoles();

    console.log(`\n✅ Successfully initialized ${roles.length} system roles:`);
    roles.forEach((role) => {
      const enabledCount = role.getEnabledPermissions().length;
      console.log(`  - ${role.roleName} (${enabledCount} permissions enabled)`);
    });

    console.log("\n✅ Role initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing roles:", error);
    process.exit(1);
  }
};

// Run the script
initializeRoles();

