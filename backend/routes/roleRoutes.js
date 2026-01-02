const express = require("express");
const router = express.Router();
const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  assignRoleToUser,
  getAllPermissions,
  initializeSystemRoles,
} = require("../controllers/roleController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");

/**
 * @route   GET /api/admin/permissions
 * @desc    Get all available permissions (for role creation form)
 * @access  Private (Admin)
 */
router.get(
  "/permissions",
  authenticate,
  authorizePermission("canManageRoles"),
  getAllPermissions
);

/**
 * @route   POST /api/admin/roles/initialize
 * @desc    Initialize default system roles (one-time setup)
 * @access  Private (Admin)
 */
router.post(
  "/initialize",
  authenticate,
  authorizePermission("canManageRoles"),
  initializeSystemRoles
);

/**
 * @route   GET /api/admin/roles
 * @desc    Get all roles
 * @access  Private (Admin with canManageRoles permission)
 */
router.get(
  "/",
  authenticate,
  authorizePermission("canManageRoles"),
  getAllRoles
);

/**
 * @route   GET /api/admin/roles/:id
 * @desc    Get single role by ID
 * @access  Private (Admin with canManageRoles permission)
 */
router.get(
  "/:id",
  authenticate,
  authorizePermission("canManageRoles"),
  getRoleById
);

/**
 * @route   POST /api/admin/roles
 * @desc    Create new custom role
 * @access  Private (Admin with canManageRoles permission)
 */
router.post(
  "/",
  authenticate,
  authorizePermission("canManageRoles"),
  createRole
);

/**
 * @route   PATCH /api/admin/roles/:id
 * @desc    Update role permissions
 * @access  Private (Admin with canManageRoles permission)
 */
router.patch(
  "/:id",
  authenticate,
  authorizePermission("canManageRoles"),
  updateRole
);

/**
 * @route   DELETE /api/admin/roles/:id
 * @desc    Delete custom role (soft delete)
 * @access  Private (Admin with canManageRoles permission)
 */
router.delete(
  "/:id",
  authenticate,
  authorizePermission("canManageRoles"),
  deleteRole
);

/**
 * @route   PATCH /api/admin/roles/users/:userId/assign
 * @desc    Assign role to user
 * @access  Private (Admin with canChangeRoles permission)
 */
router.patch(
  "/users/:userId/assign",
  authenticate,
  authorizePermission("canChangeRoles"),
  assignRoleToUser
);

module.exports = router;

