import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { register, clearError, clearMessage, logout } from "./authSlice";
import { registerSchema } from "../../utils/validation";
import { compressImage } from "../../utils/imageUtils";
import { useEnums } from "../../hooks/useEnums";
import { getLocationByCity, searchCities } from "../../api/locationApi";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import { toast } from "react-toastify";
import { Search } from "lucide-react";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, message, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [registrationCredentials, setRegistrationCredentials] = useState(null);
  
  // Location auto-fill state
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const cityInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // Get dynamic enums
  const SAMAJ_TYPES = useEnums("SAMAJ_TYPES");
  const OCCUPATION_TYPES = useEnums("OCCUPATION_TYPES");
  const MARITAL_STATUS = useEnums("MARITAL_STATUS");

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: "onChange", // Validate on change for real-time feedback
    defaultValues: {
      address: {
        country: "India",
      },
    },
  });

  const profileImage = watch("profileImage");
  const dateOfBirth = watch("dateOfBirth");
  const city = watch("address.city");
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Auto-calculate age from date of birth
  useEffect(() => {
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age >= 0 && age <= 120) {
        setValue("age", age);
      }
    }
  }, [dateOfBirth, setValue]);

  // Re-validate confirmPassword when password changes
  useEffect(() => {
    if (confirmPassword) {
      trigger("confirmPassword");
    }
  }, [password, trigger, confirmPassword]);

  useEffect(() => {
    if (profileImage && profileImage[0]) {
      const file = profileImage[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setProfileImagePreview(null);
    }
  }, [profileImage]);

  // Handle registration success - redirect to login with credentials
  useEffect(() => {
    // Check if registration was just completed (user exists but we have credentials to pass)
    const isRegistrationSuccess = isAuthenticated && user && registrationCredentials;
    
    if (isRegistrationSuccess) {
      toast.success("Registration successful! Please login.");
      dispatch(clearMessage());
      // Logout user to allow them to login fresh
      dispatch(logout());
      setTimeout(() => {
        navigate("/login", {
          state: {
            email: registrationCredentials.email,
            password: registrationCredentials.password,
          },
        });
        setRegistrationCredentials(null); // Clear after navigation
      }, 1500);
    } else if (message && message.includes("successful") && !registrationCredentials) {
      // If message exists but no credentials, just redirect without pre-fill
      toast.success(message || "Registration successful! Please login.");
      dispatch(clearMessage());
      if (isAuthenticated) {
        dispatch(logout());
      }
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    }
  }, [message, isAuthenticated, user, navigate, dispatch, registrationCredentials, logout]);

  // Handle registration errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);


  // City search autocomplete with debounce
  useEffect(() => {
    if (!city || city.trim().length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsSearchingCities(true);
      try {
        const response = await searchCities(city.trim(), "IN", 20);
        if (response.success && Array.isArray(response.data)) {
          setCitySuggestions(response.data);
          setShowCitySuggestions(true);
        } else {
          setCitySuggestions([]);
          setShowCitySuggestions(false);
        }
      } catch (error) {
        console.error("Error searching cities:", error);
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      } finally {
        setIsSearchingCities(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [city]);

  // Auto-fill location when city is selected or entered (debounced)
  useEffect(() => {
    if (!city || city.trim().length < 3) {
      return;
    }

    // Debounce the location lookup
    const timer = setTimeout(async () => {
      await loadLocationData(city.trim(), null, "IN");
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target)
      ) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Handle city selection from autocomplete
  const handleCitySelect = async (selectedCity) => {
    // Set city first
    setValue("address.city", selectedCity.city, { shouldValidate: true });
    setShowCitySuggestions(false);
    
    // Immediately load location data and auto-fill pincode
    await loadLocationData(selectedCity.city, selectedCity.state, "IN");
  };

  // Load location data for a city and auto-fill pincode
  const loadLocationData = async (cityName, state, countryCode = "IN") => {
    if (!cityName || cityName.trim().length < 2) return;
    
    setIsLoadingLocation(true);
    try {
      const response = await getLocationByCity(cityName.trim(), state, countryCode);

      if (response && response.success && response.data) {
        const location = response.data;
        setSelectedLocation(location);

        // Always auto-fill state and country (overwrite if needed)
        if (location.state) {
          setValue("address.state", location.state);
        }
        if (location.country) {
          setValue("address.country", location.country);
        }

        // Always auto-fill pincode when city is selected
        if (location.pincode) {
          setValue("address.pincode", location.pincode);
        } else if (location.pincodes && location.pincodes.length > 0) {
          // If multiple pincodes, use the first one (primary)
          setValue("address.pincode", location.pincodes[0]);
        }

        // Trigger validation
        trigger("address.state");
        trigger("address.country");
        trigger("address.pincode");
      } else {
        // City not found in library - clear auto-filled fields
        setSelectedLocation(null);
        setValue("address.state", "");
        setValue("address.pincode", "");
      }
    } catch (error) {
      // Silently fail - user can enter manually
      console.log("Location not found for city:", cityName);
      setSelectedLocation(null);
    } finally {
      setIsLoadingLocation(false);
    }
  };


  const onSubmit = async (data) => {
    try {
      // Format mobile number
      const mobileNumber = data.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
      
      const formData = {
        ...data,
        mobileNumber: `+91${mobileNumber}`,
        email: data.email.toLowerCase(),
        password: data.password,
        confirmPassword: data.confirmPassword, // Include for backend validation
      };

      // Handle profile image if uploaded - compress before sending
      if (data.profileImage && data.profileImage[0]) {
        const file = data.profileImage[0];
        try {
          // Compress image to reduce size (max 800x800, quality 0.8)
          const compressedImage = await compressImage(file, 800, 800, 0.8);
          formData.profileImage = compressedImage;
        } catch (error) {
          toast.error(error.message || "Failed to process image");
          return;
        }
      }

      // Store credentials for auto-fill after successful registration
      setRegistrationCredentials({
        email: formData.email,
        password: formData.password,
      });

      dispatch(register(formData));
    } catch (error) {
      toast.error("Failed to submit registration");
      setRegistrationCredentials(null); // Clear on error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <Card>
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-900">
            Register to Family Community
          </h1>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information - ALL FIELDS REQUIRED */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 border-b pb-2">
                Personal Information
              </h2>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <Input
                  label="First Name"
                  name="firstName"
                  register={registerField}
                  error={errors.firstName?.message}
                  placeholder="Enter first name"
                  required
                />
                <Input
                  label="Middle Name"
                  name="middleName"
                  register={registerField}
                  error={errors.middleName?.message}
                  placeholder="Enter middle name"
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  register={registerField}
                  error={errors.lastName?.message}
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  register={registerField}
                  error={errors.email?.message}
                  placeholder="Enter your email"
                  required
                />
                <Input
                  label="Mobile Number"
                  type="tel"
                  name="mobileNumber"
                  register={registerField}
                  error={errors.mobileNumber?.message}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="Date of Birth"
                  type="date"
                  name="dateOfBirth"
                  register={registerField}
                  error={errors.dateOfBirth?.message}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
                <Input
                  label="Age"
                  type="number"
                  name="age"
                  register={registerField}
                  error={errors.age?.message}
                  min="0"
                  max="120"
                  disabled={!!dateOfBirth}
                  title={dateOfBirth ? "Age is automatically calculated from date of birth" : ""}
                  required
                />
              </div>

              {/* Blood Group */}
              <Select
                label="Blood Group"
                name="bloodGroup"
                register={registerField}
                error={errors.bloodGroup?.message}
                placeholder="Select blood group"
                required
                options={[
                  { value: "A+", label: "A+" },
                  { value: "A-", label: "A-" },
                  { value: "B+", label: "B+" },
                  { value: "B-", label: "B-" },
                  { value: "AB+", label: "AB+" },
                  { value: "AB-", label: "AB-" },
                  { value: "O+", label: "O+" },
                  { value: "O-", label: "O-" },
                ]}
                className="mb-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Helpful for medical emergencies and blood donation drives
              </p>
            </div>

            {/* Address with Location Auto-Fill */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 border-b pb-2 mt-6">
                Address
              </h2>

              <Input
                label="Address Line 1"
                name="address.line1"
                register={registerField}
                error={errors.address?.line1?.message}
                required
              />
              <Input
                label="Address Line 2"
                name="address.line2"
                register={registerField}
                error={errors.address?.line2?.message}
                required
              />

              {/* City - Searchable Autocomplete Input */}
              <div className="relative" ref={cityInputRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...registerField("address.city", {
                      required: "City is required",
                    })}
                    value={city || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setValue("address.city", value, { shouldValidate: true });
                      if (value !== city) {
                        setSelectedLocation(null);
                        // Clear auto-filled fields when city changes
                        if (selectedLocation) {
                          setValue("address.state", "");
                          setValue("address.pincode", "");
                        }
                      }
                    }}
                    onFocus={() => {
                      if (citySuggestions.length > 0) {
                        setShowCitySuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => {
                        setShowCitySuggestions(false);
                        // Trigger location lookup on blur if city is entered
                        if (city && city.trim().length >= 3) {
                          loadLocationData(city.trim(), null, "IN");
                        }
                      }, 200);
                    }}
                    placeholder="Type city name (e.g., Ahmedabad)"
                    className={`w-full px-4 py-2 pr-10 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                      errors.address?.city ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {isSearchingCities || isLoadingLocation ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  )}
                </div>
                {errors.address?.city && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.address.city.message}
                  </p>
                )}
                {isLoadingLocation && (
                  <p className="mt-1 text-sm text-blue-600">
                    Looking up location...
                  </p>
                )}
                {selectedLocation && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Location found: {selectedLocation.state}, {selectedLocation.country} - Pincode auto-filled
                  </p>
                )}

                {/* City Suggestions Dropdown */}
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {citySuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleCitySelect(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {suggestion.city}
                        </div>
                        <div className="text-sm text-gray-500">
                          {suggestion.state}, {suggestion.country}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* State, Country, Pincode - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* State - Auto-filled, Read-only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerField("address.state")}
                    disabled
                    readOnly
                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed min-h-[44px]"
                  />
                  {errors.address?.state && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.address.state.message}
                    </p>
                  )}
                  {!selectedLocation && (
                    <p className="mt-1 text-xs text-gray-500">
                      State will be auto-filled when you select a city
                    </p>
                  )}
                </div>

                {/* Country - Auto-filled, Read-only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerField("address.country")}
                    disabled
                    readOnly
                    defaultValue="India"
                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed min-h-[44px]"
                  />
                  {errors.address?.country && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.address.country.message}
                    </p>
                  )}
                </div>

                {/* Pincode - Auto-filled according to city selection */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                {selectedLocation && 
                selectedLocation.pincodes && 
                selectedLocation.pincodes.length > 1 ? (
                  // Multiple pincodes - show dropdown
                  <select
                    {...registerField("address.pincode", {
                      required: "Pincode is required",
                    })}
                    className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                      errors.address?.pincode
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select pincode</option>
                    {selectedLocation.pincodes.map((pin) => (
                      <option key={pin} value={pin}>
                        {pin}
                      </option>
                    ))}
                  </select>
                ) : (
                  // Single pincode or no pincode - input field
                  <input
                    type="text"
                    {...registerField("address.pincode", {
                      required: "Pincode is required",
                      pattern: {
                        value: /^\d{6}$/,
                        message: "Pincode must be a 6-digit number",
                      },
                    })}
                    placeholder="6-digit pincode"
                    readOnly={selectedLocation && selectedLocation.pincode}
                    disabled={selectedLocation && selectedLocation.pincode}
                    className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                      errors.address?.pincode
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    } ${
                      selectedLocation && selectedLocation.pincode
                        ? "bg-gray-50 text-gray-600 cursor-not-allowed"
                        : ""
                    }`}
                  />
                )}
                {errors.address?.pincode && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.address.pincode.message}
                  </p>
                )}
                {!selectedLocation && (
                  <p className="mt-1 text-xs text-gray-500">
                    Pincode will be auto-filled when you select a city
                  </p>
                )}
                {selectedLocation && selectedLocation.pincode && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Pincode auto-filled for {selectedLocation.city}
                  </p>
                )}
                {selectedLocation && 
                 selectedLocation.pincodes && 
                 selectedLocation.pincodes.length > 1 && (
                  <p className="mt-1 text-xs text-blue-600">
                    Multiple pincodes available - please select one
                  </p>
                )}
                </div>
              </div>
            </div>

            {/* Occupation */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 border-b pb-2 mt-6">
                Occupation
              </h2>

              <Select
                label="Occupation Type"
                name="occupationType"
                register={registerField}
                error={errors.occupationType?.message}
                required
                placeholder="Select occupation type"
                options={OCCUPATION_TYPES.map((type) => ({
                  value: type,
                  label: type.charAt(0).toUpperCase() + type.slice(1),
                }))}
              />

              <Input
                label="Occupation Title"
                name="occupationTitle"
                register={registerField}
                error={errors.occupationTitle?.message}
                placeholder="e.g., Software Engineer"
                required
              />

              <Input
                label="Company/Business Name"
                name="companyOrBusinessName"
                register={registerField}
                error={errors.companyOrBusinessName?.message}
                placeholder="Enter company or business name"
                required
              />

              <Input
                label="Position"
                name="position"
                register={registerField}
                error={errors.position?.message}
                placeholder="Enter your position"
                required
              />

              <Input
                label="Qualification"
                name="qualification"
                register={registerField}
                error={errors.qualification?.message}
                placeholder="e.g., B.Com, MCA"
                required
              />
            </div>

            {/* Other Information */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 border-b pb-2 mt-6">
                Other Information
              </h2>

              <Select
                label="Marital Status"
                name="maritalStatus"
                register={registerField}
                error={errors.maritalStatus?.message}
                required
                placeholder="Select marital status"
                options={MARITAL_STATUS.map((status) => ({
                  value: status,
                  label: status.charAt(0).toUpperCase() + status.slice(1),
                }))}
              />

              <Select
                label="Samaj/Community"
                name="samaj"
                register={registerField}
                error={errors.samaj?.message}
                required
                placeholder="Select samaj/community"
                options={SAMAJ_TYPES.map((samaj) => ({
                  value: samaj,
                  label: samaj,
                }))}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  {...registerField("profileImage")}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {profileImagePreview && (
                  <div className="mt-2">
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 border-b pb-2 mt-6">
                Password
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    register={registerField}
                    error={errors.password?.message}
                    placeholder="Minimum 8 characters"
                    required
                    showPasswordToggle={true}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with letters and numbers
                  </p>
                </div>

                <div>
                  <Input
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    register={registerField}
                    error={errors.confirmPassword?.message}
                    placeholder="Re-enter your password"
                    required
                    showPasswordToggle={true}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Passwords must match
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              <Button
                type="submit"
                variant="primary"
                fullWidth={true}
                isLoading={isLoading}
                disabled={isLoading || !isValid}
              >
                Register
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-800">
                Login here
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
