const Role = require("../models/roleModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const {
  createDefaultPermissions,
  getAllPermissions,
  getPermissionsByCategory,
  isValidPermission,
} = require("../constants/permissions");

/**
 * Initialize default system roles
 * This should be called once on app startup
 * POST /api/admin/roles/initialize
 */
exports.initializeSystemRoles = catchAsyncErrors(async (req, res, next) => {
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

  // Assign default "User" role to existing users without roleRef
  const defaultUserRole = createdRoles.find((r) => r.roleKey === "user");
  if (defaultUserRole) {
    await User.updateMany(
      { roleRef: { $exists: false } },
      { $set: { roleRef: defaultUserRole._id } }
    );
  }

  res.status(200).json({
    success: true,
    message: `Successfully initialized ${createdRoles.length} system roles`,
    data: createdRoles,
  });
});

/**
 * Create a new custom role
 * POST /api/admin/roles
 */
exports.createRole = catchAsyncErrors(async (req, res, next) => {
  const { roleName, description, permissions } = req.body;

  if (!roleName || !roleName.trim()) {
    return next(new ErrorHandler("Role name is required", 400));
  }

  // Check if role with same name already exists
  const existingRole = await Role.findOne({
    roleName: roleName.trim(),
    isActive: true,
  });

  if (existingRole) {
    return next(new ErrorHandler("Role with this name already exists", 409));
  }

  // Validate permissions
  const defaultPerms = createDefaultPermissions();
  const rolePermissions = { ...defaultPerms };

  if (permissions && typeof permissions === "object") {
    Object.keys(permissions).forEach((key) => {
      if (isValidPermission(key) && typeof permissions[key] === "boolean") {
        rolePermissions[key] = permissions[key];
      }
    });
  }

  // Check if at least one permission is enabled
  const hasAnyPermission = Object.values(rolePermissions).some((val) => val === true);
  if (!hasAnyPermission) {
    return next(new ErrorHandler("At least one permission must be enabled", 400));
  }

  // Create role
  const role = await Role.create({
    roleName: roleName.trim(),
    description: description?.trim() || "",
    permissions: rolePermissions,
    isSystemRole: false,
    isActive: true,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Role created successfully",
    data: role,
  });
});

/**
 * Get all roles
 * GET /api/admin/roles
 */
exports.getAllRoles = catchAsyncErrors(async (req, res, next) => {
  const { includeInactive } = req.query;
  const query = includeInactive === "true" ? {} : { isActive: true };

  const roles = await Role.find(query)
    .populate("createdBy", "firstName lastName email")
    .sort({ isSystemRole: -1, roleName: 1 }); // System roles first, then alphabetically

  // Get user count for each role
  const rolesWithCounts = await Promise.all(
    roles.map(async (role) => {
      const userCount = await User.countDocuments({ roleRef: role._id, isActive: true });
      const enabledPermissionsCount = role.getEnabledPermissions().length;
      const totalPermissionsCount = Object.keys(role.permissions || {}).length;

      return {
        _id: role._id,
        roleName: role.roleName,
        roleKey: role.roleKey,
        description: role.description,
        isSystemRole: role.isSystemRole,
        isActive: role.isActive,
        enabledPermissionsCount,
        totalPermissionsCount,
        userCount,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        createdBy: role.createdBy,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: rolesWithCounts.length,
    data: rolesWithCounts,
  });
});

/**
 * Get single role by ID
 * GET /api/admin/roles/:id
 */
exports.getRoleById = catchAsyncErrors(async (req, res, next) => {
  const role = await Role.findById(req.params.id).populate("createdBy", "firstName lastName email");

  if (!role) {
    return next(new ErrorHandler("Role not found", 404));
  }

  // Get users with this role
  const users = await User.find({ roleRef: role._id, isActive: true })
    .select("firstName lastName email role status")
    .limit(10);

  const enabledPermissions = role.getEnabledPermissions();
  const allPermissions = getAllPermissions();

  res.status(200).json({
    success: true,
    data: {
      role,
      enabledPermissions,
      allPermissions,
      users: users,
      userCount: await User.countDocuments({ roleRef: role._id, isActive: true }),
    },
  });
});

/**
 * Update role permissions
 * PATCH /api/admin/roles/:id
 */
exports.updateRole = catchAsyncErrors(async (req, res, next) => {
  const { roleName, description, permissions } = req.body;

  const role = await Role.findById(req.params.id);

  if (!role) {
    return next(new ErrorHandler("Role not found", 404));
  }

  // Check if it's a system role - restrict certain changes
  if (role.isSystemRole) {
    // For system roles, only allow description and limited permission changes
    if (roleName && roleName.trim() !== role.roleName) {
      return next(new ErrorHandler("Cannot change name of system role", 400));
    }

    // For admin role, prevent disabling critical permissions
    if (role.roleKey === "admin" && permissions) {
      const criticalPermissions = ["canManageRoles", "canManageSettings"];
      criticalPermissions.forEach((perm) => {
        if (permissions[perm] === false) {
          return next(
            new ErrorHandler(`Cannot disable critical permission: ${perm}`, 400)
          );
        }
      });
    }
  } else {
    // For custom roles, allow name change
    if (roleName && roleName.trim() && roleName.trim() !== role.roleName) {
      const existingRole = await Role.findOne({
        roleName: roleName.trim(),
        isActive: true,
        _id: { $ne: role._id },
      });

      if (existingRole) {
        return next(new ErrorHandler("Role with this name already exists", 409));
      }

      role.roleName = roleName.trim();
    }
  }

  // Update description
  if (description !== undefined) {
    role.description = description?.trim() || "";
  }

  // Update permissions
  if (permissions && typeof permissions === "object") {
    const defaultPerms = createDefaultPermissions();
    Object.keys(defaultPerms).forEach((key) => {
      if (isValidPermission(key) && permissions.hasOwnProperty(key)) {
        role.permissions.set(key, permissions[key] === true);
      }
    });

    // Validate at least one permission is enabled
    const hasAnyPermission = Array.from(role.permissions.values()).some((val) => val === true);
    if (!hasAnyPermission) {
      return next(new ErrorHandler("At least one permission must be enabled", 400));
    }
  }

  await role.save();

  res.status(200).json({
    success: true,
    message: "Role updated successfully",
    data: role,
  });
});

/**
 * Delete role (soft delete)
 * DELETE /api/admin/roles/:id
 */
exports.deleteRole = catchAsyncErrors(async (req, res, next) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return next(new ErrorHandler("Role not found", 404));
  }

  // Cannot delete system roles
  if (role.isSystemRole) {
    return next(new ErrorHandler("Cannot delete system role", 400));
  }

  // Check if any users have this role
  const userCount = await User.countDocuments({ roleRef: role._id, isActive: true });

  if (userCount > 0) {
    return next(
      new ErrorHandler(
        `Cannot delete role. ${userCount} user(s) still have this role. Please reassign them first.`,
        400
      )
    );
  }

  // Soft delete
  role.isActive = false;
  await role.save();

  res.status(200).json({
    success: true,
    message: "Role deleted successfully",
  });
});

/**
 * Assign role to user
 * PATCH /api/admin/users/:userId/role
 */
exports.assignRoleToUser = catchAsyncErrors(async (req, res, next) => {
  const { roleId } = req.body;
  const { userId } = req.params;

  if (!roleId) {
    return next(new ErrorHandler("Role ID is required", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const role = await Role.findById(roleId);
  if (!role || !role.isActive) {
    return next(new ErrorHandler("Role not found or inactive", 404));
  }

  // Update user's role reference
  user.roleRef = role._id;

  // Update role type for backward compatibility
  if (role.roleKey === "admin") {
    user.role = "admin";
  } else if (role.roleKey === "committee") {
    user.role = "committee";
  } else {
    user.role = "user";
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Role assigned successfully",
    data: {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        roleRef: user.roleRef,
      },
      role: {
        _id: role._id,
        roleName: role.roleName,
        roleKey: role.roleKey,
      },
    },
  });
});

/**
 * Get all permissions (for frontend form)
 * GET /api/admin/permissions
 */
exports.getAllPermissions = catchAsyncErrors(async (req, res, next) => {
  const permissions = getPermissionsByCategory();

  res.status(200).json({
    success: true,
    data: permissions,
    flat: getAllPermissions(),
  });
});

