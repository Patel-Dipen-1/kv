const mongoose = require("mongoose");
const {
  RELATIONSHIP_TYPES,
  RELATIONSHIP_DIRECTIONS,
  RELATIONSHIP_STATUS,
} = require("../constants/enums");

const userRelationshipSchema = new mongoose.Schema(
  {
    // First user in the relationship
    user1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Second user in the relationship
    user2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Type of relationship (e.g., "Father", "Son", "Brother")
    relationshipType: {
      type: String,
      enum: {
        values: RELATIONSHIP_TYPES,
        message: `Relationship type must be one of: ${RELATIONSHIP_TYPES.join(", ")}`,
      },
      required: true,
    },

    // Direction of relationship
    relationshipFrom: {
      type: String,
      enum: {
        values: RELATIONSHIP_DIRECTIONS,
        message: `Relationship direction must be one of: ${RELATIONSHIP_DIRECTIONS.join(", ")}`,
      },
      required: true,
      // "user1_to_user2": user1 is X of user2 (e.g., user1 is Father of user2)
      // "user2_to_user1": user2 is X of user1 (e.g., user2 is Father of user1)
      // "bidirectional": both are siblings/spouses (e.g., user1 and user2 are Brothers)
    },

    // Request status
    status: {
      type: String,
      enum: {
        values: RELATIONSHIP_STATUS,
        message: `Status must be one of: ${RELATIONSHIP_STATUS.join(", ")}`,
      },
      default: "pending",
      index: true,
    },

    // Who initiated the relationship request
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who approved the relationship (if accepted)
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Optional note from requester
    note: {
      type: String,
      trim: true,
      maxLength: [500, "Note cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
userRelationshipSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true }); // Prevent duplicate relationships
userRelationshipSchema.index({ user1Id: 1, status: 1 });
userRelationshipSchema.index({ user2Id: 1, status: 1 });
userRelationshipSchema.index({ requestedBy: 1 });

// Validation: Cannot link to yourself
userRelationshipSchema.pre("save", function (next) {
  if (this.user1Id.toString() === this.user2Id.toString()) {
    return next(new Error("Cannot create relationship with yourself"));
  }
  next();
});

// Instance method to get the relationship description
userRelationshipSchema.methods.getRelationshipDescription = function (fromUserId) {
  if (this.relationshipFrom === "bidirectional") {
    return this.relationshipType; // e.g., "Brother", "Sister"
  }

  if (fromUserId.toString() === this.user1Id.toString()) {
    // Viewing from user1's perspective
    if (this.relationshipFrom === "user1_to_user2") {
      return `My ${this.relationshipType}`; // e.g., "My Son"
    } else {
      return `My ${this.relationshipType}`; // e.g., "My Father"
    }
  } else {
    // Viewing from user2's perspective
    if (this.relationshipFrom === "user1_to_user2") {
      return `My ${this.relationshipType}`; // e.g., "My Father"
    } else {
      return `My ${this.relationshipType}`; // e.g., "My Son"
    }
  }
};

module.exports = mongoose.model("UserRelationship", userRelationshipSchema);

