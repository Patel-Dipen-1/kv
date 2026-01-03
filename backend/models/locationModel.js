const mongoose = require("mongoose");

/**
 * Location Model
 * Stores city, state, country, and pincode data for auto-selection
 * 
 * Data Model:
 * - One city can have multiple pincodes
 * - City names can be duplicated across states/countries
 * - Primary pincode is the first/main pincode
 */
const locationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, "City name is required"],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, "State name is required"],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: [true, "Country name is required"],
      trim: true,
      default: "India",
      index: true,
    },
    pincodes: {
      type: [String],
      required: [true, "At least one pincode is required"],
      validate: {
        validator: function (v) {
          return v && v.length > 0 && v.every(pin => /^\d{6}$/.test(pin));
        },
        message: "Pincodes must be an array of 6-digit numbers",
      },
    },
    primaryPincode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{6}$/.test(v);
        },
        message: "Primary pincode must be a 6-digit number",
      },
    },
    // For handling duplicate city names
    isActive: {
      type: Boolean,
      default: true,
    },
    // Additional metadata
    latitude: {
      type: String,
      trim: true,
    },
    longitude: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast lookups
locationSchema.index({ city: 1, state: 1, country: 1 });
locationSchema.index({ city: 1, country: 1 });
locationSchema.index({ city: 1, isActive: 1 });

// Text index for search
locationSchema.index({ city: "text", state: "text" });

// Ensure primaryPincode is set from first pincode
locationSchema.pre("save", function (next) {
  if (this.pincodes && this.pincodes.length > 0 && !this.primaryPincode) {
    this.primaryPincode = this.pincodes[0];
  }
  next();
});

// Static method: Find location by city name
locationSchema.statics.findByCity = async function (cityName, country = null) {
  const query = {
    city: { $regex: new RegExp(`^${cityName}$`, "i") },
    isActive: true,
  };
  
  if (country) {
    query.country = { $regex: new RegExp(`^${country}$`, "i") };
  }
  
  return this.find(query).sort({ state: 1 });
};

// Static method: Find exact match
locationSchema.statics.findExact = async function (city, state, country) {
  return this.findOne({
    city: { $regex: new RegExp(`^${city}$`, "i") },
    state: { $regex: new RegExp(`^${state}$`, "i") },
    country: { $regex: new RegExp(`^${country}$`, "i") },
    isActive: true,
  });
};

// Instance method: Get response format
locationSchema.methods.toResponse = function () {
  return {
    city: this.city,
    state: this.state,
    country: this.country,
    pincode: this.primaryPincode,
    pincodes: this.pincodes,
  };
};

module.exports = mongoose.model("Location", locationSchema);

