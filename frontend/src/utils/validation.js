import * as yup from "yup";
import { SAMAJ_TYPES, OCCUPATION_TYPES, MARITAL_STATUS } from "../constants/enums";

// Registration validation schema - PHASE 1: BASIC FIELDS ONLY
export const registerSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),
  lastName: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters"),
  dateOfBirth: yup
    .date()
    .required("Date of birth is required")
    .max(new Date(), "Date of birth cannot be in the future")
    .typeError("Please enter a valid date"),
  mobileNumber: yup
    .string()
    .required("Mobile number is required")
    .matches(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "Password must contain at least one letter and one number"
    ),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

// Complete Profile validation schema - PHASE 2: FULL PROFILE
export const completeProfileSchema = yup.object().shape({
  middleName: yup
    .string()
    .max(50, "Middle name cannot exceed 50 characters"),
  address: yup.object().shape({
    line1: yup.string().required("Address line 1 is required"),
    line2: yup.string(),
    city: yup.string().required("City is required"),
    state: yup.string().required("State is required"),
    country: yup.string().required("Country is required"),
    pincode: yup
      .string()
      .required("Pincode is required")
      .matches(/^\d{6}$/, "Pincode must be a 6-digit number"),
  }),
  gender: yup
    .string()
    .required("Gender is required")
    .oneOf(["male", "female", "other"], "Invalid gender"),
  occupationType: yup
    .string()
    .required("Occupation type is required")
    .oneOf(OCCUPATION_TYPES, "Invalid occupation type"),
  occupationTitle: yup
    .string()
    .when("occupationType", {
      is: (val) => val && val !== "homemaker",
      then: (schema) => schema.required("Occupation title is required").max(100, "Occupation title cannot exceed 100 characters"),
      otherwise: (schema) => schema.notRequired(),
    }),
  companyOrBusinessName: yup
    .string()
    .when("occupationType", {
      is: (val) => val === "job" || val === "business",
      then: (schema) => schema.required("Company/Business name is required").max(100, "Company/Business name cannot exceed 100 characters"),
      otherwise: (schema) => schema.notRequired(),
    }),
  position: yup
    .string()
    .when("occupationType", {
      is: (val) => val === "job",
      then: (schema) => schema.required("Position is required").max(100, "Position cannot exceed 100 characters"),
      otherwise: (schema) => schema.notRequired(),
    }),
  qualification: yup
    .string()
    .when("occupationType", {
      is: (val) => val && val !== "homemaker",
      then: (schema) => schema.required("Qualification is required").max(100, "Qualification cannot exceed 100 characters"),
      otherwise: (schema) => schema.notRequired(),
    }),
  maritalStatus: yup
    .string()
    .required("Marital status is required")
    .oneOf(MARITAL_STATUS, "Invalid marital status"),
  samaj: yup
    .string()
    .required("Samaj/Community is required")
    .oneOf(SAMAJ_TYPES, "Invalid samaj/community"),
  bloodGroup: yup
    .string()
    .required("Blood group is required"),
});

// Login validation schema
export const loginSchema = yup.object().shape({
  emailOrMobile: yup
    .string()
    .required("Email or mobile number is required"),
  password: yup.string().required("Password is required"),
});

// Update profile validation schema
export const updateProfileSchema = yup.object().shape({
  address: yup.object().shape({
    line1: yup.string(),
    line2: yup.string(),
    city: yup.string(),
    state: yup.string(),
    pincode: yup
      .string()
      .matches(/^\d{6}$/, "Pincode must be a 6-digit number"),
  }),
  age: yup
    .number()
    .min(0, "Age cannot be negative")
    .max(120, "Age cannot exceed 120"),
  dateOfBirth: yup
    .date()
    .max(new Date(), "Date of birth cannot be in the future"),
  occupationTitle: yup.string(),
  companyOrBusinessName: yup.string(),
  position: yup.string(),
  qualification: yup
    .string()
    .max(100, "Qualification cannot exceed 100 characters"),
  maritalStatus: yup
    .string()
    .oneOf(["single", "married", "divorced", "widowed"], "Invalid marital status"),
  subFamilyNumber: yup
    .string()
    .max(30, "Sub-family number cannot exceed 30 characters"),
});

// Forgot password validation schema
export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
});

// Reset password validation schema
export const resetPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "Password must contain at least one letter and one number"
    ),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

