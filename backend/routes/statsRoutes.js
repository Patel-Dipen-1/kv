const express = require("express");
const router = express.Router();
const { getUserStats } = require("../controllers/statsController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");

/**
 * @route   GET /api/admin/stats
 * @desc    Get comprehensive user statistics (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/",
  authenticate,
  authorizePermission("canViewStats"),
  getUserStats
);

module.exports = router;

