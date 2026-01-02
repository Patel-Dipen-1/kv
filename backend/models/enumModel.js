const mongoose = require("mongoose");

/**
 * Enum Management Model
 * Stores enum values in database for easy admin management
 */
const enumSchema = new mongoose.Schema(
  {
    enumType: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "USER_ROLES",
        "USER_STATUS",
        "COMMITTEE_POSITIONS",
        "MARITAL_STATUS",
        "OCCUPATION_TYPES",
        "RELATIONSHIP_TYPES",
        "SAMAJ_TYPES",
        "COUNTRIES",
      ],
      index: true,
    },
    values: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "Enum must have at least one value",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
enumSchema.index({ enumType: 1, isActive: 1 });

module.exports = mongoose.model("Enum", enumSchema);

