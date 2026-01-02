const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Action type
    actionType: {
      type: String,
      enum: [
        "user_approved",
        "user_rejected",
        "role_changed",
        "committee_assigned",
        "family_member_approved",
        "family_member_rejected",
        "user_deactivated",
        "user_activated",
        "password_changed",
      ],
      required: true,
    },

    // Target user (if applicable)
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // Target family member (if applicable)
    targetFamilyMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyMember",
      index: true,
    },

    // Details about the action
    details: {
      type: mongoose.Schema.Types.Mixed,
      // Can store any additional data like:
      // - oldRole, newRole
      // - oldStatus, newStatus
      // - committeePosition
      // - etc.
    },

    // Description for display
    description: {
      type: String,
      required: true,
    },

    // IP address (optional, for audit)
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes for fast queries
activityLogSchema.index({ performedBy: 1, createdAt: -1 });
activityLogSchema.index({ targetUser: 1, createdAt: -1 });
activityLogSchema.index({ actionType: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);

