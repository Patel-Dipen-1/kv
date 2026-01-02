const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      maxLength: [200, "Event name cannot exceed 200 characters"],
    },
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: {
        values: [
          "funeral",
          "condolence",
          "festival",
          "marriage",
          "engagement",
          "reception",
          "birthday",
          "anniversary",
          "housewarming",
          "community_function",
          "religious",
          "spiritual",
          "informational",
          "youtube_live",
          "other",
        ],
        message: "Invalid event type",
      },
    },
    description: {
      type: String,
      maxLength: [2000, "Description cannot exceed 2000 characters"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
    },
    location: {
      venueName: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        default: "India",
        trim: true,
      },
    },
    // Media attachments
    youtubeLinks: [
      {
        url: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        isLive: {
          type: Boolean,
          default: false,
        },
        thumbnail: {
          type: String,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    photos: [
      {
        url: {
          type: String,
          required: true,
        },
        caption: {
          type: String,
          trim: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    videos: [
      {
        url: {
          type: String,
          required: true,
        },
        caption: {
          type: String,
          trim: true,
        },
        thumbnail: {
          type: String,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    // Visibility and access
    visibility: {
      type: String,
      enum: {
        values: ["public", "samaj", "family", "role"],
        message: "Invalid visibility setting",
      },
      default: "public",
    },
    visibleToSamaj: [
      {
        type: String, // Samaj type values
      },
    ],
    visibleToRoles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    visibleToFamilies: [
      {
        type: String, // subFamilyNumber
      },
    ],
    // Status
    status: {
      type: String,
      enum: {
        values: ["upcoming", "ongoing", "completed", "cancelled"],
        message: "Invalid status",
      },
      default: "upcoming",
    },
    // Special flags
    isPinned: {
      type: Boolean,
      default: false,
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    allowRSVP: {
      type: Boolean,
      default: false,
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    // Funeral/Condolence specific fields
    funeralDetails: {
      deceasedName: {
        type: String,
        trim: true,
      },
      deceasedAge: {
        type: Number,
      },
      relation: {
        type: String,
        trim: true,
      },
      dateOfDeath: {
        type: Date,
      },
      prayerMeetDetails: {
        type: String,
        trim: true,
      },
      familyContactPerson: {
        type: String,
        trim: true,
      },
      familyContactNumber: {
        type: String,
        trim: true,
      },
    },
    // Related person (for marriage, birthday, etc.)
    relatedPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    relatedPersonName: {
      type: String,
      trim: true,
    },
    // Recurring events
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      type: String,
      enum: ["yearly", "monthly", "weekly"],
    },
    // Creator and metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved", // Auto-approved for admins, pending for regular users
    },
    approvedAt: {
      type: Date,
    },
    // RSVP counts
    rsvpCounts: {
      attending: {
        type: Number,
        default: 0,
      },
      notAttending: {
        type: Number,
        default: 0,
      },
      maybe: {
        type: Number,
        default: 0,
      },
    },
    // Statistics
    viewCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    pollCount: {
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

// Indexes for performance
eventSchema.index({ startDate: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ isPinned: -1, startDate: 1 }); // For sorting pinned events first
eventSchema.index({ visibility: 1, visibleToSamaj: 1 });
eventSchema.index({ "location.city": 1 });

// Virtual for checking if event is live (YouTube Live)
eventSchema.virtual("isLive").get(function () {
  const now = new Date();
  return (
    this.status === "ongoing" &&
    this.youtubeLinks.some((link) => link.isLive === true) &&
    this.startDate <= now &&
    (!this.endDate || this.endDate >= now)
  );
});

// Method to check if user can view event
eventSchema.methods.canUserView = function (user) {
  // Clean visibility value (remove trailing commas/whitespace)
  const cleanVisibility = this.visibility ? this.visibility.toString().trim().replace(/,$/, '') : null;
  
  // If visibility is not set or is invalid, default to public (visible to all)
  if (!cleanVisibility || !["public", "samaj", "family", "role"].includes(cleanVisibility)) {
    return true; // Default to public if invalid
  }
  
  // Public events are always visible
  if (cleanVisibility === "public") return true;
  
  // If no user, only public events are visible
  if (!user) return false;

  // Samaj-based visibility
  if (cleanVisibility === "samaj") {
    // If no samaj restrictions, visible to all authenticated users
    if (!this.visibleToSamaj || this.visibleToSamaj.length === 0) return true;
    // Check if user's samaj is in the list
    return user.samaj && this.visibleToSamaj.includes(user.samaj);
  }

  // Family-based visibility
  if (cleanVisibility === "family") {
    // If no family restrictions, visible to all authenticated users
    if (!this.visibleToFamilies || this.visibleToFamilies.length === 0) return true;
    // Check if user's subFamilyNumber is in the list
    return user.subFamilyNumber && this.visibleToFamilies.includes(user.subFamilyNumber);
  }

  // Role-based visibility
  if (cleanVisibility === "role") {
    // If no role restrictions, visible to all authenticated users
    if (!this.visibleToRoles || this.visibleToRoles.length === 0) return true;
    // Check if user has roleRef populated
    if (!user.roleRef) return false;
    // Get role ID (handle both populated object and ID string)
    const userRoleId = user.roleRef._id ? user.roleRef._id.toString() : user.roleRef.toString();
    // Check if user's role is in the list
    return this.visibleToRoles.some((roleId) => {
      const roleIdStr = roleId._id ? roleId._id.toString() : roleId.toString();
      return roleIdStr === userRoleId;
    });
  }

  // Default: allow access if visibility type is unknown (fail open for safety)
  return true;
};

// Pre-save hook to update status based on dates
eventSchema.pre("save", function (next) {
  try {
    const now = new Date();
    
    if (this.status !== "cancelled") {
      if (this.startDate > now) {
        this.status = "upcoming";
      } else if (this.endDate && this.endDate < now) {
        this.status = "completed";
      } else if (this.startDate <= now && (!this.endDate || this.endDate >= now)) {
        this.status = "ongoing";
      }
    }
    
    if (typeof next === "function") {
      next();
    }
  } catch (error) {
    if (typeof next === "function") {
      next(error);
    } else {
      throw error;
    }
  }
});

module.exports = mongoose.model("Event", eventSchema);

