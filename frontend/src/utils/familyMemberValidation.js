import * as yup from "yup";
import { MARITAL_STATUS, OCCUPATION_TYPES, BLOOD_GROUPS, SAMAJ_TYPES } from "../constants/enums";

// Family Member validation schema - ALL FIELDS REQUIRED
export const familyMemberSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),
  middleName: yup
    .string()
    .required("Middle name is required")
    .max(50, "Middle name cannot exceed 50 characters"),
  lastName: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters"),
  relationshipToUser: yup
    .string()
    .required("Relationship is required"),
  dateOfBirth: yup
    .date()
    .required("Date of birth is required")
    .max(new Date(), "Date of birth cannot be in the future")
    .typeError("Please enter a valid date"),
  age: yup
    .number()
    .required("Age is required")
    .min(0, "Age cannot be negative")
    .max(120, "Age cannot exceed 120")
    .typeError("Age must be a number"),
  gender: yup
    .string()
    .required("Gender is required")
    .oneOf(["male", "female", "other"], "Invalid gender"),
  mobileNumber: yup
    .string()
    .required("Mobile number is required")
    .matches(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  email: yup
    .string()
    .email("Please enter a valid email"),
  address: yup.object().shape({
    line1: yup.string().required("Address line 1 is required"),
    line2: yup.string().notRequired(), // Address line 2 is optional
    city: yup.string().required("City is required"),
    state: yup.string().required("State is required"),
    country: yup.string().required("Country is required"),
    pincode: yup
      .string()
      .required("Pincode is required")
      .matches(/^\d{6}$/, "Pincode must be a 6-digit number"),
  }),
  bloodGroup: yup
    .string()
    .required("Blood group is required")
    .oneOf(BLOOD_GROUPS || ["Unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], "Invalid blood group"),
  maritalStatus: yup
    .string()
    .required("Marital status is required")
    .oneOf(MARITAL_STATUS, "Invalid marital status"),
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
  samaj: yup
    .string()
    .required("Samaj/Community is required")
    .oneOf(SAMAJ_TYPES || [], "Invalid samaj/community"),
  // Conditional validation for login account creation
  createLoginAccount: yup.boolean(),
  useMobileAsPassword: yup.boolean(),
  password: yup.string().when(["createLoginAccount", "useMobileAsPassword"], {
    is: (createLoginAccount, useMobileAsPassword) => createLoginAccount && !useMobileAsPassword,
    then: (schema) => schema.required("Password is required for login account").min(8, "Password must be at least 8 characters").matches(/^(?=.*[A-Za-z])(?=.*\d)/, "Password must contain at least one letter and one number"),
    otherwise: (schema) => schema.notRequired(),
  }),
  confirmPassword: yup.string().when(["createLoginAccount", "useMobileAsPassword"], {
    is: (createLoginAccount, useMobileAsPassword) => createLoginAccount && !useMobileAsPassword,
    then: (schema) => schema.required("Please confirm password").oneOf([yup.ref("password")], "Passwords do not match"),
    otherwise: (schema) => schema.notRequired(),
  }),
  profileImage: yup.mixed().notRequired(),
});

// Multiple Family Members validation schema
export const familyMembersSchema = yup.object().shape({
  members: yup
    .array()
    .of(familyMemberSchema)
    .min(1, "At least one family member is required")
    .required("At least one family member is required"),
});

