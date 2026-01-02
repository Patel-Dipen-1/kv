const express = require("express");
const router = express.Router();
const {
  getActivityLogs,
  getActivityLogById,
} = require("../controllers/activityLogController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");

/**
 * @route   GET /api/admin/activity-logs
 * @desc    Get activity logs (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/",
  authenticate,
  authorizePermission("canViewActivityLogs"),
  getActivityLogs
);

/**
 * @route   GET /api/admin/activity-logs/:id
 * @desc    Get activity log by ID (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/:id",
  authenticate,
  authorizePermission("canViewActivityLogs"),
  getActivityLogById
);

module.exports = router;

