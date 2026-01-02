const express = require("express");
const router = express.Router();
const {
  exportAllUsers,
  exportPendingUsers,
  exportFamilyTree,
  exportCommitteeMembers,
} = require("../controllers/exportController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");

/**
 * @route   GET /api/admin/export/users
 * @desc    Export all users to CSV (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/users",
  authenticate,
  authorizePermission("canExportData"),
  exportAllUsers
);

/**
 * @route   GET /api/admin/export/pending-users
 * @desc    Export pending users to CSV (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/pending-users",
  authenticate,
  authorizePermission("canExportData"),
  exportPendingUsers
);

/**
 * @route   GET /api/admin/export/family-tree/:subFamilyNumber
 * @desc    Export family tree for specific subFamilyNumber (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/family-tree/:subFamilyNumber",
  authenticate,
  authorizePermission("canExportData"),
  exportFamilyTree
);

/**
 * @route   GET /api/admin/export/committee-members
 * @desc    Export committee members to CSV (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/committee-members",
  authenticate,
  authorizePermission("canExportData"),
  exportCommitteeMembers
);

module.exports = router;

