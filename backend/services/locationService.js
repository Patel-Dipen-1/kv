const { City, State, Country } = require("country-state-city");

/**
 * Location Service using country-state-city library
 * Provides city, state, country, and pincode lookup functionality
 */

// Cache for performance (in-memory cache)
const cityCache = new Map();
const stateCache = new Map();
const pincodeCache = new Map();

/**
 * Search cities by query string
 * @param {string} query - Search query (city name)
 * @param {string} countryCode - Optional country code (e.g., "IN" for India)
 * @param {number} limit - Maximum results
 * @returns {Array} Array of city objects with state and country info
 */
const searchCities = (query, countryCode = "IN", limit = 50) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchKey = `${query.toLowerCase()}_${countryCode}_${limit}`;
  
  // Check cache
  if (cityCache.has(searchKey)) {
    return cityCache.get(searchKey);
  }

  const searchQuery = query.trim().toLowerCase();
  const allCities = City.getCitiesOfCountry(countryCode) || [];
  
  // Filter cities by name (case-insensitive)
  const matchedCities = allCities
    .filter((city) => {
      const cityName = city.name.toLowerCase();
      return cityName.includes(searchQuery) || searchQuery.includes(cityName);
    })
    .slice(0, limit)
    .map((city) => {
      // Get state and country info
      const state = State.getStateByCodeAndCountry(city.stateCode, countryCode);
      const country = Country.getCountryByCode(countryCode);
      
      return {
        city: city.name,
        state: state?.name || city.stateCode,
        stateCode: city.stateCode,
        country: country?.name || "India",
        countryCode: countryCode,
        latitude: city.latitude,
        longitude: city.longitude,
      };
    });

  // Cache result (expire after 1 hour)
  cityCache.set(searchKey, matchedCities);
  setTimeout(() => cityCache.delete(searchKey), 3600000);

  return matchedCities;
};

/**
 * Get city details by exact name
 * @param {string} cityName - City name
 * @param {string} stateName - Optional state name for disambiguation
 * @param {string} countryCode - Country code (default: "IN")
 * @returns {Object|null} City object with state and country info
 */
const getCityByName = (cityName, stateName = null, countryCode = "IN") => {
  if (!cityName) return null;

  const cacheKey = `${cityName.toLowerCase()}_${stateName || ""}_${countryCode}`;
  if (cityCache.has(cacheKey)) {
    return cityCache.get(cacheKey);
  }

  const allCities = City.getCitiesOfCountry(countryCode) || [];
  const cityNameLower = cityName.trim().toLowerCase();

  // Find exact match first
  let city = allCities.find(
    (c) => c.name.toLowerCase() === cityNameLower
  );

  // If state is provided and multiple cities found, filter by state
  if (stateName && city) {
    const state = State.getStateByCodeAndCountry(city.stateCode, countryCode);
    if (state && state.name.toLowerCase() !== stateName.toLowerCase()) {
      // Try to find city in the specified state
      const citiesInState = allCities.filter(
        (c) =>
          c.name.toLowerCase() === cityNameLower &&
          c.stateCode === city.stateCode
      );
      city = citiesInState[0] || city;
    }
  }

  if (!city) return null;

  const state = State.getStateByCodeAndCountry(city.stateCode, countryCode);
  const country = Country.getCountryByCode(countryCode);

  const result = {
    city: city.name,
    state: state?.name || city.stateCode,
    stateCode: city.stateCode,
    country: country?.name || "India",
    countryCode: countryCode,
    latitude: city.latitude,
    longitude: city.longitude,
  };

  cityCache.set(cacheKey, result);
  return result;
};

/**
 * Get state by name or code
 * @param {string} stateName - State name
 * @param {string} countryCode - Country code (default: "IN")
 * @returns {Object|null} State object
 */
const getStateByName = (stateName, countryCode = "IN") => {
  if (!stateName) return null;

  const allStates = State.getStatesOfCountry(countryCode) || [];
  const stateNameLower = stateName.trim().toLowerCase();

  const state = allStates.find(
    (s) =>
      s.name.toLowerCase() === stateNameLower ||
      s.isoCode.toLowerCase() === stateNameLower
  );

  if (!state) return null;

  const country = Country.getCountryByCode(countryCode);

  return {
    state: state.name,
    stateCode: state.isoCode,
    country: country?.name || "India",
    countryCode: countryCode,
  };
};

/**
 * Get pincode for a city
 * Note: country-state-city doesn't include pincode data
 * This will use database lookup or external API
 * For now, returns primary pincode from database if available
 * @param {string} cityName - City name
 * @param {string} stateName - State name
 * @param {string} countryCode - Country code
 * @returns {Promise<Object>} Pincode data
 */
const getPincodeForCity = async (cityName, stateName, countryCode = "IN") => {
  // Try to get from database first
  const Location = require("../models/locationModel");
  
  try {
    const location = await Location.findExact(
      cityName,
      stateName || "",
      countryCode === "IN" ? "India" : ""
    );

    if (location) {
      return {
        pincode: location.primaryPincode,
        pincodes: location.pincodes,
        hasMultiple: location.pincodes.length > 1,
      };
    }
  } catch (error) {
    console.error("Error fetching pincode from database:", error);
  }

  // Fallback: Return null if not found in database
  // In production, you could integrate with India Post API or pincode service
  return {
    pincode: null,
    pincodes: [],
    hasMultiple: false,
  };
};

/**
 * Get all states for a country
 * @param {string} countryCode - Country code (default: "IN")
 * @returns {Array} Array of state objects
 */
const getAllStates = (countryCode = "IN") => {
  const cacheKey = `states_${countryCode}`;
  if (stateCache.has(cacheKey)) {
    return stateCache.get(cacheKey);
  }

  const states = State.getStatesOfCountry(countryCode) || [];
  const country = Country.getCountryByCode(countryCode);

  const result = states.map((state) => ({
    state: state.name,
    stateCode: state.isoCode,
    country: country?.name || "India",
    countryCode: countryCode,
  }));

  stateCache.set(cacheKey, result);
  return result;
};

/**
 * Get all cities for a state
 * @param {string} stateCode - State code
 * @param {string} countryCode - Country code (default: "IN")
 * @returns {Array} Array of city objects
 */
const getCitiesByState = (stateCode, countryCode = "IN") => {
  const cacheKey = `cities_${stateCode}_${countryCode}`;
  if (cityCache.has(cacheKey)) {
    return cityCache.get(cacheKey);
  }

  const cities = City.getCitiesOfState(countryCode, stateCode) || [];
  const state = State.getStateByCodeAndCountry(stateCode, countryCode);
  const country = Country.getCountryByCode(countryCode);

  const result = cities.map((city) => ({
    city: city.name,
    state: state?.name || stateCode,
    stateCode: stateCode,
    country: country?.name || "India",
    countryCode: countryCode,
    latitude: city.latitude,
    longitude: city.longitude,
  }));

  cityCache.set(cacheKey, result);
  return result;
};

/**
 * Validate city-state-country combination
 * @param {string} cityName - City name
 * @param {string} stateName - State name
 * @param {string} countryCode - Country code
 * @returns {boolean} True if valid combination
 */
const validateLocation = (cityName, stateName, countryCode = "IN") => {
  const city = getCityByName(cityName, stateName, countryCode);
  if (!city) return false;

  if (stateName) {
    return city.state.toLowerCase() === stateName.toLowerCase();
  }

  return true;
};

module.exports = {
  searchCities,
  getCityByName,
  getStateByName,
  getPincodeForCity,
  getAllStates,
  getCitiesByState,
  validateLocation,
};

