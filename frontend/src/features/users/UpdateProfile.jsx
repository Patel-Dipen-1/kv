import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMyProfile, updateMyProfile, clearError, clearSuccess } from "./userSlice";
import { updateProfileSchema } from "../../utils/validation";
import { formatDateForInput } from "../../utils/helpers";
import { compressImage } from "../../utils/imageUtils";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import Navbar from "../../components/layout/Navbar";
import { toast } from "react-toastify";

const UpdateProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, isLoading, error, success } = useSelector(
    (state) => state.users
  );
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(updateProfileSchema),
  });

  const profileImage = watch("profileImage");
  const dateOfBirth = watch("dateOfBirth");
  const age = watch("age");

  // Auto-calculate age from date of birth
  useEffect(() => {
    if (dateOfBirth) {
      try {
        // Handle both date string (YYYY-MM-DD) and Date object
        let dob;
        if (typeof dateOfBirth === 'string') {
          // If it's a date string in YYYY-MM-DD format
          dob = new Date(dateOfBirth + 'T00:00:00'); // Add time to avoid timezone issues
        } else {
          dob = new Date(dateOfBirth);
        }
        
        // Check if date is valid
        if (isNaN(dob.getTime())) {
          console.warn("Invalid date of birth:", dateOfBirth);
          return;
        }
        
        const today = new Date();
        let calculatedAge = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          calculatedAge--;
        }
        
        if (calculatedAge >= 0 && calculatedAge <= 120) {
          setValue("age", calculatedAge, { shouldValidate: true, shouldDirty: true });
        } else {
          console.warn("Calculated age out of range:", calculatedAge);
        }
      } catch (error) {
        console.error("Error calculating age:", error);
      }
    } else {
      // Clear age if date of birth is cleared
      setValue("age", "", { shouldValidate: false });
    }
  }, [dateOfBirth, setValue]);

  useEffect(() => {
    dispatch(getMyProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      reset({
        address: {
          line1: profile.address?.line1 || "",
          line2: profile.address?.line2 || "",
          city: profile.address?.city || "",
          state: profile.address?.state || "",
          pincode: profile.address?.pincode || "",
        },
        age: profile.age || "",
        dateOfBirth: profile.dateOfBirth
          ? formatDateForInput(profile.dateOfBirth)
          : "",
        occupationTitle: profile.occupationTitle || "",
        companyOrBusinessName: profile.companyOrBusinessName || "",
        position: profile.position || "",
        qualification: profile.qualification || "",
        maritalStatus: profile.maritalStatus || "",
        subFamilyNumber: profile.subFamilyNumber || "",
      });
      if (profile.profileImage && !removeImage) {
        setProfileImagePreview(profile.profileImage);
      } else {
        setProfileImagePreview(null);
      }
      setRemoveImage(false);
    }
  }, [profile, reset, removeImage]);

  useEffect(() => {
    if (removeImage) {
      setProfileImagePreview(null);
      setValue("profileImage", null);
      return;
    }
    if (profileImage && profileImage[0]) {
      const file = profileImage[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [profileImage, removeImage, setValue]);

  useEffect(() => {
    if (success) {
      toast.success("Profile updated successfully!");
      dispatch(clearSuccess());
      navigate("/profile");
    }
  }, [success, navigate, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      const formData = { ...data };

      // Handle profile image removal
      if (removeImage) {
        formData.profileImage = null; // Send null to remove image
      } else if (data.profileImage && data.profileImage[0]) {
        // Handle profile image if uploaded - compress before sending
        const file = data.profileImage[0];
        try {
          // Compress image to reduce size (max 800x800, quality 0.8)
          const compressedImage = await compressImage(file, 800, 800, 0.8);
          formData.profileImage = compressedImage;
        } catch (error) {
          toast.error(error.message || "Failed to process image");
          return;
        }
      } else {
        // Don't send profileImage field if not changed
        delete formData.profileImage;
      }

      dispatch(updateMyProfile(formData));
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm("Are you sure you want to remove your profile image?")) {
      setRemoveImage(true);
      setProfileImagePreview(null);
      setValue("profileImage", null);
    }
  };

  if (isLoading && !profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Update Profile
          </h1>

          <Card>
            {error && (
              <ErrorAlert
                message={error}
                onDismiss={() => dispatch(clearError())}
                className="mb-4"
              />
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Address */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Address
                </h2>

                <Input
                  label="Address Line 1"
                  name="address.line1"
                  register={register}
                  error={errors.address?.line1?.message}
                />
                <Input
                  label="Address Line 2 (Optional)"
                  name="address.line2"
                  register={register}
                  error={errors.address?.line2?.message}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    name="address.city"
                    register={register}
                    error={errors.address?.city?.message}
                  />
                  <Input
                    label="State"
                    name="address.state"
                    register={register}
                    error={errors.address?.state?.message}
                  />
                </div>

                <Input
                  label="Pincode"
                  name="address.pincode"
                  register={register}
                  error={errors.address?.pincode?.message}
                  placeholder="6-digit pincode"
                />
              </div>

              {/* Personal Info */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth (Optional)"
                    type="date"
                    name="dateOfBirth"
                    register={register}
                    error={errors.dateOfBirth?.message}
                  />
                  <Input
                    label="Age (Optional - Auto-calculated)"
                    type="number"
                    name="age"
                    register={register}
                    error={errors.age?.message}
                    min="0"
                    max="120"
                    disabled={!!dateOfBirth}
                    title={dateOfBirth ? "Age is automatically calculated from date of birth" : ""}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    {...register("maritalStatus")}
                    className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.maritalStatus
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select marital status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                  {errors.maritalStatus && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.maritalStatus.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Occupation */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">
                  Occupation
                </h2>

                <Input
                  label="Occupation Title (Optional)"
                  name="occupationTitle"
                  register={register}
                  error={errors.occupationTitle?.message}
                  placeholder="e.g., Software Engineer"
                />

                <Input
                  label="Company/Business Name (Optional)"
                  name="companyOrBusinessName"
                  register={register}
                  error={errors.companyOrBusinessName?.message}
                />

                <Input
                  label="Position (Optional)"
                  name="position"
                  register={register}
                  error={errors.position?.message}
                />

                <Input
                  label="Qualification (Optional)"
                  name="qualification"
                  register={register}
                  error={errors.qualification?.message}
                  placeholder="e.g., B.Com, MCA"
                />
              </div>

              {/* Other */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">
                  Other Information
                </h2>

                <Input
                  label="Sub-Family Number (Optional)"
                  name="subFamilyNumber"
                  register={register}
                  error={errors.subFamilyNumber?.message}
                  placeholder="For family grouping"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    {...register("profileImage")}
                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      // Reset remove image flag when new image is selected
                      if (e.target.files && e.target.files[0]) {
                        setRemoveImage(false);
                      }
                      register("profileImage").onChange(e);
                    }}
                  />
                  {profileImagePreview && (
                    <div className="mt-2 relative inline-block">
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  {!profileImagePreview && profile?.profileImage && (
                    <div className="mt-2 text-sm text-gray-600">
                      Current image will be removed when you submit the form.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/profile")}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  Update Profile
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default UpdateProfile;

