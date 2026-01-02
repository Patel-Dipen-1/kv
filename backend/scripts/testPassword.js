/**
 * Quick script to test if password works for test users
 * Usage: node backend/scripts/testPassword.js
 */

require("dotenv").config({ path: "backend/config/config.env" });
const mongoose = require("mongoose");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1);
  }
};

const testPassword = async () => {
  try {
    await connectDatabase();
    
    const testPassword = "12345678";
    const testEmail = "admin@test.com";
    
    console.log(`\n🔍 Testing password for: ${testEmail}`);
    console.log(`   Expected password: ${testPassword}\n`);
    
    // Need to explicitly select password field since it has select: false
    const user = await User.findOne({ email: testEmail }).select("+password");
    
    if (!user) {
      console.log(`❌ User not found: ${testEmail}`);
      console.log("   Please run: node backend/scripts/testAllFunctions.js first");
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Mobile: ${user.mobileNumber}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Has password: ${user.password ? "Yes (hashed)" : "No"}`);
    
    if (!user.password) {
      console.log("\n❌ User has no password set!");
      console.log("   Solution: Run the test script again:");
      console.log("   node backend/scripts/testAllFunctions.js");
      process.exit(1);
    }
    
    // Test password comparison (same as login controller does)
    console.log("\n🔐 Testing password comparison (like login)...");
    const isMatch = await user.comparePassword(testPassword);
    
    if (isMatch) {
      console.log("✅ Password matches! Login should work.");
      
      // Test JWT token generation
      console.log("\n🔑 Testing JWT token generation...");
      const token = user.getJWTToken();
      if (token) {
        console.log("✅ JWT token generated successfully");
        console.log(`   Token length: ${token.length} characters`);
        console.log(`   Token preview: ${token.substring(0, 50)}...`);
      } else {
        console.log("❌ JWT token generation failed");
      }
    } else {
      console.log("❌ Password does NOT match!");
      console.log("\n   The password in database might be different.");
      console.log("   Let's check what password was used...");
      
      // Try to see if we can verify with a new hash
      const newHash = await bcrypt.hash(testPassword, 10);
      const testMatch = await bcrypt.compare(testPassword, newHash);
      console.log(`   New hash test: ${testMatch ? "✅ Works" : "❌ Fails"}`);
      
      console.log("\n   Solution: Run the test script again to reset passwords:");
      console.log("   node backend/scripts/testAllFunctions.js");
    }
    
    // Test with wrong password
    console.log("\n🔐 Testing with wrong password...");
    const wrongMatch = await user.comparePassword("wrongpassword");
    console.log(`   Wrong password test: ${wrongMatch ? "❌ Should fail but passed!" : "✅ Correctly rejected"}`);
    
    // Test all test users
    console.log("\n\n📋 Testing all test users...");
    const testUsers = [
      { email: "admin@test.com", password: "12345678" },
      { email: "user@test.com", password: "12345678" },
      { email: "committee@test.com", password: "12345678" },
      { email: "rajesh@test.com", password: "12345678" },
    ];
    
    let allPassed = true;
    for (const testUser of testUsers) {
      const u = await User.findOne({ email: testUser.email }).select("+password");
      if (u) {
        const match = await u.comparePassword(testUser.password);
        const status = match ? "✅" : "❌";
        console.log(`   ${status} ${u.email} - ${match ? "Password OK" : "Password FAILED"}`);
        if (!match) allPassed = false;
      } else {
        console.log(`   ❌ ${testUser.email} - User not found`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log("\n✅ All test users have correct passwords!");
    } else {
      console.log("\n❌ Some test users have incorrect passwords!");
      console.log("   Run: node backend/scripts/testAllFunctions.js to fix");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

testPassword();


