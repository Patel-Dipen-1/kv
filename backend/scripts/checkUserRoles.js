/**
 * Script to Create Test Users and Check Their Roles
 * 
 * This script will:
 * 1. Connect to database
 * 2. Create test users with different roles
 * 3. Display all users and their assigned roles
 * 4. Show permissions for each user
 * 5. Verify role assignments
 * 
 * Usage: 
 *   node backend/scripts/checkUserRoles.js          # Interactive mode (asks to create users)
 *   node backend/scripts/checkUserRoles.js --create # Auto-create test users
 *   node backend/scripts/checkUserRoles.js -c       # Short form
 */

const path = require("path");
const fs = require("fs");

// Try multiple paths for config.env
const possiblePaths = [
  path.join(__dirname, "../config/config.env"), // From backend/scripts/
  path.join(process.cwd(), "config/config.env"), // From backend/
  path.join(process.cwd(), "backend/config/config.env"), // From root/
];

let configPath = null;
for (const configPathOption of possiblePaths) {
  if (fs.existsSync(configPathOption)) {
    configPath = configPathOption;
    break;
  }
}

if (configPath) {
  require("dotenv").config({ path: configPath });
} else {
  console.error("❌ Error: Could not find config.env file. Tried paths:");
  possiblePaths.forEach(p => console.error(`   - ${p}`));
  process.exit(1);
}

const mongoose = require("mongoose");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const bcrypt = require("bcryptjs");
const { BLOOD_GROUPS, SAMAJ_TYPES, OCCUPATION_TYPES, MARITAL_STATUS, COUNTRIES } = require("../constants/enums");

// Connect to database
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1);
  }
};

// Generate sub-family number
const generateSubFamilyNumber = (index) => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = String(index).padStart(4, "0");
  return `FAM-${dateStr}-${random}`;
};

// Create test users
const createTestUsers = async () => {
  console.log("\n📝 Creating test users...\n");

  // Get all available roles
  const roles = await Role.find({ isActive: true });
  console.log("Available roles in system:");
  roles.forEach(role => {
    console.log(`  - ${role.roleName} (${role.roleKey})`);
  });
  console.log();

  // Find specific roles
  const adminRole = await Role.findOne({ roleKey: "admin" });
  const userRole = await Role.findOne({ roleKey: "user" });
  const committeeRole = await Role.findOne({ roleKey: "committee_member" }) || 
                        await Role.findOne({ roleKey: "committee" }) ||
                        userRole; // Fallback

  if (!adminRole || !userRole) {
    console.error("❌ Required roles (admin, user) not found. Please run initializeRoles.js first.");
    return [];
  }

  const testPassword = await bcrypt.hash("password123", 10);

  const testUsers = [
    {
      firstName: "Admin",
      middleName: "",
      lastName: "User",
      email: "admin@test.com",
      mobileNumber: "+919876543210",
      password: testPassword,
      role: "admin",
      roleRef: adminRole._id,
      status: "approved",
      isActive: true,
      isPrimaryAccount: true,
      occupationType: OCCUPATION_TYPES[0] || "job",
      maritalStatus: MARITAL_STATUS[0] || "married",
      samaj: SAMAJ_TYPES[0] || "Kadva Patidar",
      bloodGroup: BLOOD_GROUPS[0] || "O+",
      dateOfBirth: new Date("1980-01-15"),
      address: {
        line1: "123 Admin Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: COUNTRIES[0] || "India",
      },
    },
    {
      firstName: "John",
      middleName: "",
      lastName: "Doe",
      email: "user@test.com",
      mobileNumber: "+919876543211",
      password: testPassword,
      role: "user",
      roleRef: userRole._id,
      status: "approved",
      isActive: true,
      isPrimaryAccount: true,
      occupationType: OCCUPATION_TYPES[0] || "job",
      maritalStatus: MARITAL_STATUS[1] || "single",
      samaj: SAMAJ_TYPES[0] || "Kadva Patidar",
      bloodGroup: BLOOD_GROUPS[1] || "A+",
      dateOfBirth: new Date("1990-05-20"),
      address: {
        line1: "456 User Avenue",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        country: COUNTRIES[0] || "India",
      },
    },
    {
      firstName: "Committee",
      middleName: "",
      lastName: "Member",
      email: "committee@test.com",
      mobileNumber: "+919876543212",
      password: testPassword,
      role: "committee",
      roleRef: committeeRole._id,
      status: "approved",
      isActive: true,
      isPrimaryAccount: true,
      occupationType: OCCUPATION_TYPES[1] || "business",
      maritalStatus: MARITAL_STATUS[0] || "married",
      samaj: SAMAJ_TYPES[1] || "Anjana Patidar",
      bloodGroup: BLOOD_GROUPS[2] || "B+",
      dateOfBirth: new Date("1975-03-10"),
      address: {
        line1: "789 Committee Road",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380001",
        country: COUNTRIES[0] || "India",
      },
    },
    {
      firstName: "Pending",
      middleName: "",
      lastName: "User",
      email: "pending@test.com",
      mobileNumber: "+919876543213",
      password: testPassword,
      role: "user",
      roleRef: userRole._id,
      status: "pending",
      isActive: true,
      isPrimaryAccount: true,
      occupationType: OCCUPATION_TYPES[2] || "student",
      maritalStatus: MARITAL_STATUS[1] || "single",
      samaj: SAMAJ_TYPES[0] || "Kadva Patidar",
      bloodGroup: BLOOD_GROUPS[3] || "AB+",
      dateOfBirth: new Date("2000-08-25"),
      address: {
        line1: "321 Pending Lane",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        country: COUNTRIES[0] || "India",
      },
    },
  ];

  const createdUsers = [];
  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { email: userData.email.toLowerCase() },
          { mobileNumber: userData.mobileNumber }
        ]
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists. Skipping...`);
        createdUsers.push(existingUser);
      } else {
        // Generate subFamilyNumber if not provided
        if (!userData.subFamilyNumber) {
          userData.subFamilyNumber = generateSubFamilyNumber(createdUsers.length + 1);
        }

        const user = await User.create(userData);
        console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
        createdUsers.push(user);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  return createdUsers;
};

// Display all users with their roles
const displayAllUsers = async () => {
  console.log("\n" + "=".repeat(80));
  console.log("📊 ALL USERS AND THEIR ROLES");
  console.log("=".repeat(80) + "\n");

  const users = await User.find({ deletedAt: null })
    .populate("roleRef")
    .sort({ createdAt: -1 });

  if (users.length === 0) {
    console.log("No users found in the database.\n");
    return;
  }

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.firstName} ${user.middleName || ""} ${user.lastName}`.trim());
    console.log(`   Email: ${user.email}`);
    console.log(`   Mobile: ${user.mobileNumber}`);
    console.log(`   Status: ${user.status || "N/A"}`);
    console.log(`   Active: ${user.isActive ? "Yes" : "No"}`);
    console.log(`   Primary Account: ${user.isPrimaryAccount ? "Yes" : "No"}`);
    
    if (user.roleRef) {
      console.log(`   Role: ${user.roleRef.roleName} (${user.roleRef.roleKey})`);
      console.log(`   Role Type: ${user.roleRef.isSystemRole ? "System Role" : "Custom Role"}`);
      
      // Show enabled permissions
      const enabledPerms = user.roleRef.getEnabledPermissions();
      if (enabledPerms.length > 0) {
        console.log(`   Permissions (${enabledPerms.length} enabled):`);
        enabledPerms.slice(0, 5).forEach(perm => {
          console.log(`     - ${perm}`);
        });
        if (enabledPerms.length > 5) {
          console.log(`     ... and ${enabledPerms.length - 5} more`);
        }
      } else {
        console.log(`   Permissions: None enabled`);
      }
    } else {
      console.log(`   Role: Not assigned (roleRef: ${user.roleRef || "null"})`);
    }
    
    console.log(`   Family Number: ${user.subFamilyNumber || "N/A"}`);
    console.log(`   Samaj: ${user.samaj || "N/A"}`);
    console.log(`   Blood Group: ${user.bloodGroup || "N/A"}`);
    console.log();
  });

  console.log(`Total users: ${users.length}`);
  console.log("=".repeat(80) + "\n");
};

// Display users grouped by role
const displayUsersByRole = async () => {
  console.log("\n" + "=".repeat(80));
  console.log("👥 USERS GROUPED BY ROLE");
  console.log("=".repeat(80) + "\n");

  const roles = await Role.find({ isActive: true }).sort({ roleName: 1 });

  for (const role of roles) {
    const users = await User.find({ 
      roleRef: role._id,
      deletedAt: null 
    }).populate("roleRef");

    if (users.length > 0) {
      console.log(`\n📌 ${role.roleName} (${role.roleKey}) - ${users.length} user(s):`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Status: ${user.status}`);
      });
    }
  }

  // Users without roles
  const usersWithoutRole = await User.find({ 
    $or: [
      { roleRef: null },
      { roleRef: { $exists: false } }
    ],
    deletedAt: null
  });

  if (usersWithoutRole.length > 0) {
    console.log(`\n⚠️  Users without role (${usersWithoutRole.length}):`);
    usersWithoutRole.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
    });
  }

  console.log("\n" + "=".repeat(80) + "\n");
};

// Display role statistics
const displayRoleStatistics = async () => {
  console.log("\n" + "=".repeat(80));
  console.log("📈 ROLE STATISTICS");
  console.log("=".repeat(80) + "\n");

  const roles = await Role.find({ isActive: true }).sort({ roleName: 1 });

  for (const role of roles) {
    const userCount = await User.countDocuments({ 
      roleRef: role._id,
      deletedAt: null 
    });
    
    const enabledPerms = role.getEnabledPermissions();
    
    console.log(`${role.roleName} (${role.roleKey}):`);
    console.log(`  - Users assigned: ${userCount}`);
    console.log(`  - Permissions enabled: ${enabledPerms.length}`);
    console.log(`  - System role: ${role.isSystemRole ? "Yes" : "No"}`);
    console.log();
  }

  const totalUsers = await User.countDocuments({ deletedAt: null });
  const usersWithRole = await User.countDocuments({ 
    roleRef: { $exists: true, $ne: null },
    deletedAt: null 
  });
  const usersWithoutRole = totalUsers - usersWithRole;

  console.log(`Total Statistics:`);
  console.log(`  - Total users: ${totalUsers}`);
  console.log(`  - Users with role: ${usersWithRole}`);
  console.log(`  - Users without role: ${usersWithoutRole}`);
  console.log("=".repeat(80) + "\n");
};

// Main function
const main = async () => {
  try {
    console.log("🚀 Starting User Role Check Script...\n");
    
    await connectDatabase();
    
    // Check command line argument for auto-create
    const args = process.argv.slice(2);
    const shouldCreateUsers = args.includes("--create") || args.includes("-c");

    if (shouldCreateUsers) {
      await createTestUsers();
    } else {
      // Ask user if they want to create test users (only if not in auto mode)
      const readline = require("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise((resolve) => {
        rl.question("Do you want to create test users? (y/n, default: n): ", (ans) => {
          rl.close();
          resolve(ans.toLowerCase().trim());
        });
      });

      if (answer === "y" || answer === "yes") {
        await createTestUsers();
      }
    }

    // Display all information
    await displayAllUsers();
    await displayUsersByRole();
    await displayRoleStatistics();

    console.log("✅ Script completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

// Run the script
main();

