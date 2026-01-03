import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { completeProfileSchema } from "../../utils/validation";
import { useEnums } from "../../hooks/useEnums";
import { getLocationByCity, searchCities } from "../../api/locationApi";
import { completeProfile, clearError } from "./authSlice";
import { getMyProfile } from "../users/userSlice";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import { toast } from "react-toastify";
import { Search } from "lucide-react";

const CompleteProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, user } = useSelector((state) => state.auth);
  
  // Location auto-fill state
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [isCitySelected, setIsCitySelected] = useState(false);
  const cityInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchAbortControllerRef = useRef(null);
  const locationAbortControllerRef = useRef(null);
  const lastSearchedCityRef = useRef("");
  const lastLoadedCityRef = useRef("");

  // Get dynamic enums
  const SAMAJ_TYPES = useEnums("SAMAJ_TYPES");
  const OCCUPATION_TYPES = useEnums("OCCUPATION_TYPES");
  const MARITAL_STATUS = useEnums("MARITAL_STATUS");
  const BLOOD_GROUPS = useEnums("BLOOD_GROUPS");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    reset,
  } = useForm({
    resolver: yupResolver(completeProfileSchema),
    mode: "onChange",
    defaultValues: {
      address: {
        country: "India",
      },
    },
  });

  const city = watch("address.city");
  const occupationType = watch("occupationType");

  // Load location data function (defined early so it can be used in useEffect)
  const loadLocationData = async (cityName, state, countryCode = "IN") => {
    if (!cityName || cityName.trim().length < 3) return;
    
    const cityKey = `${cityName.trim()}_${state || ""}_${countryCode}`;
    
    // Don't load if same location is already loaded
    if (cityKey === lastLoadedCityRef.current && selectedLocation) {
      return;
    }
    
    // Cancel previous location request if exists
    if (locationAbortControllerRef.current) {
      locationAbortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    locationAbortControllerRef.current = abortController;
    
    setIsLoadingLocation(true);
    try {
      const response = await getLocationByCity(cityName.trim(), state, countryCode);
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      if (response && response.success && response.data) {
        const location = response.data;
        setSelectedLocation(location);
        setValue("address.state", location.state);
        setValue("address.country", location.country);
        if (location.pincode) {
          setValue("address.pincode", location.pincode);
        } else if (location.pincodes && location.pincodes.length > 0) {
          setValue("address.pincode", location.pincodes[0]);
        }
        trigger("address.state");
        trigger("address.country");
        trigger("address.pincode");
        lastLoadedCityRef.current = cityKey;
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      console.log("Location not found for city:", cityName);
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoadingLocation(false);
      }
    }
  };

  // Fetch user profile data and populate form
  useEffect(() => {
    const fetchUserData = async () => {
      if (user && user.status === "approved" && !user.profileCompleted) {
        try {
          // Fetch full user profile from backend
          const userData = await dispatch(getMyProfile()).unwrap();
          
          // Populate form with existing data if available
          if (userData) {
            const formData = {
              middleName: userData.middleName || "",
              gender: userData.gender || "",
              bloodGroup: userData.bloodGroup || "",
              maritalStatus: userData.maritalStatus || "",
              samaj: userData.samaj || "",
              address: {
                line1: userData.address?.line1 || "",
                line2: userData.address?.line2 || "",
                city: userData.address?.city || "",
                state: userData.address?.state || "",
                country: userData.address?.country || "India",
                pincode: userData.address?.pincode || "",
              },
              occupationType: userData.occupationType || "",
              occupationTitle: userData.occupationTitle || "",
              companyOrBusinessName: userData.companyOrBusinessName || "",
              position: userData.position || "",
              qualification: userData.qualification || "",
            };
            
            // Reset form with existing data
            reset(formData);
            
            // If city exists, load location data
            if (userData.address?.city) {
              await loadLocationData(
                userData.address.city,
                userData.address.state,
                userData.address.country === "India" ? "IN" : userData.address.country
              );
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Continue with empty form if fetch fails
        }
      }
    };
    
    fetchUserData();
  }, [user, dispatch, reset, setValue, trigger]);

  // Redirect if already completed or not approved
  useEffect(() => {
    if (user) {
      if (user.status !== "approved") {
        toast.error("Your account must be approved before completing profile");
        navigate("/login");
        return;
      }
      if (user.profileCompleted) {
        navigate("/profile");
        return;
      }
    }
  }, [user, navigate]);

  // City search with debounce - only when user is typing (not when selected)
  useEffect(() => {
    // Cancel previous search if exists
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    
    // Don't search if city was just selected
    if (isCitySelected) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }
    
    const cityTrimmed = city?.trim() || "";
    
    // Don't search if same city is already searched
    if (cityTrimmed === lastSearchedCityRef.current && cityTrimmed.length >= 2) {
      return;
    }
    
    if (cityTrimmed.length >= 2) {
      const timer = setTimeout(async () => {
        // Double check that city wasn't selected during the delay
        if (isCitySelected || city?.trim() !== cityTrimmed) {
          return;
        }
        
        // Create new AbortController for this search
        const abortController = new AbortController();
        searchAbortControllerRef.current = abortController;
        
        setIsSearchingCities(true);
        try {
          const response = await searchCities(cityTrimmed, "IN", 20);
          
          // Check if request was aborted
          if (abortController.signal.aborted) {
            return;
          }
          
          if (response.success && Array.isArray(response.data) && response.data.length > 0) {
            // Only update if city wasn't selected during the API call
            if (!isCitySelected && city?.trim() === cityTrimmed) {
              setCitySuggestions(response.data);
              setShowCitySuggestions(true);
              lastSearchedCityRef.current = cityTrimmed;
            }
          } else {
            setCitySuggestions([]);
            setShowCitySuggestions(false);
          }
        } catch (error) {
          // Ignore abort errors
          if (error.name === 'AbortError' || abortController.signal.aborted) {
            return;
          }
          console.error("Error searching cities:", error);
          setCitySuggestions([]);
          setShowCitySuggestions(false);
        } finally {
          if (!abortController.signal.aborted) {
            setIsSearchingCities(false);
          }
        }
      }, 300);
      return () => {
        clearTimeout(timer);
        if (searchAbortControllerRef.current) {
          searchAbortControllerRef.current.abort();
        }
      };
    } else {
      // Clear suggestions if city is too short
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      lastSearchedCityRef.current = "";
    }
  }, [city, isCitySelected]);

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

  // Handle city selection
  const handleCitySelect = async (suggestion) => {
    // Immediately close dropdown and clear ALL state
    setIsCitySelected(true);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
    setIsSearchingCities(false);
    
    // Set city value - this will trigger onChange, but isCitySelected will prevent search
    setValue("address.city", suggestion.city, { shouldValidate: true });
    
    // Clear previous location data
    setSelectedLocation(null);
    setValue("address.state", "", { shouldValidate: false });
    setValue("address.pincode", "", { shouldValidate: false });
    
    // Load location data
    await loadLocationData(suggestion.city, suggestion.state, "IN");
    
    // Focus on pincode field after a short delay
    setTimeout(() => {
      const pincodeInput = document.querySelector('input[name="address.pincode"], select[name="address.pincode"]');
      if (pincodeInput) {
        pincodeInput.focus();
      }
    }, 300);
    
    // Reset flag after delay to allow future searches (only if user hasn't typed again)
    setTimeout(() => {
      // Only reset if the city value hasn't changed (user hasn't typed)
      const currentCity = document.querySelector('input[name="address.city"]')?.value;
      if (currentCity === suggestion.city) {
        setIsCitySelected(false);
      }
    }, 1500);
  };


  // Clear occupation fields when type changes
  useEffect(() => {
    if (occupationType) {
      if (occupationType === "homemaker") {
        setValue("occupationTitle", "", { shouldValidate: false });
        setValue("qualification", "", { shouldValidate: false });
        setValue("companyOrBusinessName", "", { shouldValidate: false });
        setValue("position", "", { shouldValidate: false });
        trigger(["occupationTitle", "qualification", "companyOrBusinessName", "position"]);
      } else if (occupationType !== "job" && occupationType !== "business") {
        setValue("companyOrBusinessName", "", { shouldValidate: false });
        setValue("position", "", { shouldValidate: false });
        trigger(["companyOrBusinessName", "position"]);
      } else if (occupationType !== "job") {
        setValue("position", "", { shouldValidate: false });
        trigger("position");
      }
    }
  }, [occupationType, setValue, trigger]);

  const onSubmit = async (data) => {
    try {
      dispatch(completeProfile(data));
    } catch (error) {
      toast.error("Failed to complete profile");
    }
  };

  // Handle success
  useEffect(() => {
    if (user?.profileCompleted) {
      toast.success("Profile completed successfully");
      setTimeout(() => {
        navigate("/profile", { replace: true });
      }, 1500);
    }
  }, [user?.profileCompleted, navigate]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <Card>
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-900">
            Complete Your Profile
          </h1>

          <p className="text-center text-gray-600 mb-6">
            Please complete your profile to access all features. All fields are required.
          </p>

          {error && (
            <ErrorAlert
              message={error}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Personal Information
              </h2>

              <Input
                label="Middle Name"
                name="middleName"
                register={register}
                error={errors.middleName?.message}
                placeholder="Enter middle name (optional)"
              />

              <Select
                label="Gender"
                name="gender"
                register={register}
                error={errors.gender?.message}
                required
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />

              <Select
                label="Blood Group"
                name="bloodGroup"
                register={register}
                error={errors.bloodGroup?.message}
                required
                options={BLOOD_GROUPS?.map(bg => ({ value: bg, label: bg })) || []}
              />

              <Select
                label="Marital Status"
                name="maritalStatus"
                register={register}
                error={errors.maritalStatus?.message}
                required
                options={MARITAL_STATUS?.map(ms => ({ value: ms, label: ms })) || []}
              />

              <Select
                label="Samaj/Community"
                name="samaj"
                register={register}
                error={errors.samaj?.message}
                required
                options={SAMAJ_TYPES?.map(s => ({ value: s, label: s })) || []}
              />
            </div>

            {/* Address */}
            <div className="space-y-4 border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Address
              </h2>

              <Input
                label="Address Line 1"
                name="address.line1"
                register={register}
                error={errors.address?.line1?.message}
                required
                placeholder="House/Flat No., Building Name"
              />

              <Input
                label="Address Line 2 (Optional)"
                name="address.line2"
                register={register}
                error={errors.address?.line2?.message}
                placeholder="Street, Area, Landmark"
              />

              {/* City */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...register("address.city", { required: "City is required" })}
                    value={city || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Reset selection flag and clear suggestions when user types
                      setIsCitySelected(false);
                      setShowCitySuggestions(false);
                      setCitySuggestions([]);
                      setSelectedLocation(null);
                      setValue("address.city", value, { shouldValidate: true });
                      if (value !== city) {
                        setValue("address.state", "", { shouldValidate: false });
                        setValue("address.pincode", "", { shouldValidate: false });
                      }
                    }}
                    onFocus={() => {
                      // Only show suggestions if city is not already selected and we have suggestions
                      if (!isCitySelected && city && city.trim().length >= 2 && citySuggestions.length > 0) {
                        setShowCitySuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowCitySuggestions(false);
                        // Only load location if city was typed (not selected) and not already loaded
                        if (city && city.trim().length >= 3 && !isCitySelected) {
                          const cityKey = `${city.trim()}_null_IN`;
                          if (cityKey !== lastLoadedCityRef.current) {
                            loadLocationData(city.trim(), null, "IN");
                          }
                        }
                      }, 200);
                    }}
                    placeholder="Type city name (e.g., Ahmedabad)"
                    className={`w-full px-4 py-2 pr-10 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                      errors.address?.city ? "border-red-500" : "border-gray-300"
                    }`}
                    ref={cityInputRef}
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
                  <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                )}

                {/* City Suggestions - Only show if not already selected */}
                {showCitySuggestions && citySuggestions.length > 0 && !isCitySelected && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    style={{ top: '100%', left: 0 }}
                    onMouseDown={(e) => {
                      // Prevent blur when clicking inside dropdown
                      e.preventDefault();
                    }}
                  >
                    {citySuggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.city}-${suggestion.state}-${index}`}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCitySelect(suggestion);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCitySelect(suggestion);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900">{suggestion.city}</div>
                        <div className="text-sm text-gray-500">
                          {suggestion.state}, {suggestion.country}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* State, Country, Pincode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="State"
                  name="address.state"
                  register={register}
                  error={errors.address?.state?.message}
                  required
                  readOnly
                  className="bg-gray-50"
                />

                <Input
                  label="Country"
                  name="address.country"
                  register={register}
                  error={errors.address?.country?.message}
                  required
                  readOnly
                  defaultValue="India"
                  className="bg-gray-50"
                />

                {selectedLocation?.pincodes && selectedLocation.pincodes.length > 1 ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("address.pincode", { required: "Pincode is required" })}
                      className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                        errors.address?.pincode ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select pincode</option>
                      {selectedLocation.pincodes.map((pin) => (
                        <option key={pin} value={pin}>
                          {pin}
                        </option>
                      ))}
                    </select>
                    {errors.address?.pincode && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.pincode.message}</p>
                    )}
                  </div>
                ) : (
                  <Input
                    label="Pincode"
                    name="address.pincode"
                    register={register}
                    error={errors.address?.pincode?.message}
                    required
                    placeholder="6-digit pincode"
                    readOnly={selectedLocation?.pincode}
                    className={selectedLocation?.pincode ? "bg-gray-50" : ""}
                  />
                )}
              </div>
            </div>

            {/* Occupation */}
            <div className="space-y-4 border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Occupation
              </h2>

              <Select
                label="Occupation Type"
                name="occupationType"
                register={register}
                error={errors.occupationType?.message}
                required
                options={OCCUPATION_TYPES?.map(ot => ({ value: ot, label: ot })) || []}
              />

              {occupationType && occupationType !== "homemaker" && (
                <>
                  <Input
                    label="Occupation Title"
                    name="occupationTitle"
                    register={register}
                    error={errors.occupationTitle?.message}
                    required
                    placeholder="e.g., Software Engineer, Doctor"
                  />

                  <Input
                    label="Qualification"
                    name="qualification"
                    register={register}
                    error={errors.qualification?.message}
                    required
                    placeholder="e.g., B.Tech, MBBS"
                  />
                </>
              )}

              {(occupationType === "job" || occupationType === "business") && (
                <>
                  <Input
                    label="Company/Business Name"
                    name="companyOrBusinessName"
                    register={register}
                    error={errors.companyOrBusinessName?.message}
                    required
                    placeholder="Name of company or business"
                  />

                  {occupationType === "job" && (
                    <Input
                      label="Position"
                      name="position"
                      register={register}
                      error={errors.position?.message}
                      required
                      placeholder="Your position/designation"
                    />
                  )}
                </>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isLoading}
              loading={isLoading}
            >
              {isLoading ? "Completing Profile..." : "Complete Profile"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;
