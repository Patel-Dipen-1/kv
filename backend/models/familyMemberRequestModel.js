const mongoose = require("mongoose");
const { RELATIONSHIP_TYPES, MARITAL_STATUS, OCCUPATION_TYPES, BLOOD_GROUPS } = require("../constants/enums");

const familyMemberRequestSchema = new mongoose.Schema(
  {
    // User who requested to add this family member
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Sub family number (same as requester's subFamilyNumber)
    subFamilyNumber: {
      type: String,
      required: true,
      index: true,
    },
    // Family member details (same structure as FamilyMember)
    relationshipToUser: {
      type: String,
      enum: {
        values: RELATIONSHIP_TYPES,
        message: `Relationship must be one of: ${RELATIONSHIP_TYPES.join(", ")}`,
      },
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: [50, "Middle name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
      max: [120, "Age cannot exceed 120"],
    },
    bloodGroup: {
      type: String,
      enum: {
        values: BLOOD_GROUPS,
        message: `Blood group must be one of: ${BLOOD_GROUPS.join(", ")}`,
      },
      default: "Unknown",
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
      pincode: { type: String, trim: true },
    },
    maritalStatus: {
      type: String,
      enum: {
        values: MARITAL_STATUS,
        message: `Marital status must be one of: ${MARITAL_STATUS.join(", ")}`,
      },
    },
    occupationType: {
      type: String,
      enum: {
        values: OCCUPATION_TYPES,
        message: `Occupation type must be one of: ${OCCUPATION_TYPES.join(", ")}`,
      },
    },
    occupationTitle: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
      maxlength: [100, "Qualification cannot exceed 100 characters"],
    },
    profileImage: {
      type: String,
    },
    // Whether requester wants to create login account for this person
    createLoginAccount: {
      type: Boolean,
      default: false,
    },
    // Password if creating login account (will be hashed)
    password: {
      type: String,
      select: false,
    },
    useMobileAsPassword: {
      type: Boolean,
      default: false,
    },
    // Request reason (optional)
    requestReason: {
      type: String,
      maxlength: [500, "Request reason cannot exceed 500 characters"],
      trim: true,
    },
    // Request status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Admin who reviewed the request
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes
familyMemberRequestSchema.index({ requestedBy: 1, status: 1 });
familyMemberRequestSchema.index({ subFamilyNumber: 1 });
familyMemberRequestSchema.index({ status: 1 });

module.exports = mongoose.model("FamilyMemberRequest", familyMemberRequestSchema);

