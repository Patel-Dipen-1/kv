import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { getLocationByCity, searchCities } from "../../api/locationApi";

/**
 * Location Auto-Selection System
 * 
 * PRIMARY INPUT: City
 * AUTO-FILLED: Country, State, Pincode
 * 
 * Features:
 * - City search with autocomplete
 * - Automatic country, state, pincode population
 * - Handles multiple pincodes
 * - Validation and error handling
 * - Caching for performance
 */

// Cache for location data (in-memory cache)
const locationCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedLocation = (city) => {
  const cached = locationCache.get(city.toLowerCase());
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedLocation = (city, data) => {
  locationCache.set(city.toLowerCase(), {
    data,
    timestamp: Date.now(),
  });
};

/**
 * City Input Component with Autocomplete
 */
const CityInput = ({ value, onChange, onSelect, error, disabled, required, onApiError }) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [clickedOnDropdown, setClickedOnDropdown] = useState(false);
  const [apiError, setApiError] = useState(null); // Local API error state
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync searchTerm with value prop
  useEffect(() => {
    if (value !== undefined && value !== searchTerm) {
      setSearchTerm(value || "");
    }
  }, [value]);

  // Debounced search
  const searchCitiesDebounced = useCallback(async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(false); // Close while loading
    if (onApiError) onApiError(null); // Clear previous errors
    
    try {
      console.log("🔍 Starting search for:", query);
      const response = await searchCities(query);
      console.log("🔍 Search response for '" + query + "':", response); // Debug log
      console.log("Response type:", typeof response);
      console.log("Response keys:", response ? Object.keys(response) : 'null');
      
      // Handle different response structures
      let suggestionsData = [];
      
      if (response) {
        // Case 1: response.data is an array directly
        if (Array.isArray(response.data)) {
          suggestionsData = response.data;
        }
        // Case 2: response.data.data is an array
        else if (response.data && Array.isArray(response.data.data)) {
          suggestionsData = response.data.data;
        }
        // Case 3: response is an array directly
        else if (Array.isArray(response)) {
          suggestionsData = response;
        }
        // Case 4: response.success and response.data exists
        else if (response.success && Array.isArray(response.data)) {
          suggestionsData = response.data;
        }
      }
      
      console.log("📊 Extracted suggestions:", suggestionsData.length, suggestionsData);
      
      if (suggestionsData.length > 0) {
        setSuggestions(suggestionsData);
        setIsOpen(true); // Open dropdown with results
        setApiError(null); // Clear errors on success
        if (onApiError) onApiError(null); // Clear errors on success
        console.log("✅ Dropdown opened with", suggestionsData.length, "suggestions"); // Debug log
      } else {
        console.log("⚠️ No suggestions found for:", query); // Debug log
        console.log("Full response was:", JSON.stringify(response, null, 2));
        setSuggestions([]);
        setIsOpen(false);
        // Check if it's an error response
        const errorMsg = response && response.success === false ? (response.message || "No cities found") : null;
        if (errorMsg) {
          setApiError(errorMsg);
          if (onApiError) onApiError(errorMsg);
        } else {
          setApiError(null);
          if (onApiError) onApiError(null);
        }
      }
    } catch (error) {
      console.error("❌ Error searching cities:", error);
      console.error("Error details:", error.message); // More debug info
      console.error("Error stack:", error.stack);
      setSuggestions([]);
      setIsOpen(false);
      const errorMsg = error.message || "Failed to search cities. Please check if backend is running.";
      setApiError(errorMsg);
      if (onApiError) {
        onApiError(errorMsg);
      }
    } finally {
      setIsLoading(false);
      console.log("🏁 Search completed, isLoading set to false");
    }
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // Clear API error when user starts typing
    if (apiError) {
      setApiError(null);
      if (onApiError) onApiError(null);
    }
    
    // Update form field immediately
    if (onChange) {
      onChange({
        target: {
          name: "address.city",
          value: newValue,
        },
      });
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce search - search after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      if (newValue.trim().length >= 2) {
        searchCitiesDebounced(newValue.trim());
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);
  };

  // Handle blur - if user typed a city name, try to fetch location
  const handleBlur = (e) => {
    // Small delay to allow dropdown click to register
    setTimeout(() => {
      // Check if the related target (what we're clicking on) is inside the dropdown
      if (!clickedOnDropdown && (!e.relatedTarget || !wrapperRef.current?.contains(e.relatedTarget))) {
        setIsOpen(false);
        const trimmedCity = searchTerm.trim();
        if (trimmedCity.length >= 2 && onSelect) {
          // If user typed a city name (not selected from dropdown), try to fetch
          onSelect({ city: trimmedCity });
        }
      }
      setClickedOnDropdown(false);
    }, 250);
  };

  // Handle city selection
  const handleSelectCity = (cityData) => {
    const cityName = cityData.city;
    setClickedOnDropdown(true);
    setSearchTerm(cityName);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    // Trigger onChange to update form
    if (onChange) {
      onChange({
        target: {
          name: "address.city",
          value: cityName,
        },
      });
    }
    
    // Trigger onSelect for location fetch
    if (onSelect) {
      onSelect(cityData);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (isOpen && suggestions.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          // Scroll into view if needed
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            // Select from dropdown
            handleSelectCity(suggestions[selectedIndex]);
          } else if (searchTerm.trim().length >= 2) {
            // If no suggestion selected but city name typed, try to fetch location
            setIsOpen(false);
            if (onSelect) {
              onSelect({ city: searchTerm.trim() });
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    } else if (e.key === "Enter" && searchTerm.trim().length >= 2) {
      // If dropdown is closed but Enter is pressed, try to fetch location
      e.preventDefault();
      if (onSelect) {
        onSelect({ city: searchTerm.trim() });
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef} style={{ position: 'relative', zIndex: 1 }}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        City <span className="text-red-500">*</span>
      </label>
      <div className="relative w-full">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            // If there are existing suggestions, show them
            if (suggestions.length > 0) {
              setIsOpen(true);
            } 
            // If user has typed something, search again
            else if (searchTerm.trim().length >= 2) {
              searchCitiesDebounced(searchTerm.trim());
            }
          }}
          placeholder="Type city name (e.g., Ahmedabad)"
          disabled={disabled}
          required={required}
          className={`w-full pl-10 pr-10 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
            error ? "border-red-500" : "border-gray-300"
          } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 size={18} className="text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div 
          className="absolute z-[9999] w-full mt-1 bg-white border-2 border-blue-200 rounded-lg shadow-2xl max-h-60 overflow-auto"
          style={{ top: '100%', left: 0 }}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent blur from firing
            e.stopPropagation();
            setClickedOnDropdown(true);
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.city}-${suggestion.state}-${suggestion.country}-${index}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectCity(suggestion);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectCity(suggestion);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`px-4 py-3 cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors border-b border-gray-100 last:border-b-0 ${
                  index === selectedIndex ? "bg-blue-50" : "bg-white"
                }`}
              >
                <div className="font-semibold text-gray-900 text-base">{suggestion.city}</div>
                <div className="text-sm text-gray-600 mt-0.5">
                  {suggestion.state}, {suggestion.country}
                  {suggestion.pincode && (
                    <span className="ml-2 text-gray-500">({suggestion.pincode})</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Show message if no results */}
      {isOpen && !isLoading && suggestions.length === 0 && searchTerm.trim().length >= 2 && (
        <div 
          className="absolute z-[9999] w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl" 
          style={{ top: '100%', left: 0 }}
        >
          <div className="px-4 py-3 text-sm text-gray-600 text-center">
            <div className="font-medium">No cities found</div>
            <div className="text-xs text-gray-500 mt-1">
              Try typing the full city name or press Enter to search
            </div>
          </div>
        </div>
      )}
      
      {/* Error message for user */}
      {apiError && !isLoading && searchTerm.length >= 2 && (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded mt-1">
          <div className="font-medium">⚠️ Unable to search cities</div>
          <div className="text-xs mt-1">
            {apiError.includes('timeout') && "Backend is taking too long to respond. Please check if the server is running."}
            {apiError.includes('Network') && "Cannot connect to backend. Please check if the server is running."}
            {apiError.includes('404') && "API endpoint not found. Please check backend routes."}
            {!apiError.includes('timeout') && !apiError.includes('Network') && !apiError.includes('404') && apiError}
          </div>
          <div className="text-xs mt-1 text-gray-600">
            💡 Tip: Make sure backend is running and location data is seeded (run: node backend/scripts/seedLocations.js)
          </div>
        </div>
      )}
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && searchTerm.length > 0 && (
        <div className="text-xs text-gray-400 mt-1 p-2 bg-gray-50 rounded">
          <div>Debug: isOpen={isOpen ? '✓' : '✗'}, suggestions={suggestions.length}, isLoading={isLoading ? '⏳' : '✓'}</div>
          {suggestions.length > 0 && (
            <div className="mt-1">Found: {suggestions.map(s => s.city).join(', ')}</div>
          )}
          {isLoading && (
            <div className="mt-1 text-amber-600">⏳ API call in progress... Check console for details.</div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

/**
 * Auto-filled Field Component (Read-only)
 */
const AutoFilledField = ({ label, value, error, required }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value || ""}
        readOnly
        disabled
        className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed min-h-[44px]"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

/**
 * Pincode Select Component
 * Shows dropdown if multiple pincodes, otherwise shows single value
 */
const PincodeSelect = ({ pincodes, value, onChange, error, required }) => {
  const hasMultiple = pincodes && pincodes.length > 1;

  if (hasMultiple) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pincode {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value || ""}
          onChange={onChange}
          required={required}
          className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select pincode</option>
          {pincodes.map((pin) => (
            <option key={pin} value={pin}>
              {pin} {pin === pincodes[0] && "(Primary)"}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <AutoFilledField
      label="Pincode"
      value={pincodes && pincodes.length > 0 ? pincodes[0] : ""}
      error={error}
      required={required}
    />
  );
};

/**
 * Main Location Auto-Select Component
 * 
 * @param {Object} value - Current form values { city, country, state, pincode }
 * @param {Function} setValue - react-hook-form setValue function
 * @param {Function} register - react-hook-form register function (optional, for validation)
 * @param {Object} errors - Form errors object
 * @param {boolean} disabled - Disable all inputs
 */
const LocationAutoSelect = ({
  value = {},
  setValue,
  register,
  errors = {},
  disabled = false,
}) => {
  const [locationData, setLocationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiError, setApiError] = useState(null); // Track API search errors

  // Fetch location when city is selected
  const fetchLocation = async (cityName) => {
    if (!cityName || cityName.trim() === "") {
      setLocationData(null);
      clearFormFields();
      return;
    }

    // Check cache first
    const cached = getCachedLocation(cityName);
    if (cached) {
      setLocationData(cached);
      updateFormFields(cached);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getLocationByCity(cityName);
      if (response.success && response.data) {
        const data = response.data;
        setLocationData(data);
        setCachedLocation(cityName, data);
        updateFormFields(data);
        setError(null);
      } else {
        throw new Error("Location not found");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch location data");
      setLocationData(null);
      clearFormFields();
    } finally {
      setIsLoading(false);
    }
  };

  // Update form fields when location data is fetched
  const updateFormFields = (data) => {
    if (!setValue || !data) return;

    // Set country
    if (data.country) {
      setValue("address.country", data.country, { shouldValidate: true });
    }

    // Set state
    if (data.state) {
      setValue("address.state", data.state, { shouldValidate: true });
    }

    // Set pincode (use primary pincode or first in array)
    const pincode = data.pincode || (data.pincodes && data.pincodes[0]) || "";
    if (pincode) {
      setValue("address.pincode", pincode, { shouldValidate: true });
    }
  };

  // Clear form fields
  const clearFormFields = () => {
    if (!setValue) return;
    
    setValue("address.country", "", { shouldValidate: false });
    setValue("address.state", "", { shouldValidate: false });
    setValue("address.pincode", "", { shouldValidate: false });
  };

  // Handle city selection
  const handleCitySelect = (cityData) => {
    fetchLocation(cityData.city);
  };

  // Handle city input change
  const handleCityChange = (e) => {
    const cityName = e.target.value;
    // Update city field
    if (setValue) {
      setValue("address.city", cityName, { shouldValidate: true });
    }
    
    // If city is cleared, clear other fields
    if (cityName.trim() === "") {
      setLocationData(null);
      clearFormFields();
    }
  };

  // Handle pincode change (when multiple pincodes)
  const handlePincodeChange = (e) => {
    if (setValue) {
      setValue("address.pincode", e.target.value, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden inputs for react-hook-form validation */}
      {register && (
        <>
          <input
            type="hidden"
            {...register("address.city", { required: "City is required" })}
          />
          <input
            type="hidden"
            {...register("address.country", { required: "Country is required" })}
          />
          <input
            type="hidden"
            {...register("address.state", { required: "State is required" })}
          />
          <input
            type="hidden"
            {...register("address.pincode", { 
              required: "Pincode is required",
              pattern: {
                value: /^\d{6}$/,
                message: "Pincode must be 6 digits"
              }
            })}
          />
        </>
      )}
      
      {/* City Input */}
      <CityInput
        value={value.city}
        onChange={handleCityChange}
        onSelect={handleCitySelect}
        onApiError={setApiError}
        error={errors.address?.city?.message}
        disabled={disabled || isLoading}
        required
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 size={16} className="animate-spin" />
          <span>Fetching location data...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Auto-filled Fields */}
      {locationData && !isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AutoFilledField
              label="Country"
              value={locationData.country}
              error={errors.address?.country?.message}
              required
            />
            <AutoFilledField
              label="State"
              value={locationData.state}
              error={errors.address?.state?.message}
              required
            />
          </div>

          <PincodeSelect
            pincodes={locationData.pincodes}
            value={value.pincode}
            onChange={handlePincodeChange}
            error={errors.address?.pincode?.message}
            required
          />
        </>
      )}
    </div>
  );
};

export default LocationAutoSelect;

