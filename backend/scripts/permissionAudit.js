/**
 * Comprehensive Permission Audit Script
 * Scans entire codebase to find permission inconsistencies
 * 
 * Usage: node backend/scripts/permissionAudit.js
 */

require("dotenv").config({ path: "backend/config/config.env" });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { getAllPermissionKeys, PERMISSIONS } = require("../constants/permissions");

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

// Scan backend files for permission usage
const scanBackend = () => {
  const backendDir = path.join(__dirname, "..");
  const routesDir = path.join(backendDir, "routes");
  const controllersDir = path.join(backendDir, "controllers");
  
  const backendPermissions = new Set();
  const routePermissions = new Map(); // route -> [permissions]
  
  // Scan routes
  if (fs.existsSync(routesDir)) {
    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith(".js"));
    routeFiles.forEach(file => {
      const filePath = path.join(routesDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      
      // Find authorizePermission calls
      const permissionMatches = content.matchAll(/authorizePermission\(["']([^"']+)["']\)/g);
      for (const match of permissionMatches) {
        backendPermissions.add(match[1]);
        const route = `${file}:${match[1]}`;
        if (!routePermissions.has(route)) {
          routePermissions.set(route, []);
        }
        routePermissions.get(route).push(match[1]);
      }
    });
  }
  
  return { backendPermissions, routePermissions };
};

// Scan frontend files for permission usage
const scanFrontend = () => {
  const frontendDir = path.join(__dirname, "../../frontend/src");
  const frontendPermissions = new Set();
  const componentPermissions = new Map(); // component -> [permissions]
  
  const scanDirectory = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith(".jsx") || file.endsWith(".js")) {
        const content = fs.readFileSync(filePath, "utf8");
        
        // Find usePermission calls
        const usePermissionMatches = content.matchAll(/usePermission\(["']([^"']+)["']\)/g);
        for (const match of usePermissionMatches) {
          frontendPermissions.add(match[1]);
          const component = path.relative(frontendDir, filePath);
          if (!componentPermissions.has(component)) {
            componentPermissions.set(component, []);
          }
          componentPermissions.get(component).push(match[1]);
        }
        
        // Find requiredPermission in ProtectedRoute
        const routeMatches = content.matchAll(/requiredPermission=["']([^"']+)["']/g);
        for (const match of routeMatches) {
          frontendPermissions.add(match[1]);
          const component = path.relative(frontendDir, filePath);
          if (!componentPermissions.has(component)) {
            componentPermissions.set(component, []);
          }
          componentPermissions.get(component).push(match[1]);
        }
      }
    });
  };
  
  scanDirectory(frontendDir);
  return { frontendPermissions, componentPermissions };
};

// Check admin role permissions
const checkAdminRole = async () => {
  const Role = require("../models/roleModel");
  const adminRole = await Role.findOne({ roleKey: "admin" });
  
  if (!adminRole) {
    return { error: "Admin role not found" };
  }
  
  const allPermissionKeys = getAllPermissionKeys();
  const adminPerms = adminRole.permissions;
  const missingPermissions = [];
  const disabledPermissions = [];
  
  allPermissionKeys.forEach(key => {
    if (!adminPerms.has(key)) {
      missingPermissions.push(key);
    } else if (adminPerms.get(key) !== true) {
      disabledPermissions.push(key);
    }
  });
  
  const enabledCount = Array.from(adminPerms.values()).filter(v => v === true).length;
  
  return {
    totalPermissions: allPermissionKeys.length,
    enabledPermissions: enabledCount,
    missingPermissions,
    disabledPermissions,
    allEnabled: missingPermissions.length === 0 && disabledPermissions.length === 0
  };
};

// Main audit function
const runAudit = async () => {
  try {
    console.log("🔍 Starting Comprehensive Permission Audit...\n");
    console.log("=".repeat(70));
    
    // Get all permissions from enum
    const enumPermissions = new Set(getAllPermissionKeys());
    console.log(`\n📋 Enum Permissions: ${enumPermissions.size} total\n`);
    
    // Scan backend
    console.log("🔍 Scanning backend routes and controllers...");
    const { backendPermissions, routePermissions } = scanBackend();
    console.log(`   Found ${backendPermissions.size} unique permissions in backend\n`);
    
    // Scan frontend
    console.log("🔍 Scanning frontend components...");
    const { frontendPermissions, componentPermissions } = scanFrontend();
    console.log(`   Found ${frontendPermissions.size} unique permissions in frontend\n`);
    
    // Compare
    console.log("🔍 Comparing permissions...\n");
    
    const issues = {
      missingInBackend: [],
      missingInFrontend: [],
      missingInEnum: [],
      nameMismatches: []
    };
    
    // Check enum vs backend
    enumPermissions.forEach(perm => {
      if (!backendPermissions.has(perm)) {
        // Check if it's used in frontend
        if (frontendPermissions.has(perm)) {
          issues.missingInBackend.push(perm);
        }
      }
    });
    
    // Check enum vs frontend
    enumPermissions.forEach(perm => {
      if (!frontendPermissions.has(perm)) {
        // Check if it's used in backend
        if (backendPermissions.has(perm)) {
          issues.missingInFrontend.push(perm);
        }
      }
    });
    
    // Check for permissions used but not in enum
    backendPermissions.forEach(perm => {
      if (!enumPermissions.has(perm)) {
        issues.missingInEnum.push(`Backend: ${perm}`);
      }
    });
    
    frontendPermissions.forEach(perm => {
      if (!enumPermissions.has(perm)) {
        issues.missingInEnum.push(`Frontend: ${perm}`);
      }
    });
    
    // Connect to database and check admin role
    console.log("🔍 Checking admin role permissions...");
    connectDatabase();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const adminCheck = await checkAdminRole();
    
    // Generate report
    console.log("\n" + "=".repeat(70));
    console.log("📊 PERMISSION AUDIT REPORT");
    console.log("=".repeat(70));
    
    console.log(`\n✅ Enum Permissions: ${enumPermissions.size}`);
    console.log(`✅ Backend Permissions Found: ${backendPermissions.size}`);
    console.log(`✅ Frontend Permissions Found: ${frontendPermissions.size}`);
    
    if (adminCheck.allEnabled) {
      console.log(`✅ Admin Role: ${adminCheck.enabledPermissions}/${adminCheck.totalPermissions} permissions enabled`);
    } else {
      console.log(`❌ Admin Role: ${adminCheck.enabledPermissions}/${adminCheck.totalPermissions} permissions enabled`);
      if (adminCheck.missingPermissions.length > 0) {
        console.log(`   Missing: ${adminCheck.missingPermissions.join(", ")}`);
      }
      if (adminCheck.disabledPermissions.length > 0) {
        console.log(`   Disabled: ${adminCheck.disabledPermissions.join(", ")}`);
      }
    }
    
    // Report issues
    if (issues.missingInBackend.length > 0) {
      console.log(`\n❌ MISSING IN BACKEND (${issues.missingInBackend.length}):`);
      issues.missingInBackend.forEach(perm => {
        console.log(`   - ${perm} (used in frontend but no backend check)`);
      });
    }
    
    if (issues.missingInFrontend.length > 0) {
      console.log(`\n❌ MISSING IN FRONTEND (${issues.missingInFrontend.length}):`);
      issues.missingInFrontend.forEach(perm => {
        console.log(`   - ${perm} (checked in backend but not used in frontend)`);
      });
    }
    
    if (issues.missingInEnum.length > 0) {
      console.log(`\n❌ MISSING IN ENUM (${issues.missingInEnum.length}):`);
      issues.missingInEnum.forEach(perm => {
        console.log(`   - ${perm}`);
      });
    }
    
    if (issues.missingInBackend.length === 0 && 
        issues.missingInFrontend.length === 0 && 
        issues.missingInEnum.length === 0 &&
        adminCheck.allEnabled) {
      console.log("\n✅ NO ISSUES FOUND! All permissions are consistent.");
    }
    
    // List all permissions
    console.log("\n" + "=".repeat(70));
    console.log("📋 COMPLETE PERMISSIONS LIST");
    console.log("=".repeat(70));
    
    Object.keys(PERMISSIONS).forEach(category => {
      console.log(`\n${category}:`);
      Object.values(PERMISSIONS[category]).forEach(perm => {
        const inBackend = backendPermissions.has(perm.key) ? "✓" : "✗";
        const inFrontend = frontendPermissions.has(perm.key) ? "✓" : "✗";
        console.log(`   ${inBackend}${inFrontend} ${perm.key} - ${perm.label}`);
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

runAudit();

