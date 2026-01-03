const Location = require("../models/locationModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/**
 * Get location by city name
 * GET /api/locations?city=Ahmedabad&country=India
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     city: "Ahmedabad",
 *     state: "Gujarat",
 *     country: "India",
 *     pincode: "380001",
 *     pincodes: ["380001", "380002", ...]
 *   }
 * }
 */
exports.getLocationByCity = catchAsyncErrors(async (req, res, next) => {
  const { city, country, state } = req.query;

  // Validation
  if (!city || city.trim() === "") {
    return next(new ErrorHandler("City parameter is required", 400));
  }

  const cityName = city.trim();

  try {
    let location;

    // If state and country are provided, try exact match first
    if (state && country) {
      location = await Location.findExact(cityName, state.trim(), country.trim());
    }

    // If not found or not provided, search by city (and country if provided)
    if (!location) {
      const locations = await Location.findByCity(cityName, country || null);

      if (locations.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Location not found for city: ${cityName}`,
          data: null,
        });
      }

      // If multiple locations found (duplicate city names)
      if (locations.length > 1) {
        // If country provided, filter by country
        if (country) {
          const filtered = locations.filter(
            (loc) => loc.country.toLowerCase() === country.trim().toLowerCase()
          );
          if (filtered.length > 0) {
            location = filtered[0];
          } else {
            location = locations[0]; // Default to first match
          }
        } else {
          // Default to first match (can be enhanced with user preference)
          location = locations[0];
        }
      } else {
        location = locations[0];
      }
    }

    res.status(200).json({
      success: true,
      data: location.toResponse(),
    });
  } catch (error) {
    return next(new ErrorHandler("Error fetching location data", 500));
  }
});

/**
 * Search cities (autocomplete)
 * GET /api/locations/search?q=ahme&country=India
 */
exports.searchCities = catchAsyncErrors(async (req, res, next) => {
  const { q, country, limit = 20 } = req.query;

  if (!q || q.trim() === "") {
    return next(new ErrorHandler("Search query (q) is required", 400));
  }

  const searchQuery = q.trim();
  const query = {
    city: { $regex: new RegExp(searchQuery, "i") },
    isActive: true,
  };

  if (country) {
    query.country = { $regex: new RegExp(`^${country.trim()}$`, "i") };
  }

  try {
    const locations = await Location.find(query)
      .select("city state country primaryPincode")
      .limit(parseInt(limit))
      .sort({ city: 1, state: 1 });

    // Group by city name to avoid duplicates in suggestions
    const cityMap = new Map();
    locations.forEach((loc) => {
      const key = `${loc.city.toLowerCase()}_${loc.state.toLowerCase()}_${loc.country.toLowerCase()}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          city: loc.city,
          state: loc.state,
          country: loc.country,
          pincode: loc.primaryPincode,
        });
      }
    });

    const suggestions = Array.from(cityMap.values());

    res.status(200).json({
      success: true,
      data: suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    return next(new ErrorHandler("Error searching cities", 500));
  }
});

/**
 * Get all locations (Admin only - for management)
 * GET /api/locations
 */
exports.getAllLocations = catchAsyncErrors(async (req, res, next) => {
  const { city, state, country, page = 1, limit = 50 } = req.query;

  const query = { isActive: true };

  if (city) {
    query.city = { $regex: new RegExp(city, "i") };
  }
  if (state) {
    query.state = { $regex: new RegExp(state, "i") };
  }
  if (country) {
    query.country = { $regex: new RegExp(country, "i") };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const locations = await Location.find(query)
      .sort({ country: 1, state: 1, city: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Location.countDocuments(query);

    res.status(200).json({
      success: true,
      data: locations.map((loc) => loc.toResponse()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return next(new ErrorHandler("Error fetching locations", 500));
  }
});

/**
 * Create location (Admin only)
 * POST /api/locations
 */
exports.createLocation = catchAsyncErrors(async (req, res, next) => {
  const { city, state, country, pincodes, latitude, longitude } = req.body;

  // Validation
  if (!city || !state || !country || !pincodes || pincodes.length === 0) {
    return next(
      new ErrorHandler("City, state, country, and at least one pincode are required", 400)
    );
  }

  // Check if location already exists
  const existing = await Location.findExact(city, state, country);
  if (existing) {
    return next(
      new ErrorHandler(
        `Location already exists: ${city}, ${state}, ${country}`,
        409
      )
    );
  }

  try {
    const location = await Location.create({
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      pincodes,
      primaryPincode: pincodes[0],
      latitude,
      longitude,
    });

    res.status(201).json({
      success: true,
      data: location.toResponse(),
      message: "Location created successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("Error creating location", 500));
  }
});

/**
 * Update location (Admin only)
 * PUT /api/locations/:id
 */
exports.updateLocation = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { city, state, country, pincodes, latitude, longitude } = req.body;

  const location = await Location.findById(id);
  if (!location) {
    return next(new ErrorHandler("Location not found", 404));
  }

  // Update fields
  if (city) location.city = city.trim();
  if (state) location.state = state.trim();
  if (country) location.country = country.trim();
  if (pincodes && pincodes.length > 0) {
    location.pincodes = pincodes;
    location.primaryPincode = pincodes[0];
  }
  if (latitude !== undefined) location.latitude = latitude;
  if (longitude !== undefined) location.longitude = longitude;

  try {
    await location.save();
    res.status(200).json({
      success: true,
      data: location.toResponse(),
      message: "Location updated successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("Error updating location", 500));
  }
});

/**
 * Delete location (Admin only - soft delete)
 * DELETE /api/locations/:id
 */
exports.deleteLocation = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const location = await Location.findById(id);
  if (!location) {
    return next(new ErrorHandler("Location not found", 404));
  }

  location.isActive = false;
  await location.save();

  res.status(200).json({
    success: true,
    message: "Location deleted successfully",
  });
});

