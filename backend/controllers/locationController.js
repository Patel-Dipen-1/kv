const Location = require("../models/locationModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const locationService = require("../services/locationService");

/**
 * Get location by city name using country-state-city library
 * GET /api/locations?city=Ahmedabad&state=Gujarat&countryCode=IN
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
  const { city, state, countryCode = "IN" } = req.query;

  // Validation
  if (!city || city.trim() === "") {
    return next(new ErrorHandler("City parameter is required", 400));
  }

  const cityName = city.trim();
  const stateName = state ? state.trim() : null;

  try {
    // Get city from library
    const cityData = locationService.getCityByName(cityName, stateName, countryCode);

    if (!cityData) {
      return res.status(404).json({
        success: false,
        message: `City "${cityName}" not found. Please check the spelling or try a different city.`,
        data: null,
      });
    }

    // Get pincode from database (if available)
    const pincodeData = await locationService.getPincodeForCity(
      cityData.city,
      cityData.state,
      countryCode
    );

    // Build response
    const responseData = {
      city: cityData.city,
      state: cityData.state,
      stateCode: cityData.stateCode,
      country: cityData.country,
      countryCode: cityData.countryCode,
      latitude: cityData.latitude,
      longitude: cityData.longitude,
      pincode: pincodeData.pincode,
      pincodes: pincodeData.pincodes.length > 0 
        ? pincodeData.pincodes 
        : (pincodeData.pincode ? [pincodeData.pincode] : []),
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return next(new ErrorHandler("Error fetching location data", 500));
  }
});

/**
 * Search cities using country-state-city library (autocomplete)
 * GET /api/locations/search?q=ahme&countryCode=IN
 */
exports.searchCities = catchAsyncErrors(async (req, res, next) => {
  const { q, countryCode = "IN", limit = 50 } = req.query;

  if (!q || q.trim() === "") {
    return next(new ErrorHandler("Search query (q) is required", 400));
  }

  try {
    // Use library service to search cities
    const cities = locationService.searchCities(q.trim(), countryCode, parseInt(limit));

    // Get pincodes from database for each city (optional - can be slow)
    // For performance, we'll skip pincode lookup in search results
    const suggestions = cities.map((city) => ({
      city: city.city,
      state: city.state,
      stateCode: city.stateCode,
      country: city.country,
      countryCode: city.countryCode,
    }));

    res.status(200).json({
      success: true,
      data: suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error("Error searching cities:", error);
    return next(new ErrorHandler("Error searching cities", 500));
  }
});

/**
 * Get all unique cities using library (Public - for dropdown)
 * GET /api/locations/cities?countryCode=IN&stateCode=GJ
 */
exports.getAllCities = catchAsyncErrors(async (req, res, next) => {
  const { countryCode = "IN", stateCode, limit = 1000 } = req.query;

  try {
    let cities = [];

    if (stateCode) {
      // Get cities for specific state
      cities = locationService.getCitiesByState(stateCode, countryCode);
    } else {
      // For large lists, use search with common letters
      // This is more efficient than loading all cities
      const commonLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
      const allResults = [];
      
      // Get cities starting with each letter
      for (const letter of commonLetters.slice(0, 10)) { // Limit to first 10 letters for performance
        const results = locationService.searchCities(letter, countryCode, Math.floor(parseInt(limit) / 10));
        allResults.push(...results);
      }
      
      // Remove duplicates
      const uniqueMap = new Map();
      allResults.forEach((city) => {
        const key = `${city.city.toLowerCase()}_${city.stateCode}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, city);
        }
      });
      
      cities = Array.from(uniqueMap.values()).slice(0, parseInt(limit));
    }

    res.status(200).json({
      success: true,
      data: cities,
      count: cities.length,
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return next(new ErrorHandler("Error fetching cities", 500));
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

