/**
 * Comprehensive Test Script
 * Drops all data, seeds database, and tests all RBAC functions
 * 
 * Usage: node backend/scripts/testAllFunctions.js
 * 
 * This script will:
 * 1. Drop all collections
 * 2. Initialize system roles
 * 3. Create test users with different roles
 * 4. Test permission checking
 * 5. Test role management
 * 6. Verify all functions work correctly
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
const FamilyMember = require("../models/familyMemberModel");
const ActivityLog = require("../models/activityLogModel");
const Enum = require("../models/enumModel");
const { createDefaultPermissions } = require("../constants/permissions");
const bcrypt = require("bcryptjs");

const connectDatabase = () => {
  if (!process.env.DB_URI) {
    console.error("❌ Error: DB_URI is not defined in config.env");
    console.error(`   Config file loaded from: ${configPath || 'not found'}`);
    console.error("   Please check your backend/config/config.env file");
    process.exit(1);
  }
  
  mongoose
    .connect(process.env.DB_URI)
    .then((data) => {
      console.log(`✅ MongoDB connected: ${data.connection.host}`);
    })
    .catch((err) => {
      console.error("❌ Database connection error:", err.message);
      console.error("   Make sure MongoDB is running and DB_URI is correct");
      process.exit(1);
    });
};

const dropAllCollections = async () => {
  console.log("\n🗑️  Step 1: Dropping all collections...");
  
  try {
    await User.deleteMany({});
    await Role.deleteMany({});
    await FamilyMember.deleteMany({});
    await ActivityLog.deleteMany({});
    await Enum.deleteMany({});
    
    console.log("✅ All collections dropped successfully");
  } catch (error) {
    console.error("❌ Error dropping collections:", error);
    throw error;
  }
};

const createSystemRoles = async () => {
  console.log("\n📋 Step 2: Creating system roles...");
  
  try {
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
    const adminPerms = defaultRoles[0].permissions;
    Object.keys(adminPerms).forEach((key) => {
      adminPerms[key] = true;
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
        // Create new role - Mongoose will convert plain object to Map automatically
        role = new Role(roleData);
        // Convert permissions object to Map if needed
        if (roleData.permissions && !(roleData.permissions instanceof Map)) {
          const permMap = new Map();
          Object.keys(roleData.permissions).forEach(key => {
            permMap.set(key, roleData.permissions[key]);
          });
          role.permissions = permMap;
        }
        await role.save();
        createdRoles.push(role);
      } else {
        // Update existing role
        const permMap = new Map();
        Object.keys(roleData.permissions).forEach(key => {
          permMap.set(key, roleData.permissions[key]);
        });
        role.permissions = permMap;
        role.description = roleData.description;
        await role.save();
        createdRoles.push(role);
      }
    }
    
    console.log(`✅ Created ${createdRoles.length} system roles:`);
    createdRoles.forEach((role) => {
      const enabledCount = role.getEnabledPermissions().length;
      console.log(`   - ${role.roleName} (${enabledCount} permissions enabled)`);
    });
    return createdRoles;
  } catch (error) {
    console.error("❌ Error creating roles:", error);
    throw error;
  }
};

const createTestUsers = async (roles) => {
  console.log("\n👥 Step 3: Creating test users...");
  
  const adminRole = roles.find((r) => r.roleKey === "admin");
  const userRole = roles.find((r) => r.roleKey === "user");
  const committeeRole = roles.find((r) => r.roleKey === "committee");

  if (!adminRole || !userRole || !committeeRole) {
    throw new Error("System roles not found");
  }

  // Use consistent password for all test users
  // NOTE: We pass plain password - the pre-save hook will hash it
  const testPassword = "12345678";
  
  console.log(`\n   Password for all test users: ${testPassword}`);

  // Generate unique subFamilyNumber for each user
  const generateSubFamilyNumber = (index) => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase(); // Random 4 chars
    return `FAM-${dateStr}-${randomStr}${index.toString().padStart(2, '0')}`;
  };

  const users = [
    {
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      mobileNumber: "+919876543210",
      password: testPassword, // Plain password - will be hashed by pre-save hook
      role: "admin",
      roleRef: adminRole._id,
      status: "approved",
      isActive: true,
      occupationType: "job",
      maritalStatus: "married",
      samaj: "Kadva Patidar",
      subFamilyNumber: generateSubFamilyNumber(1),
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
      password: testPassword, // Plain password - will be hashed by pre-save hook
      role: "user",
      roleRef: userRole._id,
      status: "approved",
      isActive: true,
      occupationType: "job",
      maritalStatus: "single",
      samaj: "Kadva Patidar",
      subFamilyNumber: generateSubFamilyNumber(2),
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
      password: testPassword, // Plain password - will be hashed by pre-save hook
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
      subFamilyNumber: generateSubFamilyNumber(3),
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
      password: testPassword, // Plain password - will be hashed by pre-save hook
      role: "user",
      roleRef: userRole._id,
      status: "pending",
      isActive: true,
      occupationType: "student",
      maritalStatus: "single",
      samaj: "Kadva Patidar",
      subFamilyNumber: generateSubFamilyNumber(4),
      address: {
        line1: "321 Pending Lane",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        country: "India",
      },
    },
    {
      firstName: "Rajesh",
      lastName: "Kumar",
      email: "rajesh@test.com",
      mobileNumber: "+919876543214",
      password: testPassword, // Plain password - will be hashed by pre-save hook
      role: "user",
      roleRef: userRole._id,
      status: "approved",
      isActive: true,
      occupationType: "business",
      maritalStatus: "married",
      samaj: "Kadva Patidar",
      subFamilyNumber: generateSubFamilyNumber(5),
      address: {
        line1: "555 Test Street",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        country: "India",
      },
    },
  ];

  try {
    // Create users one by one to ensure pre-save hooks run properly
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} test users:`);
    createdUsers.forEach((user) => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role} - Status: ${user.status}`);
    });
    return createdUsers;
  } catch (error) {
    console.error("❌ Error creating users:", error);
    throw error;
  }
};

const createTestEnums = async () => {
  console.log("\n📝 Step 4: Creating enum data...");
  
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

const createTestFamilyMembers = async (users) => {
  console.log("\n👨‍👩‍👧‍👦 Step 5: Creating test family members...");
  
  const approvedUser = users.find((u) => u.email === "user@test.com");
  if (!approvedUser) {
    console.log("⚠️  Skipping family members - approved user not found");
    return;
  }

  const familyMembers = [
    {
      userId: approvedUser._id,
      subFamilyNumber: approvedUser.subFamilyNumber,
      firstName: "Father",
      lastName: approvedUser.lastName,
      relationshipToUser: "Father",
      age: 65,
      mobileNumber: "+919876543220",
      email: `father.${approvedUser.email}`,
      occupationType: "retired",
      maritalStatus: "married",
      approvalStatus: "approved",
    },
    {
      userId: approvedUser._id,
      subFamilyNumber: approvedUser.subFamilyNumber,
      firstName: "Mother",
      lastName: approvedUser.lastName,
      relationshipToUser: "Mother",
      age: 60,
      mobileNumber: "+919876543221",
      email: `mother.${approvedUser.email}`,
      occupationType: "homemaker",
      maritalStatus: "married",
      approvalStatus: "approved",
    },
    {
      userId: approvedUser._id,
      subFamilyNumber: approvedUser.subFamilyNumber,
      firstName: "Sister",
      lastName: approvedUser.lastName,
      relationshipToUser: "Sister",
      age: 25,
      mobileNumber: "+919876543222",
      email: `sister.${approvedUser.email}`,
      occupationType: "job",
      maritalStatus: "single",
      approvalStatus: "approved",
    },
  ];

  try {
    const created = await FamilyMember.insertMany(familyMembers);
    console.log(`✅ Created ${created.length} family members for ${approvedUser.firstName} ${approvedUser.lastName}`);
    
    // Update user's family members count
    await User.findByIdAndUpdate(approvedUser._id, {
      $push: { familyMembers: { $each: created.map(fm => fm._id) } },
      $set: { familyMembersCount: created.length }
    });
    
    return created;
  } catch (error) {
    console.error("❌ Error creating family members:", error);
    throw error;
  }
};

const testPermissions = async () => {
  console.log("\n🔍 Step 6: Testing permission system...");
  
  try {
    const adminUser = await User.findOne({ email: "admin@test.com" }).populate("roleRef");
    const regularUser = await User.findOne({ email: "user@test.com" }).populate("roleRef");
    const committeeUser = await User.findOne({ email: "committee@test.com" }).populate("roleRef");

    if (!adminUser || !regularUser || !committeeUser) {
      throw new Error("Test users not found");
    }

    // Test Admin permissions
    console.log("\n   Testing Admin permissions:");
    const adminPerms = adminUser.roleRef.permissions;
    const adminCanApprove = adminPerms instanceof Map 
      ? adminPerms.get("canApproveUsers") 
      : adminPerms.canApproveUsers;
    const adminCanManageRoles = adminPerms instanceof Map 
      ? adminPerms.get("canManageRoles") 
      : adminPerms.canManageRoles;
    console.log(`   - canApproveUsers: ${adminCanApprove ? "✅" : "❌"}`);
    console.log(`   - canManageRoles: ${adminCanManageRoles ? "✅" : "❌"}`);

    // Test User permissions
    console.log("\n   Testing User permissions:");
    const userPerms = regularUser.roleRef.permissions;
    const userCanViewEvents = userPerms instanceof Map 
      ? userPerms.get("canViewEvents") 
      : userPerms.canViewEvents;
    const userCanApprove = userPerms instanceof Map 
      ? userPerms.get("canApproveUsers") 
      : userPerms.canApproveUsers;
    console.log(`   - canViewEvents: ${userCanViewEvents ? "✅" : "❌"}`);
    console.log(`   - canApproveUsers: ${userCanApprove ? "❌ (correct - should be false)" : "✅"}`);

    // Test Committee permissions
    console.log("\n   Testing Committee permissions:");
    const committeePerms = committeeUser.roleRef.permissions;
    const committeeCanViewUsers = committeePerms instanceof Map 
      ? committeePerms.get("canViewUsers") 
      : committeePerms.canViewUsers;
    const committeeCanApprove = committeePerms instanceof Map 
      ? committeePerms.get("canApproveUsers") 
      : committeePerms.canApproveUsers;
    console.log(`   - canViewUsers: ${committeeCanViewUsers ? "✅" : "❌"}`);
    console.log(`   - canApproveUsers: ${committeeCanApprove ? "❌ (correct - should be false)" : "✅"}`);

    console.log("\n✅ Permission tests completed");
  } catch (error) {
    console.error("❌ Error testing permissions:", error);
    throw error;
  }
};

const testRoleManagement = async () => {
  console.log("\n🎭 Step 7: Testing role management...");
  
  try {
    const Role = require("../models/roleModel");
    const { createDefaultPermissions } = require("../constants/permissions");
    
    // Test creating a custom role
    console.log("   Creating custom 'Event Manager' role...");
    const eventManagerRole = await Role.create({
      roleName: "Event Manager",
      roleKey: "event_manager",
      description: "Manages all community events",
      isSystemRole: false,
      permissions: createDefaultPermissions(),
    });
    
    // Set specific permissions
    eventManagerRole.permissions.set("canCreateEvents", true);
    eventManagerRole.permissions.set("canEditEvents", true);
    eventManagerRole.permissions.set("canDeleteEvents", true);
    eventManagerRole.permissions.set("canViewEvents", true);
    eventManagerRole.permissions.set("canUploadMedia", true);
    await eventManagerRole.save();
    
    console.log("   ✅ Custom role created successfully");
    
    // Test assigning role to user
    console.log("   Assigning 'Event Manager' role to Rajesh...");
    const rajesh = await User.findOne({ email: "rajesh@test.com" });
    if (rajesh) {
      rajesh.roleRef = eventManagerRole._id;
      rajesh.role = "user"; // Keep role type as user for backward compatibility
      await rajesh.save();
      console.log("   ✅ Role assigned successfully");
      
      // Verify permissions
      const updatedRajesh = await User.findById(rajesh._id).populate("roleRef");
      const canCreateEvents = updatedRajesh.roleRef.permissions instanceof Map
        ? updatedRajesh.roleRef.permissions.get("canCreateEvents")
        : updatedRajesh.roleRef.permissions.canCreateEvents;
      console.log(`   ✅ Rajesh can create events: ${canCreateEvents ? "Yes" : "No"}`);
    }
    
    console.log("\n✅ Role management tests completed");
  } catch (error) {
    console.error("❌ Error testing role management:", error);
    throw error;
  }
};

const verifyData = async () => {
  console.log("\n✅ Step 8: Verifying all data...");
  
  try {
    const userCount = await User.countDocuments();
    const roleCount = await Role.countDocuments();
    const familyCount = await FamilyMember.countDocuments();
    const enumCount = await Enum.countDocuments();
    
    console.log(`\n📊 Database Summary:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Roles: ${roleCount}`);
    console.log(`   - Family Members: ${familyCount}`);
    console.log(`   - Enum Types: ${enumCount}`);
    
    // Verify users have roles
    const usersWithoutRoles = await User.countDocuments({ roleRef: { $exists: false } });
    if (usersWithoutRoles > 0) {
      console.log(`\n⚠️  Warning: ${usersWithoutRoles} users without roleRef`);
    } else {
      console.log(`\n✅ All users have roles assigned`);
    }
    
    // Verify roles
    const roles = await Role.find();
    console.log(`\n📋 Roles:`);
    for (const role of roles) {
      const enabledCount = role.getEnabledPermissions().length;
      const userCount = await User.countDocuments({ roleRef: role._id });
      console.log(`   - ${role.roleName}: ${enabledCount} permissions enabled, ${userCount} user(s) assigned`);
    }
    
    console.log("\n✅ Data verification completed");
  } catch (error) {
    console.error("❌ Error verifying data:", error);
    throw error;
  }
};

const runAllTests = async () => {
  try {
    console.log("🚀 Starting comprehensive database setup and testing...\n");
    console.log("=" .repeat(60));
    
    // Connect to database
    connectDatabase();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 1: Drop all collections
    await dropAllCollections();

    // Step 2: Create system roles
    const roles = await createSystemRoles();

    // Step 3: Create test users
    const users = await createTestUsers(roles);

    // Step 4: Create enum data
    await createTestEnums();

    // Step 5: Create test family members
    await createTestFamilyMembers(users);

    // Step 6: Test permissions
    await testPermissions();

    // Step 7: Test role management
    await testRoleManagement();

    // Step 8: Verify all data
    await verifyData();

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("\n📋 Test Accounts Created:");
    console.log("   ┌─────────────────────────────────────────────────┐");
    console.log("   │ Admin: admin@test.com / 9876543210             │");
    console.log("   │ User: user@test.com / 9876543211               │");
    console.log("   │ Committee: committee@test.com / 9876543212      │");
    console.log("   │ Pending: pending@test.com / 9876543213         │");
    console.log("   │ Event Manager: rajesh@test.com / 9876543214    │");
    console.log("   └─────────────────────────────────────────────────┘");
    console.log("\n🔑 All passwords: 12345678");
    console.log("\n🎯 Next Steps:");
    console.log("   1. Start backend: npm run dev (in backend folder)");
    console.log("   2. Start frontend: npm start (in frontend folder)");
    console.log("   3. Login as admin@test.com to test all features");
    console.log("   4. Login as user@test.com to test limited permissions");
    console.log("   5. Login as committee@test.com to test committee permissions");
    console.log("   6. Login as rajesh@test.com to test custom 'Event Manager' role");
    console.log("\n✨ System is ready for testing!");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during testing:", error);
    process.exit(1);
  }
};

// Run the script
runAllTests();

