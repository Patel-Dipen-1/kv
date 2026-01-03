import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { X, Eye, EyeOff } from "lucide-react";
import { addFamilyMember, updateFamilyMember, clearError } from "./familySlice";
import { createFamilyMemberRequest } from "./familyRequestSlice";
import { useEnums } from "../../hooks/useEnums";
import { compressImage } from "../../utils/imageUtils";
import { familyMemberSchema } from "../../utils/familyMemberValidation";
import { getLocationByCity, searchCities } from "../../api/locationApi";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import ErrorAlert from "../../components/common/ErrorAlert";
import { toast } from "react-toastify";
import { Search } from "lucide-react";

const AddFamilyMemberForm = ({ onClose, onSuccess, isRequestMode = false, editData = null }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.family);
  const { isLoading: isRequestLoading } = useSelector((state) => state.familyRequest || { isLoading: false });
  const { user } = useSelector((state) => state.auth); // Get logged-in user
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  
  // Location auto-fill state
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const searchAbortControllerRef = useRef(null);
  const locationAbortControllerRef = useRef(null);
  const lastSearchedCityRef = useRef("");
  const lastLoadedCityRef = useRef("");
  
  const isEditMode = !!editData;
  
  // Check if user is primary account
  const isPrimaryAccount = user?.isPrimaryAccount !== false; // Default to true if not set
  
  // Get dynamic enums
  const RELATIONSHIP_TYPES = useEnums("RELATIONSHIP_TYPES");
  const MARITAL_STATUS = useEnums("MARITAL_STATUS");
  const OCCUPATION_TYPES = useEnums("OCCUPATION_TYPES");
  const SAMAJ_TYPES = useEnums("SAMAJ_TYPES");
  const BLOOD_GROUPS = useEnums("BLOOD_GROUPS");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
  } = useForm({
    resolver: yupResolver(familyMemberSchema),
    mode: "onChange", // Validate on change for real-time feedback
    defaultValues: {
      address: {
        country: "India",
      },
    },
  });

  const dateOfBirth = watch("dateOfBirth");
  const mobileNumber = watch("mobileNumber");
  const email = watch("email");
  const city = watch("address.city");
  const occupationType = watch("occupationType"); // Watch occupation type for conditional fields
  const createLoginAccount = watch("createLoginAccount");
  const useMobileAsPassword = watch("useMobileAsPassword");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      setValue("age", age);
    }
  }, [dateOfBirth, setValue]);

  // Clear occupation-related fields when occupation type changes
  useEffect(() => {
    if (occupationType) {
      // Clear fields that are not relevant to the new occupation type
      if (occupationType === "homemaker") {
        setValue("occupationTitle", "", { shouldValidate: false });
        setValue("qualification", "", { shouldValidate: false });
        setValue("companyOrBusinessName", "", { shouldValidate: false });
        setValue("position", "", { shouldValidate: false });
      } else if (occupationType !== "job" && occupationType !== "business") {
        setValue("companyOrBusinessName", "", { shouldValidate: false });
        setValue("position", "", { shouldValidate: false });
      } else if (occupationType !== "job") {
        setValue("position", "", { shouldValidate: false });
      }
      // Trigger validation after clearing to update form state
      setTimeout(() => {
        trigger();
      }, 100);
    }
  }, [occupationType, setValue, trigger]);

  // Set samaj from logged-in user (family head)
  useEffect(() => {
    if (user?.samaj) {
      setValue("samaj", user.samaj);
    }
  }, [user, setValue]);

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && editData) {
      // Format date for input (YYYY-MM-DD)
      const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        } catch (error) {
          return "";
        }
      };

      setValue("firstName", editData.firstName || "");
      setValue("middleName", editData.middleName || "");
      setValue("lastName", editData.lastName || "");
      setValue("dateOfBirth", formatDateForInput(editData.dateOfBirth));
      setValue("age", editData.age || "");
      setValue("mobileNumber", editData.mobileNumber?.replace("+91", "") || "");
      setValue("email", editData.email || "");
      setValue("maritalStatus", editData.maritalStatus || "");
      setValue("relationshipToUser", editData.relationshipToUser || "");
      setValue("occupationType", editData.occupationType || "");
      setValue("occupationTitle", editData.occupationTitle || "");
      setValue("companyOrBusinessName", editData.companyOrBusinessName || "");
      setValue("position", editData.position || "");
      setValue("qualification", editData.qualification || "");
      setValue("bloodGroup", editData.bloodGroup || "");
      setValue("samaj", editData.samaj || user?.samaj || "");
      
      // Set address fields
      if (editData.address) {
        setValue("address.line1", editData.address.line1 || "");
        setValue("address.line2", editData.address.line2 || "");
        setValue("address.city", editData.address.city || "");
        setValue("address.state", editData.address.state || "");
        setValue("address.country", editData.address.country || "India");
        setValue("address.pincode", editData.address.pincode || "");
      }
      
      if (editData.profileImage) {
        setProfileImagePreview(editData.profileImage);
      }
    }
  }, [isEditMode, editData, setValue]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        setProfileImagePreview(compressedImage);
        setValue("profileImage", compressedImage);
      } catch (error) {
        toast.error(error.message || "Failed to process image");
      }
    }
  };

  // Load location data when city is entered
  const loadLocationData = async (cityName, stateName, countryCode = "IN") => {
    if (!cityName || cityName.trim().length < 3) return;
    
    const cityKey = `${cityName.trim()}_${stateName || ""}_${countryCode}`;
    
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
      const response = await getLocationByCity(cityName, stateName, countryCode);
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      if (response.success && response.data) {
        const location = response.data;
        setSelectedLocation(location);
        
        if (location.state) {
          setValue("address.state", location.state);
        }
        if (location.country) {
          setValue("address.country", location.country);
        }
        if (location.pincode) {
          setValue("address.pincode", location.pincode);
        } else if (location.pincodes && location.pincodes.length > 0) {
          setValue("address.pincode", location.pincodes[0]);
        }
        
        trigger("address.state");
        trigger("address.country");
        trigger("address.pincode");
        lastLoadedCityRef.current = cityKey;
      } else {
        setSelectedLocation(null);
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      setSelectedLocation(null);
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoadingLocation(false);
      }
    }
  };

  // Search cities on input - only when user is typing (not when selected from dropdown)
  const [isCitySelected, setIsCitySelected] = useState(false);
  
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
        if (isCitySelected || !city || city.trim() !== cityTrimmed) {
          return;
        }
        
        // Create new AbortController for this search
        const abortController = new AbortController();
        searchAbortControllerRef.current = abortController;
        
        setIsSearchingCities(true);
        try {
          const response = await searchCities(cityTrimmed);
          
          // Check if request was aborted
          if (abortController.signal.aborted) {
            return;
          }
          
          if (response.success && response.data && response.data.length > 0) {
            // Only update if city wasn't selected during the API call
            if (!isCitySelected && city?.trim() === cityTrimmed) {
              setCitySuggestions(response.data.slice(0, 10));
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

  // REMOVED: Auto-load location useEffect - This was causing duplicate API calls
  // Location is now loaded only when:
  // 1. City is selected from dropdown (handleCitySelect)
  // 2. User blurs the city input field (onBlur)

  const onSubmit = async (data) => {
    console.log("Form submitted with data:", data);
    
    try {
      // Add samaj from logged-in user (family head)
      if (user?.samaj) {
        data.samaj = user.samaj;
      }

      // Format mobile number if provided
      if (data.mobileNumber) {
        const cleaned = data.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
        data.mobileNumber = `+91${cleaned}`;
      }

      // Format email if provided
      if (data.email) {
        data.email = data.email.toLowerCase();
      }

      // Handle password: if useMobileAsPassword is true, set password to mobile number
      if (data.createLoginAccount && data.useMobileAsPassword && data.mobileNumber) {
        // Remove +91 prefix if present and get clean mobile number
        const cleanMobile = data.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
        data.password = cleanMobile;
        data.confirmPassword = cleanMobile;
        // Remove password fields from validation since we're using mobile
        delete data.useMobileAsPassword; // Don't send this to backend
      } else if (data.createLoginAccount && !data.useMobileAsPassword) {
        // If not using mobile as password, password fields are required (handled by validation)
      }

      // Remove empty fields (but keep samaj and address fields)
      Object.keys(data).forEach((key) => {
        if (key !== "samaj" && key !== "address" && key !== "password" && key !== "confirmPassword" && (data[key] === "" || data[key] === null || data[key] === undefined)) {
          delete data[key];
        }
        // Handle nested address object - keep line1 required, line2 is optional
        if (key === "address" && data.address) {
          Object.keys(data.address).forEach((addrKey) => {
            // Keep line1 even if empty (will be validated), but remove empty line2
            if (addrKey === "line2" && (data.address[addrKey] === "" || data.address[addrKey] === null || data.address[addrKey] === undefined)) {
              delete data.address[addrKey];
            } else if (addrKey !== "line1" && (data.address[addrKey] === "" || data.address[addrKey] === null || data.address[addrKey] === undefined)) {
              delete data.address[addrKey];
            }
          });
        }
      });

      // Remove conditional fields that shouldn't be sent based on occupation type
      if (data.occupationType) {
        if (data.occupationType === "homemaker") {
          delete data.occupationTitle;
          delete data.qualification;
          delete data.companyOrBusinessName;
          delete data.position;
        } else if (data.occupationType !== "job" && data.occupationType !== "business") {
          delete data.companyOrBusinessName;
          delete data.position;
        } else if (data.occupationType !== "job") {
          delete data.position;
        }
      }

      console.log("Processed data before submission:", data);

      // If in edit mode, update existing family member
      if (isEditMode && editData?._id) {
        const result = await dispatch(
          updateFamilyMember({ id: editData._id, formData: data })
        );
        if (updateFamilyMember.fulfilled.match(result)) {
          toast.success("Family member updated successfully");
          if (onSuccess) onSuccess();
          onClose();
        } else {
          toast.error(result.payload || "Failed to update family member");
        }
        return;
      }

      // If in request mode, create request instead of direct add
      if (isRequestMode) {
        const result = await dispatch(createFamilyMemberRequest(data));
        if (createFamilyMemberRequest.fulfilled.match(result)) {
          toast.success("Family member request submitted successfully! Waiting for admin approval.");
          onSuccess && onSuccess();
          onClose();
          return;
        } else {
          toast.error(result.payload || "Failed to submit request");
          return;
        }
      }
      
      // Normal add flow
      console.log("Dispatching addFamilyMember with data:", data);
      const result = await dispatch(addFamilyMember(data));
      console.log("addFamilyMember result:", result);
      
      if (addFamilyMember.fulfilled.match(result)) {
        if (result.payload?.needsApproval) {
          toast.success(
            "Family member submitted for approval (you have 5+ members)"
          );
        } else {
          toast.success("Family member added successfully!");
        }
        
        // Show login information if family member can login
        if (result.payload?.loginInfo?.canLogin) {
          const loginMsg = result.payload.loginInfo.message;
          toast.info(loginMsg, {
            autoClose: 8000, // Show for 8 seconds
          });
        }
        
        if (onSuccess) onSuccess();
        onClose();
      } else if (addFamilyMember.rejected.match(result)) {
        const errorMessage = result.payload || "Failed to add family member";
        toast.error(errorMessage);
        console.error("addFamilyMember rejected:", result.payload);
      }
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast.error(error.message || "An unexpected error occurred");
    }
  };

  // Handle form validation errors
  const onError = (errors) => {
    console.log("Form validation errors:", errors);
    
    // Recursively find the first error message
    const findFirstError = (errorObj, path = "") => {
      for (const key in errorObj) {
        const currentPath = path ? `${path}.${key}` : key;
        if (errorObj[key]?.message) {
          return { message: errorObj[key].message, field: currentPath };
        }
        if (typeof errorObj[key] === 'object' && errorObj[key] !== null && !errorObj[key].message) {
          const nestedError = findFirstError(errorObj[key], currentPath);
          if (nestedError) return nestedError;
        }
      }
      return null;
    };
    
    const firstError = findFirstError(errors);
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      // Show which fields have errors
      const errorFields = Object.keys(errors).map(key => {
        if (errors[key]?.message) return key;
        if (typeof errors[key] === 'object') {
          const nestedKeys = Object.keys(errors[key]).filter(k => errors[key][k]?.message);
          return nestedKeys.length > 0 ? `${key} (${nestedKeys.join(", ")})` : null;
        }
        return null;
      }).filter(Boolean).join(", ");
      
      if (errorFields) {
        toast.error(`Please fix errors in: ${errorFields}`);
      } else {
        toast.error("Please fill in all required fields correctly");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode 
              ? "Edit Family Member" 
              : isRequestMode 
                ? "Request to Add Family Member" 
                : "Add Family Member"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="p-6 space-y-4">
          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
            />
          )}

          {/* Relationship to User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship to You <span className="text-red-500">*</span>
            </label>
            <select
              {...register("relationshipToUser", {
                required: "Relationship is required",
              })}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">Select relationship</option>
              {RELATIONSHIP_TYPES.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
            {errors.relationshipToUser && (
              <p className="mt-1 text-sm text-red-600">
                {errors.relationshipToUser.message}
              </p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("firstName", {
                  required: "First name is required",
                  minLength: {
                    value: 2,
                    message: "First name must be at least 2 characters",
                  },
                })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                {...register("middleName")}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("lastName", {
                  required: "Last name is required",
                  minLength: {
                    value: 2,
                    message: "Last name must be at least 2 characters",
                  },
                })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Date of Birth - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register("dateOfBirth", {
                required: "Date of birth is required",
              })}
              max={new Date().toISOString().split("T")[0]}
              className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                errors.dateOfBirth ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          {/* Gender - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              {...register("gender", {
                required: "Gender is required",
              })}
              className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                errors.gender ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600">
                {errors.gender.message}
              </p>
            )}
          </div>

          {/* Contact Information - Mobile Number REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register("mobileNumber", {
                required: "Mobile number is required",
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: "Please enter a valid 10-digit Indian mobile number",
                },
              })}
              placeholder="10 digits"
              className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                errors.mobileNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.mobileNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.mobileNumber.message}
              </p>
            )}
          </div>

          {/* Address Section - REQUIRED FIELDS */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Address <span className="text-red-500">*</span>
            </h3>
            
            {/* Address Line 1 - REQUIRED */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("address.line1", {
                  required: "Address line 1 is required",
                })}
                placeholder="e.g., House/Flat No., Building Name"
                className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                  errors.address?.line1 ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.address?.line1 && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.line1.message}
                </p>
              )}
            </div>

            {/* Address Line 2 - OPTIONAL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                {...register("address.line2")}
                placeholder="e.g., Street, Area, Landmark"
                className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                  errors.address?.line2 ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.address?.line2 && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.line2.message}
                </p>
              )}
            </div>
            
            {/* City - Searchable Input */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register("address.city", {
                    required: "City is required",
                  })}
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
                    // Close suggestions on blur, but only if city wasn't just selected
                    setTimeout(() => {
                      if (!isCitySelected) {
                        setShowCitySuggestions(false);
                        if (city && city.trim().length >= 3) {
                          const cityKey = `${city.trim()}_null_IN`;
                          // Only load if not already loaded
                          if (cityKey !== lastLoadedCityRef.current) {
                            loadLocationData(city.trim(), null, "IN");
                          }
                        }
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
              {selectedLocation && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Location found: {selectedLocation.state}, {selectedLocation.country}
                </p>
              )}
              
              {/* City Suggestions - Only show if not already selected */}
              {showCitySuggestions && citySuggestions.length > 0 && !isCitySelected && (
                <div 
                  className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  style={{ top: '100%', left: 0 }}
                  onMouseDown={(e) => {
                    // Prevent blur event when clicking on suggestions
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

            {/* State, Country, Pincode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* State - Auto-filled, Read-only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("address.state", {
                    required: "State is required",
                  })}
                  disabled
                  readOnly
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed min-h-[44px]"
                />
                {errors.address?.state && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.address.state.message}
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
                  {...register("address.country", {
                    required: "Country is required",
                  })}
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

              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                {selectedLocation && 
                 selectedLocation.pincodes && 
                 selectedLocation.pincodes.length > 1 ? (
                  <select
                    {...register("address.pincode", {
                      required: "Pincode is required",
                    })}
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
                ) : (
                  <input
                    type="text"
                    {...register("address.pincode", {
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
                      errors.address?.pincode ? "border-red-500" : "border-gray-300"
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
              </div>
            </div>
          </div>

          {/* Create Login Account Section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="createLoginAccount"
                {...register("createLoginAccount")}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="createLoginAccount" className="ml-2 text-sm font-medium text-gray-700">
                Create login account for this family member (Optional)
              </label>
            </div>

            {createLoginAccount && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  This family member will be able to login independently using their email or mobile number.
                </p>

                {/* Email or Mobile Required Message */}
                {!mobileNumber && !email && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Email or mobile number is required to create a login account.
                    </p>
                  </div>
                )}

                {/* Password Options */}
                {(mobileNumber || email) && (
                  <>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="useMobileAsPassword"
                        {...register("useMobileAsPassword")}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="useMobileAsPassword" className="ml-2 text-sm text-gray-700">
                        Use mobile number as default password
                      </label>
                    </div>

                    {!useMobileAsPassword && (
                      <>
                        {/* Password Field with Show/Hide Toggle - Like Registration Form */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Set Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              {...register("password", {
                                required: !useMobileAsPassword 
                                  ? "Password is required" 
                                  : false,
                                minLength: {
                                  value: 8,
                                  message: "Password must be at least 8 characters",
                                },
                              })}
                              placeholder="Create password for this family member"
                              className="w-full px-4 py-2 pr-12 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.password.message}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Min 8 characters. This person will use this password to login.
                          </p>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              {...register("confirmPassword", {
                                required: !useMobileAsPassword 
                                  ? "Please confirm password" 
                                  : false,
                                validate: (value) =>
                                  value === watch("password") || "Passwords do not match",
                              })}
                              placeholder="Confirm password"
                              className="w-full px-4 py-2 pr-12 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        
          
          {/* Info message for family member accounts (request mode) */}
          {isRequestMode && (
            <div className="border-t pt-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You are adding a family member. This request will be sent to admin for approval.
                </p>
              </div>
            </div>
          )}

          {/* Blood Group - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Group <span className="text-red-500">*</span>
            </label>
            <select
              {...register("bloodGroup", {
                required: "Blood group is required",
              })}
              className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                errors.bloodGroup ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select blood group</option>
              {BLOOD_GROUPS && BLOOD_GROUPS.length > 0 ? (
                BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))
              ) : (
                <>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </>
              )}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Helpful for medical emergencies and blood donation drives
            </p>
            {errors.bloodGroup && (
              <p className="mt-1 text-sm text-red-600">
                {errors.bloodGroup.message}
              </p>
            )}
          </div>

          {/* Marital Status and Occupation - REQUIRED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marital Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register("maritalStatus", {
                  required: "Marital status is required",
                })}
                className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                  errors.maritalStatus ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select marital status</option>
                {MARITAL_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              {errors.maritalStatus && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.maritalStatus.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("occupationType", {
                  required: "Occupation type is required",
                })}
                className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                  errors.occupationType ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select occupation type</option>
                {OCCUPATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              {errors.occupationType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.occupationType.message}
                </p>
              )}
            </div>
          </div>

          {/* Occupation Details - Conditional based on Occupation Type */}
          {!occupationType && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Please select an occupation type to see relevant fields.
              </p>
            </div>
          )}
          {occupationType && (
            <div className="space-y-4">
              {/* Special message for homemaker */}
              {occupationType === "homemaker" ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> No additional occupation details required for homemaker.
                  </p>
                </div>
              ) : (
                <>
                  {/* First Row: Occupation Title and Company/Business Name (for job/business) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Occupation Title - Show for all except homemaker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {occupationType === "student" 
                          ? "Course/Field of Study" 
                          : occupationType === "retired"
                          ? "Previous Occupation Title"
                          : "Occupation Title"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("occupationTitle", {
                          required: occupationType !== "homemaker" ? "Occupation title is required" : false,
                          maxLength: {
                            value: 100,
                            message: "Occupation title cannot exceed 100 characters",
                          },
                        })}
                        className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                          errors.occupationTitle ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder={
                          occupationType === "student" 
                            ? "e.g., Engineering, Medicine, MBA"
                            : occupationType === "retired"
                            ? "e.g., Manager, Teacher, Engineer"
                            : "e.g., Software Engineer, Doctor, Teacher"
                        }
                      />
                      {errors.occupationTitle && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.occupationTitle.message}
                        </p>
                      )}
                    </div>

                    {/* Company/Business Name - Show for job and business */}
                    {(occupationType === "job" || occupationType === "business") && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {occupationType === "business" ? "Business Name" : "Company Name"} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register("companyOrBusinessName", {
                            required: (occupationType === "job" || occupationType === "business") ? "Company/Business name is required" : false,
                            maxLength: {
                              value: 100,
                              message: "Company/Business name cannot exceed 100 characters",
                            },
                          })}
                          className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                            errors.companyOrBusinessName ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder={occupationType === "business" ? "e.g., ABC Enterprises" : "e.g., ABC Corporation"}
                        />
                        {errors.companyOrBusinessName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.companyOrBusinessName.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Second Row: Position (for job only) and Qualification */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Position - Show for job only */}
                    {occupationType === "job" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register("position", {
                            required: occupationType === "job" ? "Position is required" : false,
                            maxLength: {
                              value: 100,
                              message: "Position cannot exceed 100 characters",
                            },
                          })}
                          className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                            errors.position ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="e.g., Senior Manager, Team Lead, Director"
                        />
                        {errors.position && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.position.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Qualification - Show for all except homemaker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qualification <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("qualification", {
                          required: occupationType !== "homemaker" ? "Qualification is required" : false,
                          maxLength: {
                            value: 100,
                            message: "Qualification cannot exceed 100 characters",
                          },
                        })}
                        className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                          errors.qualification ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="e.g., B.Tech, MBA, M.D., Ph.D."
                      />
                      {errors.qualification && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.qualification.message}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Samaj/Community - Inherited from family head - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Samaj/Community <span className="text-red-500">*</span>
            </label>
            {user?.samaj ? (
              <>
                <input
                  type="text"
                  {...register("samaj", {
                    required: "Samaj/Community is required",
                  })}
                  value={user.samaj}
                  readOnly
                  className={`w-full px-4 py-2 text-base border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed min-h-[44px] ${
                    errors.samaj ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Family members inherit the same Samaj/Community as the family head
                </p>
              </>
            ) : (
              <select
                {...register("samaj", {
                  required: "Samaj/Community is required",
                })}
                className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                  errors.samaj ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Samaj/Community</option>
                {SAMAJ_TYPES && SAMAJ_TYPES.length > 0 ? (
                  SAMAJ_TYPES.map((samaj) => (
                    <option key={samaj} value={samaj}>
                      {samaj}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Kadva Patidar">Kadva Patidar</option>
                    <option value="Anjana Patidar">Anjana Patidar</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            )}
            {errors.samaj && (
              <p className="mt-1 text-sm text-red-600">
                {errors.samaj.message}
              </p>
            )}
          </div>

          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
            {profileImagePreview && (
              <div className="mt-2">
                <img
                  src={profileImagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can add up to 5 family members without
              approval. 6+ members will require admin approval.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading || isRequestLoading}
              disabled={isLoading || isRequestLoading}
            >
              {isEditMode 
                ? "Update Family Member" 
                : isRequestMode 
                  ? "Submit Request" 
                  : "Add Family Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFamilyMemberForm;

