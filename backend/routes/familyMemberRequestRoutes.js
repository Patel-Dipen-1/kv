const express = require("express");
const router = express.Router();
const {
  createFamilyMemberRequest,
  getAllFamilyMemberRequests,
  getMyFamilyMemberRequests,
  approveFamilyMemberRequest,
  rejectFamilyMemberRequest,
} = require("../controllers/familyMemberRequestController");
const { authenticate } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");

/**
 * @route   POST /api/family-member-requests
 * @desc    Create family member request (authenticated user)
 * @access  Private
 */
router.post("/", authenticate, createFamilyMemberRequest);

/**
 * @route   GET /api/family-member-requests
 * @desc    Get my family member requests (authenticated user)
 * @access  Private
 */
router.get("/", authenticate, getMyFamilyMemberRequests);

/**
 * @route   GET /api/admin/family-member-requests
 * @desc    Get all family member requests (Admin only)
 * @access  Private (Admin - canViewPendingFamilyMembers)
 */
router.get(
  "/admin",
  authenticate,
  authorizePermission("canViewPendingFamilyMembers"),
  getAllFamilyMemberRequests
);

/**
 * @route   PATCH /api/admin/family-member-requests/:id/approve
 * @desc    Approve family member request (Admin only)
 * @access  Private (Admin - canApproveFamilyMembers)
 */
router.patch(
  "/admin/:id/approve",
  authenticate,
  authorizePermission("canApproveFamilyMembers"),
  approveFamilyMemberRequest
);

/**
 * @route   PATCH /api/admin/family-member-requests/:id/reject
 * @desc    Reject family member request (Admin only)
 * @access  Private (Admin - canRejectFamilyMembers)
 */
router.patch(
  "/admin/:id/reject",
  authenticate,
  authorizePermission("canRejectFamilyMembers"),
  rejectFamilyMemberRequest
);

module.exports = router;

