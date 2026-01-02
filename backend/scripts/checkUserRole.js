/**
 * Quick script to check a user's role and permissions
 * Usage: node backend/scripts/checkUserRole.js <email>
 */

require("dotenv").config({ path: "backend/config/config.env" });
const mongoose = require("mongoose");
const User = require("../models/userModel");
const Role = require("../models/roleModel");

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

const checkUser = async (email) => {
  try {
    await connectDatabase();
    
    console.log(`\n🔍 Checking user: ${email}\n`);
    
    const user = await User.findOne({ email: email.toLowerCase() }).populate("roleRef");
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    console.log(`✅ User found:`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Mobile: ${user.mobileNumber}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Role (legacy): ${user.role}`);
    console.log(`   RoleRef: ${user.roleRef ? user.roleRef._id : "NOT ASSIGNED"}`);
    
    if (!user.roleRef) {
      console.log(`\n❌ User has no role assigned!`);
      console.log(`   This is why permissions are not working.`);
      console.log(`\n   Solution: Run the test script to assign roles:`);
      console.log(`   node backend/scripts/testAllFunctions.js`);
      process.exit(1);
    }
    
    console.log(`\n📋 Role Details:`);
    console.log(`   Role Name: ${user.roleRef.roleName}`);
    console.log(`   Role Key: ${user.roleRef.roleKey}`);
    console.log(`   Is System Role: ${user.roleRef.isSystemRole}`);
    console.log(`   Is Active: ${user.roleRef.isActive}`);
    
    console.log(`\n🔐 Permissions:`);
    const permissions = user.roleRef.permissions;
    const enabledPerms = [];
    
    if (permissions instanceof Map) {
      permissions.forEach((value, key) => {
        if (value === true) {
          enabledPerms.push(key);
        }
      });
    } else if (typeof permissions === "object") {
      Object.keys(permissions).forEach((key) => {
        if (permissions[key] === true) {
          enabledPerms.push(key);
        }
      });
    }
    
    console.log(`   Total enabled: ${enabledPerms.length}`);
    console.log(`\n   Enabled permissions:`);
    enabledPerms.forEach((perm) => {
      console.log(`   ✅ ${perm}`);
    });
    
    // Check specific permission
    const hasCanApproveUsers = user.roleRef.hasPermission("canApproveUsers");
    console.log(`\n🔍 Checking canApproveUsers permission:`);
    console.log(`   Result: ${hasCanApproveUsers ? "✅ YES" : "❌ NO"}`);
    
    if (!hasCanApproveUsers) {
      console.log(`\n⚠️  This user cannot approve users!`);
      console.log(`   If this is an admin user, the role needs to be fixed.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

const email = process.argv[2];
if (!email) {
  console.log("Usage: node backend/scripts/checkUserRole.js <email>");
  console.log("Example: node backend/scripts/checkUserRole.js admin@test.com");
  process.exit(1);
}

setTimeout(() => {
  checkUser(email);
}, 2000);

