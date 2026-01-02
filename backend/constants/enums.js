/**
 * Centralized Enum Constants
 * Single source of truth for all enum values used across the application
 */

module.exports = {
  // User roles
  USER_ROLES: ["user", "committee", "moderator", "admin"],

  // User status
  USER_STATUS: ["pending", "approved", "rejected"],

  // Committee positions
  COMMITTEE_POSITIONS: [
    "President",
    "Vice President",
    "Secretary",
    "Treasurer",
    "Committee Member",
    "Advisor",
  ],

  // Marital status
  MARITAL_STATUS: ["single", "married", "divorced", "widowed"],

  // Occupation types
  OCCUPATION_TYPES: [
    "job",
    "business",
    "student",
    "retired",
    "homemaker",
    "other",
  ],

  // Family relationship types (comprehensive list)
  RELATIONSHIP_TYPES: [
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
  ],

  // Samaj/Community types
  SAMAJ_TYPES: [
    "Kadva Patidar",
    "Anjana Patidar",
    "Other",
  ],

  // Countries
  COUNTRIES: [
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
  ],

  // Blood groups
  BLOOD_GROUPS: [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
    "Unknown",
  ],

  // User relationship directions
  RELATIONSHIP_DIRECTIONS: [
    "user1_to_user2",
    "user2_to_user1",
    "bidirectional",
  ],

  // Relationship request status
  RELATIONSHIP_STATUS: ["pending", "accepted", "rejected"],

  // Delete types
  DELETE_TYPES: ["soft", "hard"],
};

