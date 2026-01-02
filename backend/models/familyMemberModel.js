const mongoose = require("mongoose");
const {
  RELATIONSHIP_TYPES,
  MARITAL_STATUS,
  OCCUPATION_TYPES,
  USER_STATUS,
  BLOOD_GROUPS,
} = require("../constants/enums");

const familyMemberSchema = new mongoose.Schema(
  {
    // Link to main user who added this family member
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Sub family number (same as user's subFamilyNumber)
    subFamilyNumber: {
      type: String,
      required: true,
      index: true,
    },

    // Relationship to the user who added them
    relationshipToUser: {
      type: String,
      enum: {
        values: RELATIONSHIP_TYPES,
        message: `Relationship must be one of: ${RELATIONSHIP_TYPES.join(", ")}`,
      },
      required: true,
    },

    // Personal details
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
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          return v <= new Date();
        },
        message: "Date of birth cannot be in the future",
      },
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
      trim: true,
    },
    mobileNumber: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          const cleaned = v.replace(/^\+91/, "").replace(/\s/g, "");
          return /^\d{10}$/.test(cleaned);
        },
        message: "Please enter a valid 10-digit Indian mobile number",
      },
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(v);
        },
        message: "Please enter a valid email address",
      },
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
      maxlength: [100, "Occupation title cannot exceed 100 characters"],
    },

    qualification: {
      type: String,
      trim: true,
      maxlength: [100, "Qualification cannot exceed 100 characters"],
    },

    profileImage: {
      type: String,
    },

    // Approval status (only for 6+ family members)
    needsApproval: {
      type: Boolean,
      default: false,
    },

    approvalStatus: {
      type: String,
      enum: {
        values: USER_STATUS,
        message: `Approval status must be one of: ${USER_STATUS.join(", ")}`,
      },
      default: "approved",
      // First 5 members auto-approved, 6+ set to "pending"
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Family member login account fields
    hasUserAccount: {
      type: Boolean,
      default: false,
    },
    // Link to User account if family member can login
    linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    // Soft/Hard delete fields
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deleteType: {
      type: String,
      enum: ["soft", "hard", null],
      default: null,
    },
    deletionReason: {
      type: String,
      trim: true,
      maxLength: [500, "Deletion reason cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

// Index for fast queries
familyMemberSchema.index({ userId: 1, subFamilyNumber: 1 });
familyMemberSchema.index({ userId: 1, approvalStatus: 1 });

module.exports = mongoose.model("FamilyMember", familyMemberSchema);

