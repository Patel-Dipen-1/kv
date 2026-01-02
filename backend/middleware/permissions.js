const catchAsyncErrors = require("./catchAsyncErrors");
const ErrorHandler = require("../utils/errorhander");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const { isValidPermission } = require("../constants/permissions");

/**
 * Middleware to check if user has specific permission
 * Usage: authorizePermission("canCreateEvents")
 */
exports.authorizePermission = (permissionKey) => {
  return catchAsyncErrors(async (req, res, next) => {
    // Validate permission key
    if (!isValidPermission(permissionKey)) {
      return next(new ErrorHandler(`Invalid permission: ${permissionKey}`, 400));
    }

    // Get user from request (set by authenticate middleware)
    if (!req.user || !req.user._id) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    // Fetch user with role populated
    const user = await User.findById(req.user._id).populate("roleRef");

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // If user has no role assigned, deny access
    if (!user.roleRef) {
      return next(new ErrorHandler("No role assigned. Please contact administrator.", 403));
    }

    // Check if role is active
    if (!user.roleRef.isActive) {
      return next(new ErrorHandler("Your role is inactive. Please contact administrator.", 403));
    }

    // Check permission
    const hasPermission = user.roleRef.hasPermission(permissionKey);

    if (!hasPermission) {
      return next(
        new ErrorHandler(
          `You don't have permission to perform this action. Required: ${permissionKey}`,
          403
        )
      );
    }

    // Attach role to request for use in controllers
    req.userRole = user.roleRef;
    req.userPermissions = user.roleRef.permissions;

    next();
  });
};

/**
 * Middleware to check if user has any of the specified permissions
 * Usage: authorizeAnyPermission(["canCreateEvents", "canEditEvents"])
 */
exports.authorizeAnyPermission = (permissionKeys) => {
  return catchAsyncErrors(async (req, res, next) => {
    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
      return next(new ErrorHandler("Invalid permission keys", 400));
    }

    // Validate all permission keys
    for (const key of permissionKeys) {
      if (!isValidPermission(key)) {
        return next(new ErrorHandler(`Invalid permission: ${key}`, 400));
      }
    }

    if (!req.user || !req.user._id) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    const user = await User.findById(req.user._id).populate("roleRef");

    if (!user || !user.roleRef) {
      return next(new ErrorHandler("No role assigned. Please contact administrator.", 403));
    }

    if (!user.roleRef.isActive) {
      return next(new ErrorHandler("Your role is inactive. Please contact administrator.", 403));
    }

    // Check if user has at least one of the required permissions
    const hasAnyPermission = permissionKeys.some((key) => user.roleRef.hasPermission(key));

    if (!hasAnyPermission) {
      return next(
        new ErrorHandler(
          `You don't have permission to perform this action. Required: ${permissionKeys.join(" or ")}`,
          403
        )
      );
    }

    req.userRole = user.roleRef;
    req.userPermissions = user.roleRef.permissions;

    next();
  });
};

/**
 * Middleware to check if user has all of the specified permissions
 * Usage: authorizeAllPermissions(["canViewUsers", "canEditUsers"])
 */
exports.authorizeAllPermissions = (permissionKeys) => {
  return catchAsyncErrors(async (req, res, next) => {
    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
      return next(new ErrorHandler("Invalid permission keys", 400));
    }

    for (const key of permissionKeys) {
      if (!isValidPermission(key)) {
        return next(new ErrorHandler(`Invalid permission: ${key}`, 400));
      }
    }

    if (!req.user || !req.user._id) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    const user = await User.findById(req.user._id).populate("roleRef");

    if (!user || !user.roleRef) {
      return next(new ErrorHandler("No role assigned. Please contact administrator.", 403));
    }

    if (!user.roleRef.isActive) {
      return next(new ErrorHandler("Your role is inactive. Please contact administrator.", 403));
    }

    // Check if user has all required permissions
    const hasAllPermissions = permissionKeys.every((key) => user.roleRef.hasPermission(key));

    if (!hasAllPermissions) {
      return next(
        new ErrorHandler(
          `You don't have permission to perform this action. Required: ${permissionKeys.join(" and ")}`,
          403
        )
      );
    }

    req.userRole = user.roleRef;
    req.userPermissions = user.roleRef.permissions;

    next();
  });
};

