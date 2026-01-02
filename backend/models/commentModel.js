const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    commentText: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxLength: [1000, "Comment cannot exceed 1000 characters"],
    },
    commentType: {
      type: String,
      enum: {
        values: ["general", "condolence", "congratulation", "question", "feedback"],
        message: "Invalid comment type",
      },
      default: "general",
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    // Moderation
    status: {
      type: String,
      enum: {
        values: ["published", "pending", "hidden", "deleted"],
        message: "Invalid comment status",
      },
      default: "published",
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    flaggedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: {
          type: String,
        },
        flaggedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Interactions
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    // Media
    attachedImage: {
      type: String,
    },
    // Edit tracking
    editedAt: {
      type: Date,
    },
    editCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
commentSchema.index({ eventId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentCommentId: 1 });
commentSchema.index({ status: 1 });
commentSchema.index({ flagged: 1 });

// Virtual for checking if comment can be edited (within 15 minutes)
commentSchema.virtual("canEdit").get(function () {
  if (this.replyCount > 0) return false;
  const fifteenMinutes = 15 * 60 * 1000;
  const timeSinceCreation = Date.now() - this.createdAt.getTime();
  return timeSinceCreation < fifteenMinutes;
});

// Method to check if user can edit
commentSchema.methods.canUserEdit = function (userId) {
  if (!userId) return false;
  if (this.userId.toString() !== userId.toString()) return false;
  return this.canEdit;
};

// Method to check if user can delete
commentSchema.methods.canUserDelete = function (userId, userPermissions) {
  if (!userId) return false;
  // User can delete their own comments
  if (this.userId.toString() === userId.toString()) return true;
  // Admin/moderator can delete any comment
  if (userPermissions?.canDeleteAnyComment) return true;
  return false;
};

// Pre-save hook to update counts
commentSchema.pre("save", function (next) {
  // Update like count
  this.likeCount = this.likes ? this.likes.length : 0;
  
  // If this is a reply, increment parent's reply count
  if (this.parentCommentId && this.isNew) {
    mongoose.model("Comment").findByIdAndUpdate(
      this.parentCommentId,
      { $inc: { replyCount: 1 } },
      { new: true }
    );
  }
  
  next();
});

// Pre-remove hook to decrement parent reply count
commentSchema.pre("remove", async function () {
  if (this.parentCommentId) {
    await mongoose.model("Comment").findByIdAndUpdate(
      this.parentCommentId,
      { $inc: { replyCount: -1 } }
    );
  }
});

module.exports = mongoose.model("Comment", commentSchema);

