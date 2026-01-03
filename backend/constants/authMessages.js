/**
 * Centralized Authentication Messages
 * Single source of truth for all authentication-related messages
 */

module.exports = {
  AUTH: {
    INVALID_CREDENTIALS: "Invalid phone/email or password",
    USER_NOT_FOUND: "Account does not exist",
    ACCOUNT_INCOMPLETE: "Please complete your profile to continue",
    LOGIN_SUCCESS: "Login successful",
    ACCOUNT_DEACTIVATED: "Your account has been deactivated",
    ACCOUNT_PENDING_APPROVAL: "Your account is pending approval. Please wait for admin approval.",
    EMAIL_OR_MOBILE_REQUIRED: "Please provide email or mobile number and password",
  },

  REGISTER: {
    REQUIRED_FIELDS: "All required fields must be filled",
    PHONE_OR_EMAIL_REQUIRED: "Phone number or email is required",
    PHONE_INVALID: "Invalid phone number. Please enter a valid 10-digit Indian mobile number",
    EMAIL_INVALID: "Invalid email address",
    PASSWORD_WEAK: "Password must be at least 8 characters and contain at least one letter and one number",
    DOB_REQUIRED: "Date of birth is required",
    DOB_INVALID: "Date of birth cannot be in the future",
    NAME_REQUIRED: "Name is required",
    ALREADY_EXISTS: "User already registered with this phone number or email",
    PHONE_ALREADY_EXISTS: "Mobile number is already registered. Please use a different mobile number.",
    EMAIL_ALREADY_EXISTS: "Email is already registered. Please use a different email.",
    STEP1_SUCCESS: "Basic registration completed successfully",
    STEP2_SUCCESS: "Profile completed successfully",
    STEP2_REQUIRED: "Please complete your profile to continue",
    CANNOT_SKIP_STEP: "Cannot skip registration steps. Please complete step 1 first.",
  },

  PROFILE: {
    UPDATE_SUCCESS: "Profile updated successfully",
    INCOMPLETE_PROFILE: "Please complete all required profile fields",
    COMPLETE_PROFILE_REQUIRED: "Profile completion is required",
  },

  GENERAL: {
    SERVER_ERROR: "Something went wrong, please try again later",
    UNAUTHORIZED: "You are not authorized",
    VALIDATION_FAILED: "Validation failed",
    INVALID_REQUEST: "Invalid request",
  },
};

