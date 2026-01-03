import React, { useState } from "react";
import { Country, State, City } from "react-country-state-city";

/**
 * Address Select Components - Wrapper for react-country-state-city
 * Provides searchable dropdowns for Country, State, and City
 */

export const CountrySelect = ({ value, onChange, error, required, className = "", ...props }) => {
  const [selectedCountry, setSelectedCountry] = useState(value || "");

  const handleChange = (e) => {
    const countryId = e.target.value;
    setSelectedCountry(countryId);
    if (onChange) {
      const country = Country.getAllCountries().find((c) => c.id === parseInt(countryId));
      onChange({
        target: {
          value: country?.name || "",
          countryId: parseInt(countryId),
        },
      });
    }
  };

  return (
    <div>
      <select
        value={selectedCountry}
        onChange={handleChange}
        className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
        {...props}
      >
        <option value="">Select Country</option>
        {Country.getAllCountries().map((country) => (
          <option key={country.id} value={country.id}>
            {country.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export const StateSelect = ({ countryId, value, onChange, error, required, className = "", disabled, ...props }) => {
  const [selectedState, setSelectedState] = useState(value || "");

  const states = countryId ? State.getStatesOfCountry(countryId) : [];

  const handleChange = (e) => {
    const stateId = e.target.value;
    setSelectedState(stateId);
    if (onChange) {
      const state = states.find((s) => s.id === parseInt(stateId));
      onChange({
        target: {
          value: state?.name || "",
          stateId: parseInt(stateId),
        },
      });
    }
  };

  return (
    <div>
      <select
        value={selectedState}
        onChange={handleChange}
        disabled={disabled || !countryId}
        className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
          error ? "border-red-500" : "border-gray-300"
        } ${disabled || !countryId ? "bg-gray-100 cursor-not-allowed" : ""} ${className}`}
        {...props}
      >
        <option value="">Select State</option>
        {states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export const CitySelect = ({ countryId, stateId, value, onChange, error, required, className = "", disabled, ...props }) => {
  const [selectedCity, setSelectedCity] = useState(value || "");

  const cities = countryId && stateId ? City.getCitiesOfState(countryId, stateId) : [];

  const handleChange = (e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    if (onChange) {
      const city = cities.find((c) => c.id === parseInt(cityId));
      onChange({
        target: {
          value: city?.name || "",
          cityId: parseInt(cityId),
        },
      });
    }
  };

  return (
    <div>
      <select
        value={selectedCity}
        onChange={handleChange}
        disabled={disabled || !stateId}
        className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
          error ? "border-red-500" : "border-gray-300"
        } ${disabled || !stateId ? "bg-gray-100 cursor-not-allowed" : ""} ${className}`}
        {...props}
      >
        <option value="">Select City</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
};

