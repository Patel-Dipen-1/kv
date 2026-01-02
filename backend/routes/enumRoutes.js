const express = require("express");
const router = express.Router();
const {
  getAllEnums,
  getEnumByType,
  createOrUpdateEnum,
  addEnumValue,
  removeEnumValue,
  initializeEnums,
} = require("../controllers/enumController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");

/**
 * @route   GET /api/admin/enums
 * @desc    Get all enum types and values (Public - for frontend dropdowns)
 * @access  Public
 */
router.get(
  "/",
  getAllEnums
);

/**
 * @route   GET /api/admin/enums/:enumType
 * @desc    Get single enum type (Admin only)
 * @access  Private (Admin)
 */
router.get(
  "/:enumType",
  authenticate,
  authorizePermission("canManageEnums"),
  getEnumByType
);

/**
 * @route   POST /api/admin/enums
 * @desc    Create or update enum values (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/",
  authenticate,
  authorizePermission("canManageEnums"),
  createOrUpdateEnum
);

/**
 * @route   PATCH /api/admin/enums/:enumType/add-value
 * @desc    Add value to enum (Admin only)
 * @access  Private (Admin)
 */
router.patch(
  "/:enumType/add-value",
  authenticate,
  authorizePermission("canManageEnums"),
  addEnumValue
);

/**
 * @route   PATCH /api/admin/enums/:enumType/remove-value
 * @desc    Remove value from enum (Admin only)
 * @access  Private (Admin)
 */
router.patch(
  "/:enumType/remove-value",
  authenticate,
  authorizePermission("canManageEnums"),
  removeEnumValue
);

/**
 * @route   POST /api/admin/enums/initialize
 * @desc    Initialize enums from constants file (Admin only, one-time setup)
 * @access  Private (Admin)
 */
router.post(
  "/initialize",
  authenticate,
  authorizePermission("canManageEnums"),
  initializeEnums
);

module.exports = router;

