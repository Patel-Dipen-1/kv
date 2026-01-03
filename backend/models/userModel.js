const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  USER_ROLES,
  USER_STATUS,
  COMMITTEE_POSITIONS,
  MARITAL_STATUS,
  OCCUPATION_TYPES,
  SAMAJ_TYPES,
  COUNTRIES,
  BLOOD_GROUPS,
} = require("../constants/enums");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please enter your first name"],
      trim: true,
      minLength: [2, "First name must be at least 2 characters"],
      maxLength: [50, "First name cannot exceed 50 characters"],
    },
    middleName: {
      type: String,
      trim: true,
      maxLength: [50, "Middle name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Please enter your last name"],
      trim: true,
      minLength: [2, "Last name must be at least 2 characters"],
      maxLength: [50, "Last name cannot exceed 50 characters"],
    },
    address: {
      line1: {
        type: String,
        trim: true,
        // Required only when profileCompleted = true (validated in completeProfile endpoint)
      },
      line2: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
        // Required only when profileCompleted = true (validated in completeProfile endpoint)
      },
      state: {
        type: String,
        trim: true,
        // Required only when profileCompleted = true (validated in completeProfile endpoint)
      },
      country: {
        type: String,
        enum: {
          values: COUNTRIES,
          message: `Country must be one of: ${COUNTRIES.join(", ")}`,
        },
        default: "India",
        trim: true,
      },
      pincode: {
        type: String,
        validate: {
          validator: function (v) {
            if (!v) return true; // Optional during registration
            return /^\d{6}$/.test(v);
          },
          message: "Pincode must be a 6-digit number",
        },
        // Required only when profileCompleted = true (validated in completeProfile endpoint)
      },
    },
    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
      max: [120, "Age cannot exceed 120"],
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
    bloodGroup: {
      type: String,
      enum: {
        values: BLOOD_GROUPS,
        message: `Blood group must be one of: ${BLOOD_GROUPS.join(", ")}`,
      },
      default: "Unknown",
      trim: true,
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "Gender must be one of: male, female, other",
      },
      trim: true,
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        maxLength: [100, "Emergency contact name cannot exceed 100 characters"],
      },
      phone: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            if (!v) return true; // Optional
            const cleaned = v.replace(/^\+91/, "").replace(/\s/g, "");
            return /^\d{10}$/.test(cleaned);
          },
          message: "Please enter a valid 10-digit Indian mobile number",
        },
      },
      relationship: {
        type: String,
        trim: true,
        maxLength: [50, "Relationship cannot exceed 50 characters"],
      },
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      validate: {
        validator: function (v) {
          // Remove +91 if present, then check for 10 digits
          const cleaned = v.replace(/^\+91/, "").replace(/\s/g, "");
          return /^\d{10}$/.test(cleaned);
        },
        message: "Please enter a valid 10-digit Indian mobile number",
      },
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    occupationType: {
      type: String,
      enum: {
        values: OCCUPATION_TYPES,
        message: `Occupation type must be one of: ${OCCUPATION_TYPES.join(", ")}`,
      },
      // Required only when profileCompleted = true (validated in completeProfile endpoint)
    },
    occupationTitle: {
      type: String,
      trim: true,
    },
    companyOrBusinessName: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
      maxLength: [100, "Qualification cannot exceed 100 characters"],
    },
    maritalStatus: {
      type: String,
      enum: {
        values: MARITAL_STATUS,
        message: `Marital status must be one of: ${MARITAL_STATUS.join(", ")}`,
      },
      // Required only when profileCompleted = true (validated in completeProfile endpoint)
    },
    profileImage: {
      type: String,
    },
    samaj: {
      type: String,
      enum: {
        values: SAMAJ_TYPES,
        message: `Samaj must be one of: ${SAMAJ_TYPES.join(", ")}`,
      },
      trim: true,
      // Required only when profileCompleted = true (validated in completeProfile endpoint)
    },
    subFamilyNumber: {
      type: String,
      // NOT unique - multiple users can share same subFamilyNumber (same family)
      trim: true,
      maxLength: [30, "Sub-family number cannot exceed 30 characters"],
      index: true, // Index for faster family searches (but allows duplicates)
      // Auto-generated on registration, format: "FAM-YYYYMMDD-XXXX"
    },
    // Primary account indicator
    isPrimaryAccount: {
      type: Boolean,
      default: true, // True for direct registrations, false for family member login accounts
    },
    // Primary account transfer fields
    transferredFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // If this account became primary via transfer, stores immediate previous primary's ID
    },
    transferredAt: {
      type: Date,
      default: null,
      // When transfer happened
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // Admin who performed transfer
    },
    transferReason: {
      type: String,
      trim: true,
      maxLength: [500, "Transfer reason cannot exceed 500 characters"],
      default: null,
    },
    // Full transfer history chain (array of all transfers in this family)
    transferHistory: [
      {
        fromUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        fromUserName: {
          type: String,
          required: true,
        },
        toUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        toUserName: {
          type: String,
          required: true,
        },
        transferredBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        transferredAt: {
          type: Date,
          required: true,
        },
        reason: {
          type: String,
          trim: true,
        },
        familyMembersMigrated: {
          type: Number,
          default: 0,
        },
      },
    ],
    familyMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FamilyMember",
      },
    ],
    familyMembersCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: USER_STATUS,
        message: `Status must be one of: ${USER_STATUS.join(", ")}`,
      },
      default: "pending",
    },
    profileCompleted: {
      type: Boolean,
      default: false,
      // Indicates if user has completed full profile after approval
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: `Role must be one of: ${USER_ROLES.join(", ")}`,
      },
      default: "user",
    },
    // Role reference for RBAC system (links to Role model)
    roleRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      index: true,
    },
    committeePosition: {
      type: String,
      enum: {
        values: COMMITTEE_POSITIONS,
        message: `Committee position must be one of: ${COMMITTEE_POSITIONS.join(", ")}`,
      },
      required: function () {
        return this.role === "committee";
      },
    },
    committeeDisplayOrder: {
      type: Number,
      default: 0,
      // Lower number = shows first on committee page
    },
    committeeBio: {
      type: String,
      maxLength: [500, "Committee bio cannot exceed 500 characters"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [8, "Password must be at least 8 characters"],
      select: false, // Don't select password by default in queries
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Link to FamilyMember if this user was created from a family member
    linkedFamilyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyMember",
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
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Pre-save hook to hash password, format mobile number, and generate subFamilyNumber
userSchema.pre("save", async function () {
  // Generate subFamilyNumber only if new user (not on updates)
  if (this.isNew && !this.subFamilyNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase(); // Random 4 chars
    this.subFamilyNumber = `FAM-${dateStr}-${randomStr}`;
  }

  // Format mobile number to +91 format if not already
  if (this.isModified("mobileNumber") && this.mobileNumber) {
    const cleaned = this.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
    if (/^\d{10}$/.test(cleaned)) {
      this.mobileNumber = `+91${cleaned}`;
    }
  }

  // Hash password only if it's modified
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // Clear committee fields if role is not "committee"
  if (this.isModified("role") && this.role !== "committee") {
    this.committeePosition = undefined;
    this.committeeDisplayOrder = 0;
    this.committeeBio = undefined;
  }
});

// Create indexes for unique fields
// Note: email and mobileNumber already have unique: true in schema, so we don't need to create duplicate indexes
// userSchema.index({ email: 1 }, { unique: true }); // Removed - already defined in schema
// userSchema.index({ mobileNumber: 1 }, { unique: true }); // Removed - already defined in schema
userSchema.index({ subFamilyNumber: 1 }); // Index for family searches

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.getJWTToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

// Instance method to generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash and set to passwordResetToken field
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiry (1 hour)
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
