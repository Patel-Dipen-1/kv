import React, { useState, useRef, useEffect } from "react";
import { GetCountries, GetState, GetCity, GetAllCities } from "react-country-state-city";
import { ChevronDown, X, Search } from "lucide-react";

/**
 * Searchable Address Select Components
 * Provides easy-to-use, searchable dropdowns for Country, State, City, and Pincode
 */

const SearchableSelect = ({
  label,
  name,
  options = [],
  value,
  onChange,
  onBlur,
  error,
  placeholder = "Select or type to search...",
  required = false,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((option) =>
        option.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get display value
  const getDisplayValue = () => {
    if (!value) return "";
    const option = options.find((opt) => opt.name === value);
    return option?.name || value;
  };

  const handleSelect = (selectedOption) => {
    onChange({
      target: {
        name,
        value: selectedOption.name,
      },
    });
    setIsOpen(false);
    setSearchTerm("");
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({
      target: {
        name,
        value: "",
      },
    });
    setSearchTerm("");
  };

  const displayValue = isOpen ? searchTerm : getDisplayValue();

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm(getDisplayValue());
          }}
          onBlur={(e) => {
            setTimeout(() => {
              if (onBlur) onBlur(e);
            }, 200);
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full pl-10 pr-10 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
            error ? "border-red-500" : "border-gray-300"
          } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded focus:outline-none min-h-[24px] min-w-[24px] flex items-center justify-center"
              aria-label="Clear selection"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
          <ChevronDown
            size={20}
            className={`text-gray-400 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {filteredOptions.slice(0, 100).map((option, index) => {
              const isSelected = value === option.name;

              return (
                <li
                  key={option.id || index}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                    isSelected ? "bg-blue-100 font-medium" : ""
                  }`}
                >
                  {option.name}
                </li>
              );
            })}
            {filteredOptions.length > 100 && (
              <li className="px-4 py-2 text-sm text-gray-500 text-center">
                Showing first 100 results. Type to narrow down.
              </li>
            )}
          </ul>
        </div>
      )}

      {isOpen && !disabled && filteredOptions.length === 0 && searchTerm && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-4 py-2 text-sm text-gray-500 text-center">
            No results found
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Country Select Component
export const CountrySelect = ({ value, onChange, error, required, className = "", ...props }) => {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesList = await GetCountries();
        setCountries(countriesList || []);
      } catch (error) {
        console.error("Error loading countries:", error);
        setCountries([]);
      }
    };
    loadCountries();
  }, []);

  return (
    <SearchableSelect
      label="Country"
      name="country"
      options={countries}
      value={value}
      onChange={onChange}
      error={error}
      placeholder="Search and select country..."
      required={required}
      className={className}
      {...props}
    />
  );
};

// State Select Component
export const StateSelect = ({ 
  countryId, 
  value, 
  onChange, 
  error, 
  required, 
  className = "", 
  disabled,
  ...props 
}) => {
  const [states, setStates] = useState([]);

  useEffect(() => {
    const loadStates = async () => {
      if (countryId) {
        try {
          const countriesList = await GetCountries();
          const country = countriesList.find(
            (c) => c.name === countryId || c.id === parseInt(countryId)
          );
          if (country) {
            const stateList = await GetState(country.id);
            setStates(stateList || []);
          } else {
            setStates([]);
          }
        } catch (error) {
          console.error("Error loading states:", error);
          setStates([]);
        }
      } else {
        setStates([]);
      }
    };
    loadStates();
  }, [countryId]);

  return (
    <SearchableSelect
      label="State"
      name="state"
      options={states}
      value={value}
      onChange={onChange}
      error={error}
      placeholder={disabled || !countryId ? "Please select country first" : "Search and select state..."}
      required={required}
      disabled={disabled || !countryId}
      className={className}
      {...props}
    />
  );
};

// Helper function to fetch pincode based on city and state (for India)
const fetchPincodeByCity = async (city, state, country = "India") => {
  if (country !== "India") {
    return null; // Only support India for now
  }

  try {
    // Using a free India pincode API
    const response = await fetch(
      `https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`
    );
    const data = await response.json();
    
    if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
      // Filter by state if provided
      const postOffices = data[0].PostOffice;
      const filtered = state 
        ? postOffices.filter(po => 
            po.State.toLowerCase().includes(state.toLowerCase()) || 
            state.toLowerCase().includes(po.State.toLowerCase())
          )
        : postOffices;
      
      if (filtered.length > 0) {
        // Return the first pincode found
        return filtered[0].Pincode;
      }
      
      // If no state match, return first available pincode
      if (postOffices.length > 0) {
        return postOffices[0].Pincode;
      }
    }
  } catch (error) {
    console.error("Error fetching pincode:", error);
  }
  
  return null;
};

// City Select Component
export const CitySelect = ({ 
  countryId, 
  stateId, 
  value, 
  onChange, 
  error, 
  required, 
  className = "", 
  disabled,
  onCitySelect, // Callback to set country and state when city is selected
  ...props 
}) => {
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allowAllCities, setAllowAllCities] = useState(!stateId); // Allow all cities if state not selected

  useEffect(() => {
    setAllowAllCities(!stateId);
  }, [stateId]);

  useEffect(() => {
    const loadCities = async () => {
      setIsLoading(true);
      try {
        // Check if countryId and stateId are valid (not null, undefined, or empty string)
        const hasCountry = countryId && countryId !== "";
        const hasState = stateId && stateId !== "";
        
        if (hasCountry && hasState) {
          // Mode 1: Filter by country and state (existing behavior)
          const countriesList = await GetCountries();
          const country = countriesList.find(
            (c) => c.name === countryId || c.id === parseInt(countryId)
          );
          if (country) {
            const statesList = await GetState(country.id);
            const state = statesList.find(
              (s) => s.name === stateId || s.id === parseInt(stateId)
            );
            
            if (country && state) {
              const cityList = await GetCity(country.id, state.id);
              setCities(cityList || []);
            } else {
              setCities([]);
            }
          } else {
            setCities([]);
          }
        } else if (hasCountry) {
          // Mode 2: Load all cities from the country
          const countriesList = await GetCountries();
          const country = countriesList.find(
            (c) => c.name === countryId || c.id === parseInt(countryId)
          );
          if (country) {
            const statesList = await GetState(country.id);
            // Load cities from all states
            const allCities = [];
            for (const state of statesList) {
              try {
                const cityList = await GetCity(country.id, state.id);
                if (cityList && cityList.length > 0) {
                  // Add state info to each city for later lookup
                  const citiesWithState = cityList.map(city => ({
                    ...city,
                    _stateId: state.id,
                    _stateName: state.name,
                    _countryId: country.id,
                    _countryName: country.name
                  }));
                  allCities.push(...citiesWithState);
                }
              } catch (err) {
                console.error(`Error loading cities for state ${state.name}:`, err);
              }
            }
            setCities(allCities);
          } else {
            setCities([]);
          }
        } else {
          // Mode 3: Load all cities (if no country selected)
          // Load cities from default country (India) for better performance
          try {
            const countriesList = await GetCountries();
            const defaultCountry = countriesList.find(c => c.name === "India") || countriesList[0];
            if (defaultCountry) {
              const statesList = await GetState(defaultCountry.id);
              const allCities = [];
              // Load cities from all states (user can search, so loading all is fine)
              for (const state of statesList) {
                try {
                  const cityList = await GetCity(defaultCountry.id, state.id);
                  if (cityList && cityList.length > 0) {
                    // Add state info to each city for later lookup
                    const citiesWithState = cityList.map(city => ({
                      ...city,
                      _stateId: state.id,
                      _stateName: state.name,
                      _countryId: defaultCountry.id,
                      _countryName: defaultCountry.name
                    }));
                    allCities.push(...citiesWithState);
                  }
                } catch (err) {
                  // Continue loading from other states
                  console.error(`Error loading cities for state ${state.name}:`, err);
                }
              }
              setCities(allCities);
            } else {
              // Fallback: use GetAllCities (might be slow)
              const allCities = await GetAllCities();
              setCities(allCities || []);
            }
          } catch (err) {
            console.error("Error in Mode 3 city loading:", err);
            setCities([]);
          }
        }
      } catch (error) {
        console.error("Error loading cities:", error);
        setCities([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadCities();
  }, [countryId, stateId]);

  // Handle city selection and auto-detect state/country and pincode
  const handleCityChange = async (e) => {
    const selectedCityName = e.target.value;
    
    // Call the original onChange
    onChange(e);
    
    // If we have a callback and city was selected, find its state, country, and pincode
    if (onCitySelect && selectedCityName) {
      try {
        const selectedCity = cities.find(c => c.name === selectedCityName);
        let foundCountry = null;
        let foundState = null;
        
        // Always try to find country and state from the selected city
        if (selectedCity) {
          // If city has state info attached (from Mode 2 or Mode 3)
          if (selectedCity._stateName && selectedCity._countryName) {
            foundCountry = selectedCity._countryName;
            foundState = selectedCity._stateName;
          }
        }
        
        // If not found from city metadata, search for it
        if (!foundState || !foundCountry) {
          // Use existing country/state if available, otherwise search
          if (countryId && typeof countryId === 'string' && stateId && typeof stateId === 'string') {
            foundCountry = countryId;
            foundState = stateId;
          } else {
            // Search for the city's state and country
            const countriesList = await GetCountries();
            // Start with India for faster lookup (most common case)
            const indiaFirst = countriesList.find(c => c.name === "India");
            const searchOrder = indiaFirst 
              ? [indiaFirst, ...countriesList.filter(c => c.name !== "India")]
              : countriesList;
            
            for (const country of searchOrder) {
              try {
                const statesList = await GetState(country.id);
                for (const state of statesList) {
                  try {
                    const cityList = await GetCity(country.id, state.id);
                    const foundCity = cityList.find(c => c.name === selectedCityName);
                    if (foundCity) {
                      foundCountry = country.name;
                      foundState = state.name;
                      break;
                    }
                  } catch (err) {
                    // Continue searching
                  }
                }
                if (foundCountry && foundState) break;
              } catch (err) {
                // Continue searching
              }
            }
          }
        }
        
        // Fetch pincode if we have city, state, and country
        if (foundCountry && foundState && selectedCityName) {
          const pincode = await fetchPincodeByCity(selectedCityName, foundState, foundCountry);
          onCitySelect({
            country: foundCountry,
            state: foundState,
            pincode: pincode || null
          });
        } else if (foundCountry && foundState) {
          // If no pincode found, still set country and state
          onCitySelect({
            country: foundCountry,
            state: foundState,
            pincode: null
          });
        }
      } catch (error) {
        console.error("Error finding city's state/country/pincode:", error);
      }
    }
  };

  return (
    <SearchableSelect
      label="City"
      name="city"
      options={cities}
      value={value}
      onChange={handleCityChange}
      error={error}
      placeholder={
        disabled 
          ? "Please select state first" 
          : allowAllCities 
            ? "Search city (e.g., Ahmedabad) - will auto-set Country, State & Pincode" 
            : "Search and select city..."
      }
      required={required}
      disabled={disabled || isLoading}
      className={className}
      {...props}
    />
  );
};

// Pincode Input Component (with validation and auto-fill)
export const PincodeInput = ({ 
  value, 
  onChange, 
  error, 
  required, 
  className = "", 
  disabled,
  city,
  state,
  country = "India",
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // Reset auto-filled flag when city changes
  useEffect(() => {
    setAutoFilled(false);
  }, [city]);

  // Auto-fill pincode when city changes
  useEffect(() => {
    const autoFillPincode = async () => {
      // Only auto-fill if:
      // 1. City is provided
      // 2. Pincode is not already set
      // 3. Not already auto-filled for this city
      // 4. Not disabled
      if (city && !value && !autoFilled && !disabled) {
        setIsLoading(true);
        try {
          const pincode = await fetchPincodeByCity(city, state, country);
          if (pincode) {
            onChange({
              target: {
                name: "pincode",
                value: pincode,
              },
            });
            setAutoFilled(true);
          }
        } catch (error) {
          console.error("Error auto-filling pincode:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Small delay to ensure city is fully set
    const timer = setTimeout(() => {
      autoFillPincode();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, state, country]); // Re-run when city/state changes

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Pincode
        {required && <span className="text-red-500 ml-1">*</span>}
        {isLoading && (
          <span className="ml-2 text-xs text-blue-600">(Auto-filling...)</span>
        )}
        {autoFilled && value && (
          <span className="ml-2 text-xs text-green-600">(Auto-filled)</span>
        )}
      </label>
      <input
        type="text"
        name="pincode"
        value={value || ""}
        onChange={(e) => {
          // Only allow numbers and max 6 digits
          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
          onChange({
            target: {
              name: "pincode",
              value: val,
            },
          });
          // Reset auto-filled flag if user manually changes
          if (autoFilled) {
            setAutoFilled(false);
          }
        }}
        placeholder={isLoading ? "Fetching pincode..." : "Enter 6-digit pincode"}
        disabled={disabled || isLoading}
        required={required}
        maxLength={6}
        className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
          error ? "border-red-500" : "border-gray-300"
        } ${disabled || isLoading ? "bg-gray-100 cursor-not-allowed" : ""}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {value && value.length === 6 && !error && (
        <p className="mt-1 text-xs text-green-600">✓ Valid pincode format</p>
      )}
    </div>
  );
};

