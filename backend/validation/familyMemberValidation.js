const { body, validationResult } = require("express-validator");
const { RELATIONSHIP_TYPES, MARITAL_STATUS, OCCUPATION_TYPES } = require("../constants/enums");
const ErrorHandler = require("../utils/errorhander");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorHandler("Validation failed", 400, errors.array())
    );
  }
  next();
};

// Validation for adding family member
exports.addFamilyMemberValidation = [
  body("relationshipToUser")
    .notEmpty()
    .withMessage("Relationship to user is required")
    .isIn(RELATIONSHIP_TYPES)
    .withMessage(`Relationship must be one of: ${RELATIONSHIP_TYPES.join(", ")}`),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("middleName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Middle name cannot exceed 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

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

  body("age")
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage("Age must be between 0 and 120"),

  body("mobileNumber")
    .optional()
    .custom((value) => {
      if (!value) return true;
      const cleaned = value.replace(/^\+91/, "").replace(/\s/g, "");
      if (!/^\d{10}$/.test(cleaned)) {
        throw new Error("Mobile number must be 10 digits");
      }
      return true;
    }),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("maritalStatus")
    .optional()
    .isIn(MARITAL_STATUS)
    .withMessage(`Marital status must be one of: ${MARITAL_STATUS.join(", ")}`),

  body("occupationType")
    .optional()
    .isIn(OCCUPATION_TYPES)
    .withMessage(`Occupation type must be one of: ${OCCUPATION_TYPES.join(", ")}`),

  body("occupationTitle")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Occupation title cannot exceed 100 characters"),

  body("qualification")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Qualification cannot exceed 100 characters"),

  handleValidationErrors,
];

// Validation for updating family member
exports.updateFamilyMemberValidation = [
  body("relationshipToUser")
    .optional()
    .isIn(RELATIONSHIP_TYPES)
    .withMessage(`Relationship must be one of: ${RELATIONSHIP_TYPES.join(", ")}`),

  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("middleName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Middle name cannot exceed 50 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

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

  body("age")
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage("Age must be between 0 and 120"),

  body("mobileNumber")
    .optional()
    .custom((value) => {
      if (!value) return true;
      const cleaned = value.replace(/^\+91/, "").replace(/\s/g, "");
      if (!/^\d{10}$/.test(cleaned)) {
        throw new Error("Mobile number must be 10 digits");
      }
      return true;
    }),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("maritalStatus")
    .optional()
    .isIn(MARITAL_STATUS)
    .withMessage(`Marital status must be one of: ${MARITAL_STATUS.join(", ")}`),

  body("occupationType")
    .optional()
    .isIn(OCCUPATION_TYPES)
    .withMessage(`Occupation type must be one of: ${OCCUPATION_TYPES.join(", ")}`),

  body("occupationTitle")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Occupation title cannot exceed 100 characters"),

  body("qualification")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Qualification cannot exceed 100 characters"),

  handleValidationErrors,
];

