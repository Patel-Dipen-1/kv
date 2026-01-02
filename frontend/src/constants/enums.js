/**
 * Centralized Enum Constants
 * Single source of truth for all enum values used across the frontend
 * Mirrors backend constants/enums.js
 */

export const USER_ROLES = ["user", "committee", "moderator", "admin"];

export const USER_STATUS = ["pending", "approved", "rejected"];

export const COMMITTEE_POSITIONS = [
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Committee Member",
  "Advisor",
];

export const MARITAL_STATUS = ["single", "married", "divorced", "widowed"];

export const OCCUPATION_TYPES = [
  "job",
  "business",
  "student",
  "retired",
  "homemaker",
  "other",
];

export const RELATIONSHIP_TYPES = [
  // Direct relations
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Husband",
  "Wife",
  "Brother",
  "Sister",

  // Extended relations
  "Grandfather",
  "Grandmother",
  "Grandson",
  "Granddaughter",
  "Uncle",
  "Aunt",
  "Nephew",
  "Niece",
  "Cousin",
  "Father-in-law",
  "Mother-in-law",
  "Son-in-law",
  "Daughter-in-law",
  "Brother-in-law",
  "Sister-in-law",

  // Other
  "Other",
];

export const SAMAJ_TYPES = [
  "Kadva Patidar",
  "Anjana Patidar",
  "Other",
];

export const COUNTRIES = [
  "India",
  "USA",
  "UK",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Saudi Arabia",
  "Singapore",
  "Malaysia",
  "South Africa",
  "New Zealand",
  "Germany",
  "France",
  "Other",
];

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];

// Helper to convert enum to dropdown options
export const enumToOptions = (enumArray) => {
  return enumArray.map((value) => ({ value, label: value }));
};

