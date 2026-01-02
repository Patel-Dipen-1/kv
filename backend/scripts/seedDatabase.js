/**
 * Database Seeding Script
 * Drops all collections and creates fresh test data with roles
 * 
 * Usage: node backend/scripts/seedDatabase.js
 * 
 * WARNING: This will DELETE ALL existing data!
 */

require("dotenv").config({ path: "backend/config/config.env" });
const mongoose = require("mongoose");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const FamilyMember = require("../models/familyMemberModel");
const ActivityLog = require("../models/activityLogModel");
const Enum = require("../models/enumModel");
const bcrypt = require("bcryptjs");

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URI)
    .then((data) => {
      console.log(`✅ MongoDB connected: ${data.connection.host}`);
    })
    .catch((err) => {
      console.error("❌ Database connection error:", err);
      process.exit(1);
    });
};

const dropAllCollections = async () => {
  console.log("\n🗑️  Dropping all collections...");
  
  try {
    await User.deleteMany({});
    await Role.deleteMany({});
    await FamilyMember.deleteMany({});
    await ActivityLog.deleteMany({});
    await Enum.deleteMany({});
    
    console.log("✅ All collections dropped");
  } catch (error) {
    console.error("❌ Error dropping collections:", error);
    throw error;
  }
};

const createSystemRoles = async () => {
  console.log("\n📋 Creating system roles...");
  
  try {
    // Call the controller function directly (it's a catchAsyncErrors wrapper)
    // We need to create a mock req/res/next for the controller
    const Role = require("../models/roleModel");
    const { createDefaultPermissions } = require("../constants/permissions");
    
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

    // Set Committee Member permissions
    defaultRoles[2].permissions.canViewUsers = true;
    defaultRoles[2].permissions.canViewFamilyMembers = true;
    defaultRoles[2].permissions.canViewEvents = true;
    defaultRoles[2].permissions.canViewCommittee = true;
    defaultRoles[2].permissions.canViewReports = true;

    const createdRoles = [];
    for (const roleData of defaultRoles) {
      let role = await Role.findOne({ roleKey: roleData.roleKey });
      if (!role) {
        role = await Role.create(roleData);
        createdRoles.push(role);
      } else {
        // Update permissions if role exists but permissions changed
        role.permissions = roleData.permissions;
        role.description = roleData.description;
        await role.save();
        createdRoles.push(role);
      }
    }
    
    console.log(`✅ Created ${createdRoles.length} system roles:`);
    createdRoles.forEach((role) => {
      const enabledCount = role.getEnabledPermissions().length;
      console.log(`   - ${role.roleName} (${enabledCount} permissions)`);
    });
    return createdRoles;
  } catch (error) {
    console.error("❌ Error creating roles:", error);
    throw error;
  }
};

const createTestUsers = async (roles) => {
  console.log("\n👥 Creating test users...");
  
  const adminRole = roles.find((r) => r.roleKey === "admin");
  const userRole = roles.find((r) => r.roleKey === "user");
  const committeeRole = roles.find((r) => r.roleKey === "committee");

  if (!adminRole || !userRole || !committeeRole) {
    throw new Error("System roles not found");
  }

  const hashedPassword = await bcrypt.hash("12345678", 10);

  const users = [
    {
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      mobileNumber: "+919876543210",
      password: hashedPassword,
      role: "admin",
      roleRef: adminRole._id,
      status: "approved",
      isActive: true,
      occupationType: "job",
      maritalStatus: "married",
      samaj: "Kadva Patidar",
      address: {
        line1: "123 Admin Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India",
      },
    },
    {
      firstName: "John",
      lastName: "Doe",
      email: "user@test.com",
      mobileNumber: "+919876543211",
      password: hashedPassword,
      role: "user",
      roleRef: userRole._id,
      status: "approved",
      isActive: true,
      occupationType: "job",
      maritalStatus: "single",
      samaj: "Kadva Patidar",
      address: {
        line1: "456 User Avenue",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        country: "India",
      },
    },
    {
      firstName: "Committee",
      lastName: "Member",
      email: "committee@test.com",
      mobileNumber: "+919876543212",
      password: hashedPassword,
      role: "committee",
      roleRef: committeeRole._id,
      status: "approved",
      isActive: true,
      occupationType: "business",
      maritalStatus: "married",
      samaj: "Anjana Patidar",
      committeePosition: "President",
      committeeDisplayOrder: 1,
      committeeBio: "Committee President with extensive experience",
      address: {
        line1: "789 Committee Road",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380001",
        country: "India",
      },
    },
    {
      firstName: "Pending",
      lastName: "User",
      email: "pending@test.com",
      mobileNumber: "+919876543213",
      password: hashedPassword,
      role: "user",
      roleRef: userRole._id,
      status: "pending",
      isActive: true,
      occupationType: "student",
      maritalStatus: "single",
      samaj: "Kadva Patidar",
      address: {
        line1: "321 Pending Lane",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        country: "India",
      },
    },
  ];

  try {
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} test users:`);
    createdUsers.forEach((user) => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });
    return createdUsers;
  } catch (error) {
    console.error("❌ Error creating users:", error);
    throw error;
  }
};

const createTestEnums = async () => {
  console.log("\n📝 Creating enum data...");
  
  const enums = [
    {
      enumType: "USER_ROLES",
      values: ["user", "committee", "moderator", "admin"],
      description: "User role types",
    },
    {
      enumType: "USER_STATUS",
      values: ["pending", "approved", "rejected"],
      description: "User approval status",
    },
    {
      enumType: "COMMITTEE_POSITIONS",
      values: ["President", "Vice President", "Secretary", "Treasurer", "Committee Member", "Advisor"],
      description: "Committee member positions",
    },
    {
      enumType: "MARITAL_STATUS",
      values: ["single", "married", "divorced", "widowed"],
      description: "Marital status options",
    },
    {
      enumType: "OCCUPATION_TYPES",
      values: ["job", "business", "student", "retired", "homemaker", "other"],
      description: "Occupation type options",
    },
    {
      enumType: "RELATIONSHIP_TYPES",
      values: [
        "Father", "Mother", "Son", "Daughter", "Husband", "Wife",
        "Brother", "Sister", "Grandfather", "Grandmother", "Uncle", "Aunt",
        "Nephew", "Niece", "Cousin", "Other"
      ],
      description: "Family relationship types",
    },
    {
      enumType: "SAMAJ_TYPES",
      values: ["Kadva Patidar", "Anjana Patidar", "Other"],
      description: "Samaj/Community types",
    },
    {
      enumType: "COUNTRIES",
      values: [
        "India", "USA", "UK", "Canada", "Australia",
        "United Arab Emirates", "Saudi Arabia", "Singapore",
        "Malaysia", "South Africa", "New Zealand", "Germany", "France", "Other"
      ],
      description: "Country options",
    },
  ];

  try {
    await Enum.insertMany(enums);
    console.log(`✅ Created ${enums.length} enum types`);
  } catch (error) {
    console.error("❌ Error creating enums:", error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log("🚀 Starting database seeding...\n");
    
    // Connect to database
    connectDatabase();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Drop all collections
    await dropAllCollections();

    // Create system roles
    const roles = await createSystemRoles();

    // Create test users
    const users = await createTestUsers(roles);

    // Create enum data
    await createTestEnums();

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\n📋 Test Accounts:");
    console.log("   ┌─────────────────────────────────────────────────┐");
    console.log("   │ Admin: admin@test.com / 9876543210              │");
    console.log("   │ User: user@test.com / 9876543211                │");
    console.log("   │ Committee: committee@test.com / 9876543212        │");
    console.log("   │ Pending: pending@test.com / 9876543213          │");
    console.log("   └─────────────────────────────────────────────────┘");
    console.log("\n🔑 All passwords: 12345678");
    console.log("\n💡 For comprehensive testing, run: node backend/scripts/testAllFunctions.js");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the script
seedDatabase();

