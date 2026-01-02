import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { X, Eye, EyeOff } from "lucide-react";
import { addFamilyMember, clearError } from "./familySlice";
import { createFamilyMemberRequest } from "./familyRequestSlice";
import { useEnums } from "../../hooks/useEnums";
import { compressImage } from "../../utils/imageUtils";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import ErrorAlert from "../../components/common/ErrorAlert";
import { toast } from "react-toastify";

const AddFamilyMemberForm = ({ onClose, onSuccess, isRequestMode = false }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.family);
  const { isLoading: isRequestLoading } = useSelector((state) => state.familyRequest || { isLoading: false });
  const { user } = useSelector((state) => state.auth); // Get logged-in user
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  
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
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const dateOfBirth = watch("dateOfBirth");
  const mobileNumber = watch("mobileNumber");
  const email = watch("email");
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

  // Set samaj from logged-in user (family head)
  useEffect(() => {
    if (user?.samaj) {
      setValue("samaj", user.samaj);
    }
  }, [user, setValue]);

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

  const onSubmit = async (data) => {
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

    // Remove empty fields (but keep samaj)
    Object.keys(data).forEach((key) => {
      if (key !== "samaj" && (data[key] === "" || data[key] === null || data[key] === undefined)) {
        delete data[key];
      }
    });

    try {
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
      const result = await dispatch(addFamilyMember(data));
      if (addFamilyMember.fulfilled.match(result)) {
        if (result.payload.needsApproval) {
          toast.success(
            "Family member submitted for approval (you have 5+ members)"
          );
        } else {
          toast.success("Family member added successfully!");
        }
        
        // Show login information if family member can login
        if (result.payload.loginInfo?.canLogin) {
          const loginMsg = result.payload.loginInfo.message;
          toast.info(loginMsg, {
            autoClose: 8000, // Show for 8 seconds
          });
        }
        
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      // Error handled by Redux
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {isRequestMode ? "Request to Add Family Member" : "Add Family Member"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
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

          {/* Date of Birth and Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                {...register("dateOfBirth")}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                {...register("age", {
                  min: { value: 0, message: "Age cannot be negative" },
                  max: { value: 120, message: "Age cannot exceed 120" },
                })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                {...register("mobileNumber", {
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Mobile number must be 10 digits",
                  },
                })}
                placeholder="10 digits"
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              {errors.mobileNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.mobileNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email",
                  },
                })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
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
                Create login account for this family member
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
          )}
          
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

          {/* Blood Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Group (Optional)
            </label>
            <select
              {...register("bloodGroup")}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              defaultValue="Unknown"
            >
              {BLOOD_GROUPS && BLOOD_GROUPS.length > 0 ? (
                BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))
              ) : (
                <>
                  <option value="Unknown">Unknown</option>
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

          {/* Marital Status and Occupation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marital Status
              </label>
              <select
                {...register("maritalStatus")}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              >
                <option value="">Select marital status</option>
                {MARITAL_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation Type
              </label>
              <select
                {...register("occupationType")}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              >
                <option value="">Select occupation type</option>
                {OCCUPATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Occupation Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation Title
              </label>
              <input
                type="text"
                {...register("occupationTitle")}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualification
              </label>
              <input
                type="text"
                {...register("qualification")}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Samaj/Community - Inherited from family head */}
          {user?.samaj && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Samaj/Community
              </label>
              <input
                type="text"
                value={user.samaj}
                disabled
                readOnly
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed min-h-[44px]"
              />
              <p className="mt-1 text-xs text-gray-500">
                Family members inherit the same Samaj/Community as the family head
              </p>
            </div>
          )}

          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Image
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
              {isRequestMode ? "Submit Request" : "Add Family Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFamilyMemberForm;

