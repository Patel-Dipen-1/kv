/**
 * Script to verify and fix admin role permissions
 * This ensures admin role has ALL permissions enabled
 * Usage: node backend/scripts/verifyAdminPermissions.js
 */

require("dotenv").config({ path: "backend/config/config.env" });
const mongoose = require("mongoose");
const Role = require("../models/roleModel");
const { getAllPermissionKeys, createDefaultPermissions } = require("../constants/permissions");

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URI)
    .then((data) => {
      console.log(`✅ MongoDB connected: ${data.connection.host}`);
    })
    .catch((err) => {
      console.error("❌ Database connection error:", err.message);
      process.exit(1);
    });
};

const verifyAndFixAdminRole = async () => {
  try {
    console.log("\n🔍 Checking admin role permissions...\n");
    
    // Get admin role
    const adminRole = await Role.findOne({ roleKey: "admin" });
    
    if (!adminRole) {
      console.log("❌ Admin role not found!");
      console.log("   Please run: node backend/scripts/testAllFunctions.js first");
      process.exit(1);
    }
    
    console.log(`✅ Admin role found: ${adminRole.roleName}`);
    console.log(`   Current permissions count: ${Object.keys(adminRole.permissions).length}`);
    
    // Get all available permissions
    const allPermissionKeys = getAllPermissionKeys();
    console.log(`   Total available permissions: ${allPermissionKeys.length}\n`);
    
    // Check which permissions are missing
    const missingPermissions = [];
    const disabledPermissions = [];
    
    allPermissionKeys.forEach((key) => {
      if (!(key in adminRole.permissions)) {
        missingPermissions.push(key);
      } else if (adminRole.permissions[key] === false) {
        disabledPermissions.push(key);
      }
    });
    
    // Show current status
    const enabledCount = adminRole.getEnabledPermissions().length;
    console.log(`📊 Current Status:`);
    console.log(`   ✅ Enabled: ${enabledCount}`);
    console.log(`   ❌ Disabled: ${disabledPermissions.length}`);
    console.log(`   ⚠️  Missing: ${missingPermissions.length}`);
    
    if (missingPermissions.length > 0) {
      console.log(`\n⚠️  Missing permissions:`);
      missingPermissions.forEach((key) => {
        console.log(`   - ${key}`);
      });
    }
    
    if (disabledPermissions.length > 0) {
      console.log(`\n⚠️  Disabled permissions:`);
      disabledPermissions.forEach((key) => {
        console.log(`   - ${key}`);
      });
    }
    
    // Fix admin role - set ALL permissions to true
    if (missingPermissions.length > 0 || disabledPermissions.length > 0) {
      console.log(`\n🔧 Fixing admin role...`);
      
      // Get all permission keys
      const allPermissionKeys = getAllPermissionKeys();
      
      // Set ALL permissions to true for admin (using Map methods)
      allPermissionKeys.forEach((key) => {
        adminRole.permissions.set(key, true);
      });
      
      // Mark permissions as modified
      adminRole.markModified("permissions");
      
      await adminRole.save();
      
      console.log(`✅ Admin role updated!`);
      console.log(`   All ${Object.keys(adminRole.permissions).length} permissions are now enabled`);
    } else {
      console.log(`\n✅ Admin role already has all permissions enabled!`);
    }
    
    // Show final status
    const finalEnabled = adminRole.getEnabledPermissions().length;
    console.log(`\n📊 Final Status:`);
    console.log(`   ✅ Enabled permissions: ${finalEnabled}`);
    console.log(`   📋 Total permissions: ${Object.keys(adminRole.permissions).length}`);
    
    // List all enabled permissions
    console.log(`\n📋 All Admin Permissions:`);
    const enabledPerms = adminRole.getEnabledPermissions();
    enabledPerms.forEach((key) => {
      console.log(`   ✅ ${key}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

// Helper function to check if permission is valid
const isValidPermission = (key) => {
  return getAllPermissionKeys().includes(key);
};

connectDatabase();
setTimeout(() => {
  verifyAndFixAdminRole();
}, 2000);

