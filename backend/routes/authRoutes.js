const express = require("express");
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  completeProfile,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  registerUserValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../validation/userValidation");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", registerUserValidation, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", loginValidation, login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password/:token", resetPasswordValidation, resetPassword);

/**
 * @route   POST /api/auth/complete-profile
 * @desc    Complete user profile after approval
 * @access  Private (authenticated users only)
 */
router.post("/complete-profile", authenticate, completeProfile);

module.exports = router;

