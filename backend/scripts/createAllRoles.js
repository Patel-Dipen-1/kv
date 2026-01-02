/**
 * Script to Create All System Roles in Database
 * 
 * This script will:
 * 1. Connect to database
 * 2. Create all system roles (Admin, User, Committee Member)
 * 3. Set proper permissions for each role
 * 4. Display summary of created/updated roles
 * 
 * Usage: 
 *   node backend/scripts/createAllRoles.js
 *   node backend/scripts/createAllRoles.js --update  # Force update existing roles
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
const Role = require("../models/roleModel");
const { createDefaultPermissions } = require("../constants/permissions");

// Connect to database
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}\n`);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1);
  }
};

// Define all system roles with their permissions
const getAllSystemRoles = () => {
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

  // Set User permissions (view only + basic family management)
  defaultRoles[1].permissions.canViewEvents = true;
  defaultRoles[1].permissions.canViewCommittee = true;
  defaultRoles[1].permissions.canViewOwnProfile = true;
  defaultRoles[1].permissions.canManageOwnFamily = true;
  defaultRoles[1].permissions.canCommentOnEvents = true;

  // Set Committee Member permissions
  defaultRoles[2].permissions.canViewUsers = true;
  defaultRoles[2].permissions.canViewFamilyMembers = true;
  defaultRoles[2].permissions.canViewEvents = true;
  defaultRoles[2].permissions.canViewCommittee = true;
  defaultRoles[2].permissions.canViewReports = true;
  defaultRoles[2].permissions.canCreateEvents = true;
  defaultRoles[2].permissions.canEditEvents = true;
  defaultRoles[2].permissions.canDeleteEvents = true;
  defaultRoles[2].permissions.canCommentOnEvents = true;
  defaultRoles[2].permissions.canApproveEventComments = true;

  return defaultRoles;
};

// Create or update all roles
const createAllRoles = async (forceUpdate = false) => {
  console.log("=".repeat(80));
  console.log("🔐 CREATING ALL SYSTEM ROLES");
  console.log("=".repeat(80) + "\n");

  const systemRoles = getAllSystemRoles();
  const createdRoles = [];
  const updatedRoles = [];
  const skippedRoles = [];

  for (const roleData of systemRoles) {
    try {
      // Ensure roleKey is set
      if (!roleData.roleKey && roleData.roleName) {
        roleData.roleKey = roleData.roleName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
      }

      // Check if role already exists
      let role = await Role.findOne({ roleKey: roleData.roleKey });

      if (!role) {
        // Create new role
        // Convert permissions object to Map
        const permMap = new Map();
        if (roleData.permissions) {
          Object.keys(roleData.permissions).forEach((key) => {
            permMap.set(key, roleData.permissions[key]);
          });
        }

        // Create role with Map permissions
        role = await Role.create({
          roleName: roleData.roleName,
          roleKey: roleData.roleKey,
          description: roleData.description,
          isSystemRole: roleData.isSystemRole,
          permissions: permMap,
        });

        const enabledCount = role.getEnabledPermissions().length;
        console.log(`✅ Created: ${role.roleName} (${role.roleKey}) - ${enabledCount} permissions enabled`);
        createdRoles.push(role);
      } else {
        // Role exists - update if forceUpdate is true
        if (forceUpdate) {
          // Convert permissions object to Map
          const permMap = new Map();
          if (roleData.permissions) {
            Object.keys(roleData.permissions).forEach((key) => {
              permMap.set(key, roleData.permissions[key]);
            });
          }

          role.permissions = permMap;
          role.description = roleData.description;
          await role.save();

          const enabledCount = role.getEnabledPermissions().length;
          console.log(`🔄 Updated: ${role.roleName} (${role.roleKey}) - ${enabledCount} permissions enabled`);
          updatedRoles.push(role);
        } else {
          const enabledCount = role.getEnabledPermissions().length;
          console.log(`⏭️  Skipped: ${role.roleName} (${role.roleKey}) - Already exists (${enabledCount} permissions enabled)`);
          skippedRoles.push(role);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing role ${roleData.roleName}:`, error.message);
    }
  }

  return { createdRoles, updatedRoles, skippedRoles };
};

// Display summary
const displaySummary = async (result) => {
  console.log("\n" + "=".repeat(80));
  console.log("📊 SUMMARY");
  console.log("=".repeat(80) + "\n");

  const { createdRoles, updatedRoles, skippedRoles } = result;

  console.log(`✅ Created: ${createdRoles.length} role(s)`);
  console.log(`🔄 Updated: ${updatedRoles.length} role(s)`);
  console.log(`⏭️  Skipped: ${skippedRoles.length} role(s)`);
  console.log(`📋 Total: ${createdRoles.length + updatedRoles.length + skippedRoles.length} role(s)\n`);

  // Show all roles with details
  const allRoles = await Role.find({ isActive: true }).sort({ isSystemRole: -1, roleName: 1 });

  if (allRoles.length > 0) {
    console.log("=".repeat(80));
    console.log("📋 ALL ROLES IN DATABASE");
    console.log("=".repeat(80) + "\n");

    allRoles.forEach((role, index) => {
      const enabledPerms = role.getEnabledPermissions();
      const totalPerms = role.permissions ? role.permissions.size : 0;
      const systemBadge = role.isSystemRole ? " [SYSTEM]" : "";
      const activeBadge = role.isActive ? "" : " [INACTIVE]";

      console.log(`${index + 1}. ${role.roleName}${systemBadge}${activeBadge}`);
      console.log(`   Key: ${role.roleKey}`);
      console.log(`   Description: ${role.description || "N/A"}`);
      console.log(`   Permissions: ${enabledPerms.length}/${totalPerms} enabled`);
      
      if (enabledPerms.length > 0 && enabledPerms.length <= 10) {
        console.log(`   Enabled: ${enabledPerms.slice(0, 5).join(", ")}${enabledPerms.length > 5 ? "..." : ""}`);
      } else if (enabledPerms.length > 10) {
        console.log(`   Enabled: ${enabledPerms.slice(0, 5).join(", ")}... (+${enabledPerms.length - 5} more)`);
      }
      console.log();
    });
  }

  // Show permission breakdown by category
  console.log("=".repeat(80));
  console.log("🔑 PERMISSION BREAKDOWN BY ROLE");
  console.log("=".repeat(80) + "\n");

  const systemRoles = allRoles.filter((r) => r.isSystemRole);
  systemRoles.forEach((role) => {
    const enabledPerms = role.getEnabledPermissions();
    console.log(`${role.roleName} (${role.roleKey}):`);
    console.log(`  Total enabled: ${enabledPerms.length}`);
    
    // Group permissions by category (rough grouping)
    const categories = {
      User: enabledPerms.filter((p) => p.includes("User") || p.includes("Manage")),
      Family: enabledPerms.filter((p) => p.includes("Family")),
      Event: enabledPerms.filter((p) => p.includes("Event")),
      Committee: enabledPerms.filter((p) => p.includes("Committee")),
      Role: enabledPerms.filter((p) => p.includes("Role")),
      Settings: enabledPerms.filter((p) => p.includes("Setting")),
      Other: enabledPerms.filter((p) => 
        !p.includes("User") && !p.includes("Family") && 
        !p.includes("Event") && !p.includes("Committee") && 
        !p.includes("Role") && !p.includes("Setting")
      ),
    };

    Object.keys(categories).forEach((category) => {
      if (categories[category].length > 0) {
        console.log(`    ${category}: ${categories[category].length} permission(s)`);
      }
    });
    console.log();
  });

  console.log("=".repeat(80) + "\n");
};

// Main function
const main = async () => {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🚀 CREATE ALL ROLES SCRIPT");
    console.log("=".repeat(80));
    console.log("\nThis script will create/update all system roles in the database.\n");

    await connectDatabase();

    // Check for update flag
    const args = process.argv.slice(2);
    const forceUpdate = args.includes("--update") || args.includes("-u");

    if (forceUpdate) {
      console.log("⚠️  Update mode enabled. Existing roles will be updated.\n");
    } else {
      console.log("ℹ️  Existing roles will be skipped. Use --update flag to force update.\n");
    }

    // Create all roles
    const result = await createAllRoles(forceUpdate);

    // Display summary
    await displaySummary(result);

    console.log("✅ Script completed successfully!\n");
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

