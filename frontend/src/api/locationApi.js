import axiosInstance from "./axiosConfig";

/**
 * Location API Service
 * Handles all location-related API calls
 */

/**
 * Get location by city name using library
 * @param {string} city - City name
 * @param {string} state - Optional state name for disambiguation
 * @param {string} countryCode - Country code (default: "IN" for India)
 * @returns {Promise} Location data with city, state, country, pincode(s)
 */
export const getLocationByCity = async (city, state = null, countryCode = "IN") => {
  try {
    const params = { city, countryCode };
    if (state) params.state = state;

    const response = await axiosInstance.get("/locations", { params });
    return response.data;
  } catch (error) {
    // Return error object instead of throwing to allow graceful handling
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch location data",
      data: null,
    };
  }
};

/**
 * Search cities for autocomplete using library
 * @param {string} query - Search query
 * @param {string} countryCode - Country code (default: "IN" for India)
 * @param {number} limit - Maximum results (default: 50)
 * @returns {Promise} Array of city suggestions
 */
export const searchCities = async (query, countryCode = "IN", limit = 50) => {
  try {
    const params = { q: query, countryCode, limit };
    
    const response = await axiosInstance.get("/locations/search", { 
      params, 
      timeout: 10000 // 10 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error("❌ Search cities error:", error);
    
    // Return empty result instead of throwing to allow typing to continue
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || error.message || "Failed to search cities"
    };
  }
};

/**
 * Get all unique cities for dropdown (Public)
 * @param {string} country - Optional country filter
 * @param {number} limit - Maximum results (default: 1000)
 * @returns {Promise} Array of unique cities
 */
export const getAllCities = async (country = null, limit = 1000) => {
  try {
    const params = { limit };
    if (country) params.country = country;

    console.log("🌐 Calling getAllCities API with params:", params);
    const response = await axiosInstance.get("/locations/cities", { 
      params,
      timeout: 15000 // 15 second timeout
    });
    
    console.log("✅ getAllCities API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ getAllCities API error:", error);
    console.error("Error status:", error.response?.status);
    console.error("Error response data:", error.response?.data);
    console.error("Error message:", error.message);
    
    // Return error object instead of throwing to allow fallback
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || error.message || "Failed to fetch cities"
    };
  }
};

/**
 * Get all locations (Admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise} Paginated location data
 */
export const getAllLocations = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/locations/all", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch locations"
    );
  }
};

/**
 * Create location (Admin only)
 * @param {Object} locationData - Location data
 * @returns {Promise} Created location
 */
export const createLocation = async (locationData) => {
  try {
    const response = await axiosInstance.post("/locations", locationData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to create location"
    );
  }
};

/**
 * Update location (Admin only)
 * @param {string} id - Location ID
 * @param {Object} locationData - Updated location data
 * @returns {Promise} Updated location
 */
export const updateLocation = async (id, locationData) => {
  try {
    const response = await axiosInstance.put(`/locations/${id}`, locationData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to update location"
    );
  }
};

/**
 * Delete location (Admin only)
 * @param {string} id - Location ID
 * @returns {Promise} Success message
 */
export const deleteLocation = async (id) => {
  try {
    const response = await axiosInstance.delete(`/locations/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to delete location"
    );
  }
};

