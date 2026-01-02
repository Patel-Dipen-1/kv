/**
 * Complete Database Seeding Script
 * 
 * This script will:
 * 1. Initialize all system roles (Admin, User, Committee Member)
 * 2. Create multiple test users with different roles and statuses
 * 3. Create family members for users
 * 4. Create test events
 * 5. Display complete summary of all created data
 * 
 * Usage: 
 *   node backend/scripts/seedCompleteDatabase.js          # Interactive mode
 *   node backend/scripts/seedCompleteDatabase.js --force # Force recreate (drops existing data)
 */

const path = require("path");
const fs = require("fs");

// Try multiple paths for config.env
const possiblePaths = [
  path.join(__dirname, "../config/config.env"),
  path.join(process.cwd(), "config/config.env"),
  path.join(process.cwd(), "backend/config/config.env"),
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
  console.error("❌ Error: Could not find config.env file.");
  process.exit(1);
}

const mongoose = require("mongoose");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const FamilyMember = require("../models/familyMemberModel");
const Event = require("../models/eventModel");
const bcrypt = require("bcryptjs");
const {
  BLOOD_GROUPS,
  SAMAJ_TYPES,
  OCCUPATION_TYPES,
  MARITAL_STATUS,
  COUNTRIES,
} = require("../constants/enums");
const { createDefaultPermissions } = require("../constants/permissions");

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

// Initialize all system roles
const initializeAllRoles = async () => {
  console.log("\n" + "=".repeat(80));
  console.log("🔐 STEP 1: Initializing System Roles");
  console.log("=".repeat(80) + "\n");

  const defaultRoles = [
    {
      roleName: "Admin",
      roleKey: "admin",
      description: "Full system access with all permissions",
      isSystemRole: true,
      permissions: createDefaultPermissions(),
    },
    {
      roleName: "User",
      roleKey: "user",
      description: "Basic user with limited permissions",
      isSystemRole: true,
      permissions: createDefaultPermissions(),
    },
    {
      roleName: "Committee Member",
      roleKey: "committee",
      description: "Committee member with viewing and reporting permissions",
      isSystemRole: true,
      permissions: createDefaultPermissions(),
    },
  ];

  // Set Admin permissions (all true)
  Object.keys(defaultRoles[0].permissions).forEach((key) => {
    defaultRoles[0].permissions[key] = true;
  });

  // Set User permissions (view only)
  defaultRoles[1].permissions.canViewEvents = true;
  defaultRoles[1].permissions.canViewCommittee = true;
  defaultRoles[1].permissions.canViewOwnProfile = true;
  defaultRoles[1].permissions.canManageOwnFamily = true;

  // Set Committee Member permissions
  defaultRoles[2].permissions.canViewUsers = true;
  defaultRoles[2].permissions.canViewFamilyMembers = true;
  defaultRoles[2].permissions.canViewEvents = true;
  defaultRoles[2].permissions.canViewCommittee = true;
  defaultRoles[2].permissions.canViewReports = true;
  defaultRoles[2].permissions.canCreateEvents = true;
  defaultRoles[2].permissions.canCommentOnEvents = true;

  const createdRoles = [];
  for (const roleData of defaultRoles) {
    let role = await Role.findOne({ roleKey: roleData.roleKey });
    if (!role) {
      // Ensure roleKey is set (pre-save hook will generate it if missing, but we set it explicitly)
      if (!roleData.roleKey && roleData.roleName) {
        roleData.roleKey = roleData.roleName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
      }
      
      // Convert permissions object to Map before creating
      const permMap = new Map();
      if (roleData.permissions) {
        Object.keys(roleData.permissions).forEach((key) => {
          permMap.set(key, roleData.permissions[key]);
        });
      }
      
      // Create role with Map permissions
      role = await Role.create({
        ...roleData,
        permissions: permMap,
      });
      console.log(`✅ Created role: ${role.roleName} (${role.roleKey})`);
      createdRoles.push(role);
    } else {
      // Update existing role
      const permMap = new Map();
      Object.keys(roleData.permissions).forEach((key) => {
        permMap.set(key, roleData.permissions[key]);
      });
      role.permissions = permMap;
      role.description = roleData.description;
      await role.save();
      console.log(`✅ Updated role: ${role.roleName} (${role.roleKey})`);
      createdRoles.push(role);
    }
  }

  console.log(`\n✅ Total roles: ${createdRoles.length}`);
  createdRoles.forEach((role) => {
    const enabledCount = role.getEnabledPermissions().length;
    console.log(`   - ${role.roleName}: ${enabledCount} permissions enabled`);
  });

  return createdRoles;
};

// Create test users with different roles
const createTestUsers = async (roles) => {
  console.log("\n" + "=".repeat(80));
  console.log("👥 STEP 2: Creating Test Users");
  console.log("=".repeat(80) + "\n");

  const adminRole = roles.find((r) => r.roleKey === "admin");
  const userRole = roles.find((r) => r.roleKey === "user");
  const committeeRole = roles.find((r) => r.roleKey === "committee");

  if (!adminRole || !userRole || !committeeRole) {
    throw new Error("Required system roles not found");
  }

  const testPassword = await bcrypt.hash("password123", 10);
  console.log(`📝 Default password for all users: password123\n`);

  const testUsers = [
    // Admin Users
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
    // Regular Users (Approved)
    {
      firstName: "John",
      middleName: "",
      lastName: "Doe",
      email: "john@test.com",
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
      firstName: "Priya",
      middleName: "",
      lastName: "Patel",
      email: "priya@test.com",
      mobileNumber: "+919876543212",
      password: testPassword,
      role: "user",
      roleRef: userRole._id,
      status: "approved",
      isActive: true,
      isPrimaryAccount: true,
      occupationType: OCCUPATION_TYPES[1] || "business",
      maritalStatus: MARITAL_STATUS[0] || "married",
      samaj: SAMAJ_TYPES[0] || "Kadva Patidar",
      bloodGroup: BLOOD_GROUPS[2] || "B+",
      dateOfBirth: new Date("1985-08-10"),
      address: {
        line1: "789 Family Road",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380001",
        country: COUNTRIES[0] || "India",
      },
    },
    // Committee Members
    {
      firstName: "Committee",
      middleName: "",
      lastName: "President",
      email: "committee@test.com",
      mobileNumber: "+919876543213",
      password: testPassword,
      role: "committee",
      roleRef: committeeRole._id,
      status: "approved",
      isActive: true,
      isPrimaryAccount: true,
      occupationType: OCCUPATION_TYPES[1] || "business",
      maritalStatus: MARITAL_STATUS[0] || "married",
      samaj: SAMAJ_TYPES[1] || "Anjana Patidar",
      bloodGroup: BLOOD_GROUPS[3] || "AB+",
      dateOfBirth: new Date("1975-03-10"),
      committeePosition: "President",
      committeeDisplayOrder: 1,
      committeeBio: "Committee President with extensive experience",
      address: {
        line1: "321 Committee Lane",
        city: "Surat",
        state: "Gujarat",
        pincode: "395001",
        country: COUNTRIES[0] || "India",
      },
    },
    {
      firstName: "Secretary",
      middleName: "",
      lastName: "Member",
      email: "secretary@test.com",
      mobileNumber: "+919876543214",
      password: testPassword,
      role: "committee",
      roleRef: committeeRole._id,
      status: "approved",
      isActive: true,
      isPrimaryAccount: true,
      occupationType: OCCUPATION_TYPES[0] || "job",
      maritalStatus: MARITAL_STATUS[0] || "married",
      samaj: SAMAJ_TYPES[0] || "Kadva Patidar",
      bloodGroup: BLOOD_GROUPS[0] || "O+",
      dateOfBirth: new Date("1982-07-22"),
      committeePosition: "Secretary",
      committeeDisplayOrder: 2,
      committeeBio: "Committee Secretary managing daily operations",
      address: {
        line1: "654 Secretary Street",
        city: "Vadodara",
        state: "Gujarat",
        pincode: "390001",
        country: COUNTRIES[0] || "India",
      },
    },
    // Pending Users
    {
      firstName: "Pending",
      middleName: "",
      lastName: "User",
      email: "pending@test.com",
      mobileNumber: "+919876543215",
      password: testPassword,
      role: "user",
      roleRef: userRole._id,
      status: "pending",
      isActive: true,
      isPrimaryAccount: true,
      occupationType: OCCUPATION_TYPES[2] || "student",
      maritalStatus: MARITAL_STATUS[1] || "single",
      samaj: SAMAJ_TYPES[0] || "Kadva Patidar",
      bloodGroup: BLOOD_GROUPS[4] || "A-",
      dateOfBirth: new Date("2000-08-25"),
      address: {
        line1: "987 Pending Lane",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        country: COUNTRIES[0] || "India",
      },
    },
    // Rejected User (for testing)
    {
      firstName: "Rejected",
      middleName: "",
      lastName: "User",
      email: "rejected@test.com",
      mobileNumber: "+919876543216",
      password: testPassword,
      role: "user",
      roleRef: userRole._id,
      status: "rejected",
      isActive: false,
      isPrimaryAccount: true,
      occupationType: OCCUPATION_TYPES[2] || "student",
      maritalStatus: MARITAL_STATUS[1] || "single",
      samaj: SAMAJ_TYPES[0] || "Kadva Patidar",
      bloodGroup: BLOOD_GROUPS[5] || "B-",
      dateOfBirth: new Date("1995-12-05"),
      address: {
        line1: "147 Rejected Road",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        country: COUNTRIES[0] || "India",
      },
    },
  ];

  const createdUsers = [];
  let userIndex = 1;

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email.toLowerCase() },
          { mobileNumber: userData.mobileNumber },
        ],
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists. Skipping...`);
        createdUsers.push(existingUser);
      } else {
        // Generate subFamilyNumber
        if (!userData.subFamilyNumber) {
          userData.subFamilyNumber = generateSubFamilyNumber(userIndex);
        }

        const user = await User.create(userData);
        console.log(
          `✅ Created user ${userIndex}: ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role} - Status: ${user.status}`
        );
        createdUsers.push(user);
        userIndex++;
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log(`\n✅ Total users created: ${createdUsers.length}`);
  return createdUsers;
};

// Create family members for users
const createFamilyMembers = async (users) => {
  console.log("\n" + "=".repeat(80));
  console.log("👨‍👩‍👧‍👦 STEP 3: Creating Family Members");
  console.log("=".repeat(80) + "\n");

  const primaryUsers = users.filter((u) => u.isPrimaryAccount && u.status === "approved");
  const createdMembers = [];

  for (const user of primaryUsers.slice(0, 3)) {
    // Create 2-3 family members for each primary user
    const familyMembers = [
      {
        userId: user._id,
        subFamilyNumber: user.subFamilyNumber,
        firstName: `${user.firstName}'s`,
        lastName: "Father",
        relationshipToUser: "Father",
        dateOfBirth: new Date("1950-06-15"),
        bloodGroup: BLOOD_GROUPS[0] || "O+",
        occupationType: OCCUPATION_TYPES[3] || "retired",
        maritalStatus: MARITAL_STATUS[0] || "married",
      },
      {
        userId: user._id,
        subFamilyNumber: user.subFamilyNumber,
        firstName: `${user.firstName}'s`,
        lastName: "Mother",
        relationshipToUser: "Mother",
        dateOfBirth: new Date("1955-03-20"),
        bloodGroup: BLOOD_GROUPS[1] || "A+",
        occupationType: OCCUPATION_TYPES[4] || "homemaker",
        maritalStatus: MARITAL_STATUS[0] || "married",
      },
    ];

    // Add spouse if user is married
    if (user.maritalStatus === "married") {
      const spouseRelationship = user.gender === "male" ? "Wife" : "Husband";
      familyMembers.push({
        userId: user._id,
        subFamilyNumber: user.subFamilyNumber,
        firstName: `${user.firstName}'s`,
        lastName: "Spouse",
        relationshipToUser: spouseRelationship,
        dateOfBirth: new Date("1985-09-10"),
        bloodGroup: BLOOD_GROUPS[2] || "B+",
        occupationType: OCCUPATION_TYPES[0] || "job",
        maritalStatus: MARITAL_STATUS[0] || "married",
      });
    }

    for (const memberData of familyMembers) {
      try {
        const member = await FamilyMember.create(memberData);
        const fullName = `${member.firstName} ${member.lastName}`.trim();
        console.log(
          `✅ Created family member: ${fullName} (${member.relationshipToUser}) for ${user.firstName} ${user.lastName}`
        );
        createdMembers.push(member);
      } catch (error) {
        console.error(`❌ Error creating family member:`, error.message);
      }
    }
  }

  console.log(`\n✅ Total family members created: ${createdMembers.length}`);
  return createdMembers;
};

// Create test events
const createTestEvents = async (users) => {
  console.log("\n" + "=".repeat(80));
  console.log("📅 STEP 4: Creating Test Events");
  console.log("=".repeat(80) + "\n");

  const adminUser = users.find((u) => u.role === "admin");
  const committeeUser = users.find((u) => u.role === "committee");

  if (!adminUser) {
    console.log("⚠️  No admin user found. Skipping event creation.");
    return [];
  }

  const createdBy = adminUser._id;
  const now = new Date();

  const events = [
    {
      eventName: "Community Festival Celebration",
      eventType: "festival",
      description: "Annual community festival celebration with cultural programs",
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      location: {
        venueName: "Community Hall",
        address: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
      },
      visibility: "public",
      status: "upcoming",
      createdBy,
    },
    {
      eventName: "Monthly Committee Meeting",
      eventType: "community_function",
      description: "Regular monthly committee meeting to discuss community matters",
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      location: {
        venueName: "Committee Office",
        address: "456 Committee Road",
        city: "Ahmedabad",
        state: "Gujarat",
        country: "India",
      },
      visibility: "role",
      status: "upcoming",
      createdBy,
    },
    {
      eventName: "Religious Event - Navratri",
      eventType: "religious",
      description: "Navratri celebration with Garba and Dandiya",
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      location: {
        venueName: "Temple Ground",
        address: "789 Temple Street",
        city: "Surat",
        state: "Gujarat",
        country: "India",
      },
      visibility: "samaj",
      status: "upcoming",
      createdBy,
    },
    {
      eventName: "Past Event - Annual Gathering",
      eventType: "other",
      description: "Annual community gathering that happened last month",
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      location: {
        venueName: "Community Center",
        address: "321 Center Road",
        city: "Delhi",
        state: "Delhi",
        country: "India",
      },
      visibility: "public",
      status: "completed",
      createdBy,
    },
  ];

  const createdEvents = [];
  for (const eventData of events) {
    try {
      const event = await Event.create(eventData);
      console.log(`✅ Created event: ${event.eventName} (${event.eventType}) - ${event.status}`);
      createdEvents.push(event);
    } catch (error) {
      console.error(`❌ Error creating event:`, error.message);
    }
  }

  console.log(`\n✅ Total events created: ${createdEvents.length}`);
  return createdEvents;
};

// Display complete summary
const displaySummary = async (roles, users, familyMembers, events) => {
  console.log("\n" + "=".repeat(80));
  console.log("📊 COMPLETE DATABASE SUMMARY");
  console.log("=".repeat(80) + "\n");

  // Roles Summary
  console.log("🔐 ROLES:");
  roles.forEach((role) => {
    const enabledPerms = role.getEnabledPermissions().length;
    const userCount = users.filter((u) => u.roleRef?.toString() === role._id.toString()).length;
    console.log(`   - ${role.roleName} (${role.roleKey}): ${userCount} users, ${enabledPerms} permissions`);
  });

  // Users Summary by Role
  console.log("\n👥 USERS BY ROLE:");
  const usersByRole = {};
  users.forEach((user) => {
    const roleKey = user.role || "no-role";
    if (!usersByRole[roleKey]) {
      usersByRole[roleKey] = [];
    }
    usersByRole[roleKey].push(user);
  });

  Object.keys(usersByRole).forEach((roleKey) => {
    console.log(`\n   ${roleKey.toUpperCase()} (${usersByRole[roleKey].length} users):`);
    usersByRole[roleKey].forEach((user) => {
      console.log(`     - ${user.firstName} ${user.lastName} (${user.email}) - Status: ${user.status}`);
    });
  });

  // Users Summary by Status
  console.log("\n📋 USERS BY STATUS:");
  const usersByStatus = {};
  users.forEach((user) => {
    const status = user.status || "unknown";
    if (!usersByStatus[status]) {
      usersByStatus[status] = 0;
    }
    usersByStatus[status]++;
  });

  Object.keys(usersByStatus).forEach((status) => {
    console.log(`   - ${status}: ${usersByStatus[status]} users`);
  });

  // Family Members Summary
  console.log(`\n👨‍👩‍👧‍👦 FAMILY MEMBERS: ${familyMembers.length} total`);

  // Events Summary
  console.log(`\n📅 EVENTS: ${events.length} total`);
  events.forEach((event) => {
    console.log(`   - ${event.eventName} (${event.eventType}) - ${event.status}`);
  });

  // Database Statistics
  console.log("\n" + "=".repeat(80));
  console.log("📈 DATABASE STATISTICS");
  console.log("=".repeat(80));
  console.log(`   Total Roles: ${roles.length}`);
  console.log(`   Total Users: ${users.length}`);
  console.log(`   Total Family Members: ${familyMembers.length}`);
  console.log(`   Total Events: ${events.length}`);
  console.log("=".repeat(80) + "\n");

  // Login Credentials
  console.log("🔑 TEST LOGIN CREDENTIALS:");
  console.log("   Password for all users: password123\n");
  users.slice(0, 5).forEach((user) => {
    console.log(`   ${user.email} - Role: ${user.role} - Status: ${user.status}`);
  });
  console.log();
};

// Main function
const main = async () => {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🚀 COMPLETE DATABASE SEEDING SCRIPT");
    console.log("=".repeat(80));
    console.log("\nThis script will:");
    console.log("  1. Initialize all system roles");
    console.log("  2. Create test users with different roles");
    console.log("  3. Create family members");
    console.log("  4. Create test events");
    console.log("  5. Display complete summary\n");

    await connectDatabase();

    // Check for force flag
    const args = process.argv.slice(2);
    const forceMode = args.includes("--force") || args.includes("-f");

    if (forceMode) {
      console.log("⚠️  Force mode enabled. Existing data will be preserved (users with same email will be skipped).\n");
    }

    // Step 1: Initialize roles
    const roles = await initializeAllRoles();

    // Step 2: Create users
    const users = await createTestUsers(roles);

    // Step 3: Create family members
    const familyMembers = await createFamilyMembers(users);

    // Step 4: Create events
    const events = await createTestEvents(users);

    // Step 5: Display summary
    await displaySummary(roles, users, familyMembers, events);

    console.log("✅ Database seeding completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

// Run the script
main();

