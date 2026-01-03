const express = require("express");
const router = express.Router();
const {
  getMe,
  updateMe,
  updateRole,
  changePassword,
  getUsers,
  getUserById,
  deactivateUser,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  getDeletedUsers,
  getFamilyMembers,
  getCombinedFamilyMembers,
  getFamilyMembersForTransfer,
  searchUsers,
  searchFamily,
  getUserFamilyMembers,
  getCommitteeMembers,
  bulkApproveUsers,
  bulkRejectUsers,
  approveUser,
  rejectUser,
  transferPrimaryAccount,
  getAllUsersAndFamilyMembers,
} = require("../controllers/userController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { authorizePermission, authorizeAnyPermission } = require("../middleware/permissions");
const {
  updateProfileValidation,
  updateRoleValidation,
  changePasswordValidation,
  bulkApproveRejectValidation,
} = require("../validation/userValidation");

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, getMe);

/**
 * @route   PATCH /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch("/me", authenticate, updateProfileValidation, updateMe);

/**
 * @route   PATCH /api/users/change-password
 * @desc    Change password
 * @access  Private
 */
router.patch(
  "/change-password",
  authenticate,
  changePasswordValidation,
  changePassword
);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin/Moderator)
 */
router.get(
  "/",
  authenticate,
  authorizePermission("canViewUsers"),
  getUsers
);

/**
 * @route   GET /api/users/search
 * @desc    Search users (admin/moderator only)
 * @access  Private (Admin/Moderator)
 */
router.get(
  "/search",
  authenticate,
  // authorizePermission("canSearchUsers"),
  searchUsers
);

/**
 * @route   GET /api/users/search-family
 * @desc    Search users and families by name or Family ID (Public/Private)
 * @access  Public (or Private if authenticated)
 */
router.get("/search-family", searchFamily);

/**
 * @route   GET /api/committee-members
 * @desc    Get all committee members (Public)
 * @access  Public
 */
router.get("/committee-members", getCommitteeMembers);

/**
 * @route   GET /api/users/committee-members
 * @desc    Get all committee members (Public)
 * @access  Public
 */
router.get("/committee-members", getCommitteeMembers);

/**
 * @route   GET /api/users/family/:subFamilyNumber
 * @desc    Get family members by subFamilyNumber
 * @access  Private
 */
router.get("/family/:subFamilyNumber", authenticate, getFamilyMembers);

/**
 * @route   GET /api/users/family-complete/:subFamilyNumber
 * @desc    Get combined family members (Users + FamilyMembers) with search and pagination
 * @access  Private
 */
router.get(
  "/family-complete/:subFamilyNumber",
  authenticate,
  getCombinedFamilyMembers
);

/**
 * @route   GET /api/users/:id/family-for-transfer
 * @desc    Get family members for transfer (includes User accounts and FamilyMember records)
 * @access  Private (Admin - canManageUsers)
 */
router.get(
  "/:id/family-for-transfer",
  authenticate,
  authorizePermission("canManageUsers"),
  getFamilyMembersForTransfer
);

/**
 * @route   GET /api/users/admin/all-users
 * @desc    Get all users and family members (Admin only)
 * @access  Private (Admin - canViewUsers)
 */
router.get(
  "/admin/all-users",
  authenticate,
  authorizePermission("canViewUsers"),
  getAllUsersAndFamilyMembers
);

/**
 * @route   GET /api/users/:userId/family-members
 * @desc    Get family members for a specific user (on-demand fetch)
 * @access  Public (or Private if authenticated)
 * @note    Must be before /:id route to avoid route conflicts
 */
router.get("/:userId/family-members", getUserFamilyMembers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (self or admin/moderator)
 * @access  Private
 */
router.get("/:id", authenticate, getUserById);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Update user role and status (Admin only)
 * @access  Private (Admin)
 * @note    Requires canChangeRoles for role changes OR canApproveUsers for status changes
 */
router.patch(
  "/:id/role",
  authenticate,
  authorizeAnyPermission(["canChangeRoles", "canApproveUsers"]), // Can change role OR approve/reject
  updateRoleValidation,
  updateRole
);

/**
 * @route   PATCH /api/users/:id/approve
 * @desc    Approve user (change status to approved)
 * @access  Private (Admin - canApproveUsers)
 */
router.patch(
  "/:id/approve",
  authenticate,
  authorizePermission("canApproveUsers"),
  approveUser
);

/**
 * @route   PATCH /api/users/:id/reject
 * @desc    Reject user (change status to rejected)
 * @access  Private (Admin - canApproveUsers)
 */
router.patch(
  "/:id/reject",
  authenticate,
  authorizePermission("canApproveUsers"),
  rejectUser
);

/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Deactivate user (Admin only) - Legacy, redirects to soft delete
 * @access  Private (Admin)
 */
router.patch(
  "/:id/deactivate",
  authenticate,
  authorizePermission("canDeactivateUsers"),
  deactivateUser
);

/**
 * @route   PATCH /api/users/:id/soft-delete
 * @route   DELETE /api/users/:id/soft
 * @desc    Soft delete user (hide but preserve data)
 * @access  Private (Admin - canDeleteUsers)
 */
router.patch(
  "/:id/soft-delete",
  authenticate,
  authorizePermission("canDeleteUsers"),
  softDeleteUser
);
router.delete(
  "/:id/soft",
  authenticate,
  authorizePermission("canDeleteUsers"),
  softDeleteUser
);

/**
 * @route   DELETE /api/users/:id/hard
 * @desc    Hard delete user (permanently remove)
 * @access  Private (Admin - canDeleteUsers)
 */
router.delete(
  "/:id/hard",
  authenticate,
  authorizePermission("canDeleteUsers"),
  hardDeleteUser
);

/**
 * @route   PATCH /api/users/:id/restore
 * @desc    Restore soft deleted user
 * @access  Private (Admin - canDeleteUsers)
 */
router.patch(
  "/:id/restore",
  authenticate,
  authorizePermission("canDeleteUsers"),
  restoreUser
);

/**
 * @route   GET /api/users/deleted
 * @desc    Get deleted users (admin only)
 * @access  Private (Admin - canViewUsers)
 */
router.get(
  "/deleted",
  authenticate,
  authorizePermission("canViewUsers"),
  getDeletedUsers
);

/**
 * @route   PATCH /api/users/bulk-approve
 * @desc    Bulk approve users (Admin only)
 * @access  Private (Admin)
 */
router.patch(
  "/bulk-approve",
  authenticate,
  authorizePermission("canBulkApproveUsers"),
  bulkApproveRejectValidation,
  bulkApproveUsers
);

/**
 * @route   PATCH /api/users/bulk-reject
 * @desc    Bulk reject users (Admin only)
 * @access  Private (Admin)
 */
router.patch(
  "/bulk-reject",
  authenticate,
  authorizePermission("canBulkRejectUsers"),
  bulkApproveRejectValidation,
  bulkRejectUsers
);

/**
 * @route   PATCH /api/users/admin/:id/transfer-primary
 * @desc    Transfer primary account ownership (Admin only)
 * @access  Private (Admin - canManageUsers)
 */
router.patch(
  "/admin/:id/transfer-primary",
  authenticate,
  authorizePermission("canManageUsers"),
  transferPrimaryAccount
);

module.exports = router;

