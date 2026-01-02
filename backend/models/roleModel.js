const mongoose = require("mongoose");
const { createDefaultPermissions, getAllPermissionKeys } = require("../constants/permissions");

const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
      minlength: [3, "Role name must be at least 3 characters"],
      maxlength: [50, "Role name cannot exceed 50 characters"],
      unique: true,
    },
    roleKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: () => {
        const defaultPerms = {};
        getAllPermissionKeys().forEach((key) => {
          defaultPerms[key] = false;
        });
        return defaultPerms;
      },
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
roleSchema.index({ roleKey: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isSystemRole: 1 });

// Pre-save hook to generate roleKey from roleName if not provided
roleSchema.pre("save", function (next) {
  if (!this.roleKey && this.roleName) {
    this.roleKey = this.roleName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }
  if (typeof next === "function") {
    next();
  }
});

// Instance method to check if user has specific permission
roleSchema.methods.hasPermission = function (permissionKey) {
  if (!this.permissions) return false;
  return this.permissions.get(permissionKey) === true;
};

// Instance method to get all enabled permissions
roleSchema.methods.getEnabledPermissions = function () {
  if (!this.permissions) return [];
  const enabled = [];
  this.permissions.forEach((value, key) => {
    if (value === true) {
      enabled.push(key);
    }
  });
  return enabled;
};

module.exports = mongoose.model("Role", roleSchema);

