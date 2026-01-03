const express = require("express");
const router = express.Router();
const {
  addFamilyMember,
  getMyFamilyMembers,
  updateFamilyMember,
  deleteFamilyMember,
  getPendingFamilyMembers,
  approveFamilyMember,
  rejectFamilyMember,
  getAllFamilyMembersBySubFamily,
  adminUpdateFamilyMember,
  adminDeleteFamilyMember,
} = require("../controllers/familyMemberController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");
const {
  addFamilyMemberValidation,
  updateFamilyMemberValidation,
} = require("../validation/familyMemberValidation");

/**
 * @route   POST /api/family-members
 * @desc    Add family member (authenticated user)
 * @access  Private
 */
router.post(
  "/family-members",
  authenticate,
  addFamilyMemberValidation,
  addFamilyMember
);

/**
 * @route   GET /api/family-members/my
 * @desc    Get my family members (authenticated user)
 * @access  Private
 */
router.get("/family-members/my", authenticate, getMyFamilyMembers);

/**
 * @route   PATCH /api/family-members/:id
 * @desc    Update family member (authenticated user, only their own)
 * @access  Private
 */
router.patch(
  "/family-members/:id",
  authenticate,
  updateFamilyMemberValidation,
  updateFamilyMember
);

/**
 * @route   DELETE /api/family-members/:id
 * @desc    Delete family member (authenticated user, only their own)
 * @access  Private
 */
router.delete("/family-members/:id", authenticate, deleteFamilyMember);

/**
 * @route   GET /api/family-members/pending
 * @desc    Get pending family members (admin/moderator)
 * @access  Private (Admin/Moderator)
 */
router.get(
  "/family-members/pending",
  authenticate,
  authorizePermission("canViewPendingFamilyMembers"),
  getPendingFamilyMembers
);

/**
 * @route   PATCH /api/family-members/:id/approve
 * @desc    Approve family member (admin only)
 * @access  Private (Admin)
 */
router.patch(
  "/family-members/:id/approve",
  authenticate,
  authorizePermission("canApproveFamilyMembers"),
  approveFamilyMember
);

/**
 * @route   PATCH /api/family-members/:id/reject
 * @desc    Reject family member (admin only)
 * @access  Private (Admin)
 */
router.patch(
  "/family-members/:id/reject",
  authenticate,
  authorizePermission("canRejectFamilyMembers"),
  rejectFamilyMember
);

/**
 * @route   GET /api/family-members/sub-family/:subFamilyNumber
 * @desc    Get all family members by sub family number (admin/moderator)
 * @access  Private (Admin/Moderator)
 */
router.get(
  "/family-members/sub-family/:subFamilyNumber",
  authenticate,
  authorizePermission("canViewFamilyMembers"),
  getAllFamilyMembersBySubFamily
);

/**
 * @route   PATCH /api/admin/family-members/:id
 * @desc    Update family member (Admin only)
 * @access  Private (Admin - canManageUsers)
 */
router.patch(
  "/admin/family-members/:id",
  authenticate,
  authorizePermission("canManageUsers"),
  updateFamilyMemberValidation,
  adminUpdateFamilyMember
);

/**
 * @route   DELETE /api/admin/family-members/:id
 * @desc    Delete family member (Admin only)
 * @access  Private (Admin - canManageUsers)
 */
router.delete(
  "/admin/family-members/:id",
  authenticate,
  authorizePermission("canManageUsers"),
  adminDeleteFamilyMember
);

module.exports = router;

