import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

/**
 * Searchable Select Component
 * Supports typing to search and selecting from dropdown
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
        typeof option === "string"
          ? option.toLowerCase().includes(searchTerm.toLowerCase())
          : option.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.value?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const option = options.find(
      (opt) => (typeof opt === "string" ? opt : opt.value) === value
    );
    return typeof option === "string" ? option : option?.label || value;
  };

  const handleSelect = (selectedValue) => {
    onChange({
      target: {
        name,
        value: typeof selectedValue === "string" ? selectedValue : selectedValue.value,
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
            // Delay to allow click on option
            setTimeout(() => {
              if (onBlur) onBlur(e);
            }, 200);
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] pr-10 ${
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
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((option, index) => {
                const optionValue = typeof option === "string" ? option : option.value;
                const optionLabel = typeof option === "string" ? option : option.label || option.value;
                const isSelected = value === optionValue;

                return (
                  <li
                    key={index}
                    onClick={() => handleSelect(option)}
                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                      isSelected ? "bg-blue-100 font-medium" : ""
                    }`}
                  >
                    {optionLabel}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500 text-center">
              No options found
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default SearchableSelect;

