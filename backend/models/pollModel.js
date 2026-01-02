const mongoose = require("mongoose");

const pollOptionSchema = new mongoose.Schema({
  optionText: {
    type: String,
    required: [true, "Option text is required"],
    trim: true,
    maxLength: [200, "Option text cannot exceed 200 characters"],
  },
  voteCount: {
    type: Number,
    default: 0,
  },
  voters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  order: {
    type: Number,
    default: 0,
  },
});

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Poll question is required"],
      trim: true,
      maxLength: [200, "Poll question cannot exceed 200 characters"],
    },
    description: {
      type: String,
      maxLength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    pollType: {
      type: String,
      enum: {
        values: ["single_choice", "multiple_choice", "yes_no"],
        message: "Invalid poll type",
      },
      default: "single_choice",
    },
    options: {
      type: [pollOptionSchema],
      validate: {
        validator: function (options) {
          return options.length >= 2 && options.length <= 10;
        },
        message: "Poll must have between 2 and 10 options",
      },
    },
    // Settings
    allowAnonymous: {
      type: Boolean,
      default: false,
    },
    showLiveResults: {
      type: Boolean,
      default: true,
    },
    allowVoteChanges: {
      type: Boolean,
      default: false,
    },
    maxVotesPerUser: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Timing
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "closed", "cancelled"],
        message: "Invalid poll status",
      },
      default: "active",
    },
    // Access control
    restrictTo: {
      type: String,
      enum: {
        values: ["all", "samaj", "role", "family"],
        message: "Invalid restriction type",
      },
      default: "all",
    },
    restrictedSamaj: [
      {
        type: String,
      },
    ],
    restrictedRoles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    restrictedFamilies: [
      {
        type: String, // subFamilyNumber
      },
    ],
    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Statistics
    totalVotes: {
      type: Number,
      default: 0,
    },
    eligibleUsers: {
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
pollSchema.index({ eventId: 1 });
pollSchema.index({ createdBy: 1 });
pollSchema.index({ status: 1, endDate: 1 });
pollSchema.index({ endDate: 1 });

// Method to check if user can vote
pollSchema.methods.canUserVote = function (user) {
  if (this.status !== "active") return false;
  if (!user) return this.allowAnonymous;

  if (this.restrictTo === "all") return true;

  if (this.restrictTo === "samaj") {
    return (
      this.restrictedSamaj.length === 0 || this.restrictedSamaj.includes(user.samaj)
    );
  }

  if (this.restrictTo === "family") {
    return (
      this.restrictedFamilies.length === 0 ||
      this.restrictedFamilies.includes(user.subFamilyNumber)
    );
  }

  if (this.restrictTo === "role") {
    if (!user.roleRef) return false;
    return (
      this.restrictedRoles.length === 0 ||
      this.restrictedRoles.some((roleId) => roleId.toString() === user.roleRef._id.toString())
    );
  }

  return false;
};

// Method to check if user has already voted
pollSchema.methods.hasUserVoted = function (userId) {
  if (!userId) return false;
  return this.options.some((option) =>
    option.voters.some((voterId) => voterId.toString() === userId.toString())
  );
};

// Method to get user's vote
pollSchema.methods.getUserVote = function (userId) {
  if (!userId) return null;
  const votedOptions = this.options.filter((option) =>
    option.voters.some((voterId) => voterId.toString() === userId.toString())
  );
  return votedOptions.map((opt) => opt._id);
};

// Pre-save hook to update status based on end date
pollSchema.pre("save", function (next) {
  const now = new Date();
  
  if (this.status !== "cancelled" && this.endDate < now) {
    this.status = "closed";
  }
  
  // Calculate total votes
  this.totalVotes = this.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  
  next();
});

module.exports = mongoose.model("Poll", pollSchema);

