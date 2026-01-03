const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    eventType: {
      type: String,
      enum: ["normal", "invitation", "announcement", "link", "youtube"],
      default: "normal",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
    },
    // Media
    media: {
      images: [
        {
          url: String,
          caption: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      files: [
        {
          url: String,
          name: String,
          size: Number,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      youtubeUrl: {
        type: String,
        trim: true,
      },
      externalLink: {
        url: String,
        title: String,
        description: String,
        image: String,
      },
    },
    // Settings
    settings: {
      commentEnabled: {
        type: Boolean,
        default: true,
      },
      pollEnabled: {
        type: Boolean,
        default: false,
      },
      visibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },
    },
    // Poll
    poll: {
      question: {
        type: String,
        trim: true,
        maxlength: [500, "Poll question cannot exceed 500 characters"],
      },
      options: [
        {
          text: {
            type: String,
            required: true,
            trim: true,
          },
          votes: [
            {
              userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
              },
              votedAt: {
                type: Date,
                default: Date.now,
              },
            },
          ],
          voteCount: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
    // Likes - one per user
    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    // Comments
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: [true, "Comment text is required"],
          trim: true,
          maxlength: [1000, "Comment cannot exceed 1000 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
        },
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Status
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
eventSchema.index({ createdBy: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ "settings.visibility": 1 });
eventSchema.index({ isActive: 1 });

// Methods
eventSchema.methods.hasUserLiked = function (userId) {
  if (!userId) return false;
  return this.likes.some(
    (like) => like.userId.toString() === userId.toString()
  );
};

eventSchema.methods.hasUserVoted = function (userId) {
  if (!userId || !this.settings.pollEnabled) return false;
  return this.poll.options.some((option) =>
    option.votes.some((vote) => vote.userId.toString() === userId.toString())
  );
};

eventSchema.methods.getUserVote = function (userId) {
  if (!userId) return null;
  for (const option of this.poll.options) {
    const vote = option.votes.find(
      (v) => v.userId.toString() === userId.toString()
    );
    if (vote) {
      return {
        optionId: option._id.toString(),
        optionText: option.text,
      };
    }
  }
  return null;
};

eventSchema.methods.addLike = function (userId) {
  if (this.hasUserLiked(userId)) {
    // Remove like
    this.likes = this.likes.filter(
      (like) => like.userId.toString() !== userId.toString()
    );
    this.likeCount = Math.max(0, this.likeCount - 1);
    return false; // Unliked
  } else {
    // Add like
    this.likes.push({ userId });
    this.likeCount += 1;
    return true; // Liked
  }
};

eventSchema.methods.addComment = function (userId, text) {
  this.comments.push({
    userId,
    text,
    createdAt: Date.now(),
  });
  this.commentCount += 1;
  return this.comments[this.comments.length - 1];
};

eventSchema.methods.deleteComment = function (commentId, userId, isAdmin) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }
  
  // Check permission
  if (!isAdmin && comment.userId.toString() !== userId.toString()) {
    throw new Error("You don't have permission to delete this comment");
  }

  this.comments.pull(commentId);
  this.commentCount = Math.max(0, this.commentCount - 1);
  return true;
};

eventSchema.methods.voteInPoll = function (userId, optionId) {
  if (!this.settings.pollEnabled) {
    throw new Error("Poll is not enabled for this event");
  }

  // Remove existing vote
  this.poll.options.forEach((option) => {
    option.votes = option.votes.filter(
      (vote) => vote.userId.toString() !== userId.toString()
    );
    option.voteCount = option.votes.length;
  });

  // Add new vote
  const option = this.poll.options.id(optionId);
  if (!option) {
    throw new Error("Poll option not found");
  }

  option.votes.push({ userId });
  option.voteCount = option.votes.length;
  return option;
};

// Pre-save hook to update likeCount and commentCount
eventSchema.pre("save", function () {
  // In Mongoose, pre-save hooks can be synchronous (no next parameter needed)
  this.likeCount = this.likes && Array.isArray(this.likes) ? this.likes.length : 0;
  this.commentCount = this.comments && Array.isArray(this.comments) ? this.comments.length : 0;
});

module.exports = mongoose.model("Event", eventSchema);

