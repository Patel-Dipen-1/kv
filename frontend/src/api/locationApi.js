import axiosInstance from "./axiosConfig";

/**
 * Location API Service
 * Handles all location-related API calls
 */

/**
 * Get location by city name
 * @param {string} city - City name
 * @param {string} country - Optional country filter
 * @param {string} state - Optional state filter
 * @returns {Promise} Location data with city, state, country, pincode(s)
 */
export const getLocationByCity = async (city, country = null, state = null) => {
  try {
    const params = { city };
    if (country) params.country = country;
    if (state) params.state = state;

    const response = await axiosInstance.get("/locations", { params });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch location data"
    );
  }
};

/**
 * Search cities for autocomplete
 * @param {string} query - Search query
 * @param {string} country - Optional country filter
 * @param {number} limit - Maximum results (default: 20)
 * @returns {Promise} Array of city suggestions
 */
export const searchCities = async (query, country = null, limit = 20) => {
  try {
    const params = { q: query, limit };
    if (country) params.country = country;

    console.log("🌐 Calling API: /locations/search with params:", params);
    console.log("🌐 Full URL will be:", axiosInstance.defaults.baseURL + "/locations/search");
    
    // Make API call with timeout
    const response = await axiosInstance.get("/locations/search", { 
      params, 
      timeout: 10000 // 10 second timeout
    });
    
    // Log for debugging
    console.log("✅ Search cities API response:", response.data);
    console.log("Response structure:", {
      success: response.data?.success,
      data: response.data?.data,
      dataType: Array.isArray(response.data?.data) ? 'array' : typeof response.data?.data,
      dataLength: Array.isArray(response.data?.data) ? response.data?.data.length : 'N/A',
      count: response.data?.count
    });
    
    return response.data;
  } catch (error) {
    console.error("❌ Search cities error:", error);
    console.error("Error status:", error.response?.status);
    console.error("Error response:", error.response?.data);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    
    // Check if it's a network error
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error("⏱️ Request timed out - backend might be slow or not responding");
    }
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error("🌐 Network error - backend might not be running");
    }
    if (error.response?.status === 404) {
      console.error("🔍 404 - API endpoint not found. Check if backend route is registered.");
    }
    
    // Return empty result instead of throwing to allow typing to continue
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || error.message || "Failed to search cities"
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

