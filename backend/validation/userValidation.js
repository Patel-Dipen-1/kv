const { body, validationResult } = require("express-validator");
const ErrorHandler = require("../utils/errorhander");
const { SAMAJ_TYPES, MARITAL_STATUS, OCCUPATION_TYPES } = require("../constants/enums");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorMessages,
    });
  }
  next();
};

// Validation for user registration - PHASE 1: BASIC FIELDS ONLY
exports.registerUserValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage("Date of birth must be a valid date")
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("Date of birth cannot be in the future");
      }
      return true;
    }),

  body("mobileNumber")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage("Please enter a valid 10-digit Indian mobile number"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  handleValidationErrors,
];

// Validation for login
exports.loginValidation = [
  body("emailOrMobile")
    .trim()
    .notEmpty()
    .withMessage("Email or mobile number is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  handleValidationErrors,
];

// Validation for updating profile
exports.updateProfileValidation = [
  body("address.line1")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address line 1 cannot be empty"),

  body("address.line2")
    .optional()
    .trim(),

  body("address.city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("City cannot be empty"),

  body("address.state")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("State cannot be empty"),

  body("address.pincode")
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be a 6-digit number"),

  body("age")
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage("Age must be between 0 and 120"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid date")
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("Date of birth cannot be in the future");
      }
      return true;
    }),

  body("occupationTitle")
    .optional()
    .trim(),

  body("companyOrBusinessName")
    .optional()
    .trim(),

  body("position")
    .optional()
    .trim(),

  body("qualification")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Qualification cannot exceed 100 characters"),

  body("maritalStatus")
    .optional()
    .isIn(MARITAL_STATUS)
    .withMessage(`Marital status must be one of: ${MARITAL_STATUS.join(", ")}`),

  body("profileImage")
    .optional()
    .trim(),

  body("subFamilyNumber")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Sub-family number cannot exceed 30 characters"),

  handleValidationErrors,
];

// Validation for updating role (admin only)
exports.updateRoleValidation = [
  body("newRole")
    .optional()
    .isIn(["user", "committee", "moderator", "admin"])
    .withMessage("Role must be user, committee, moderator, or admin"),

  body("role")
    .optional()
    .isIn(["user", "committee", "moderator", "admin"])
    .withMessage("Role must be user, committee, moderator, or admin"),

  body("status")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Status must be pending, approved, or rejected"),

  body("committeePosition")
    .optional()
    .isIn([
      "President",
      "Vice President",
      "Secretary",
      "Treasurer",
      "Committee Member",
      "Advisor",
    ])
    .withMessage("Invalid committee position"),

  body("committeeDisplayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Display order must be a non-negative integer"),

  body("committeeBio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Committee bio cannot exceed 500 characters"),

  // Custom validation: if role is committee, committeePosition is required
  body("role").custom((value, { req }) => {
    const role = value || req.body.newRole;
    if (role === "committee" && !req.body.committeePosition) {
      throw new Error("Committee position is required when assigning committee role");
    }
    return true;
  }),

  handleValidationErrors,
];

// Validation for forgot password
exports.forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  handleValidationErrors,
];

// Validation for reset password
exports.resetPasswordValidation = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),

  handleValidationErrors,
];

// Validation for change password
exports.changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("New password must contain at least one letter and one number"),

  handleValidationErrors,
];

// Bulk approve/reject validation schema
exports.bulkApproveRejectValidation = [
  body("userIds")
    .isArray({ min: 1 })
    .withMessage("userIds must be a non-empty array")
    .custom((value) => {
      if (!value.every((id) => typeof id === "string" && id.length > 0)) {
        throw new Error("All userIds must be valid strings");
      }
      return true;
    }),

  handleValidationErrors,
];

