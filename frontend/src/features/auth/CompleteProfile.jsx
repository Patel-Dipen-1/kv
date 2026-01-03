import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { registerStep2, clearError, clearMessage } from "./authSlice";
import { registerStep2Schema } from "../../utils/validation";
import { compressImage } from "../../utils/imageUtils";
import { useEnums } from "../../hooks/useEnums";
import { MESSAGES } from "../../constants/authMessages";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import { toast } from "react-toastify";

const CompleteProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, message, user, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // Get dynamic enums
  const OCCUPATION_TYPES = useEnums("OCCUPATION_TYPES");
  const MARITAL_STATUS = useEnums("MARITAL_STATUS");
  const SAMAJ_TYPES = useEnums("SAMAJ_TYPES");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(registerStep2Schema),
    defaultValues: {
      address: {
        country: "India",
      },
    },
  });

  const profileImage = watch("profileImage");
  const dateOfBirth = watch("dateOfBirth");

  // Redirect if not authenticated or already completed
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.profileCompleted && user?.registrationStep === 2) {
      navigate("/profile");
    }
  }, [isAuthenticated, user, navigate]);

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

  // Handle step 2 success
  useEffect(() => {
    if (message) {
      toast.success(message || MESSAGES.REGISTER.STEP2_SUCCESS);
      dispatch(clearMessage());
      navigate("/profile");
    }
  }, [message, navigate, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      const formData = { ...data };

      // Handle profile image if uploaded - compress before sending
      if (data.profileImage && data.profileImage[0]) {
        const file = data.profileImage[0];
        try {
          const compressedImage = await compressImage(file, 800, 800, 0.8);
          formData.profileImage = compressedImage;
        } catch (error) {
          toast.error(error.message || "Failed to process image");
          return;
        }
      } else {
        delete formData.profileImage;
      }

      dispatch(registerStep2(formData));
    } catch (error) {
      toast.error("Failed to complete profile");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                  ✓
                </div>
                <div className="w-12 h-1 bg-blue-600"></div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  2
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900">
              Complete Your Profile
            </h1>
            <p className="text-sm text-center text-gray-600 mt-2">
              Step 2 of 2 - Add your details
            </p>
          </div>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Address Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Address
              </h2>

              <Input
                label="Address Line 1"
                name="address.line1"
                register={register}
                error={errors.address?.line1?.message}
                required
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
                  required
                />

                <Input
                  label="State"
                  name="address.state"
                  register={register}
                  error={errors.address?.state?.message}
                  required
                />
              </div>

              <Input
                label="Pincode"
                name="address.pincode"
                register={register}
                error={errors.address?.pincode?.message}
                required
                maxLength={6}
              />
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Additional Information
              </h2>

              {OCCUPATION_TYPES.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation Type
                  </label>
                  <select
                    {...register("occupationType")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              )}

              {MARITAL_STATUS.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    {...register("maritalStatus")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              )}

              {SAMAJ_TYPES.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Samaj/Community
                  </label>
                  <select
                    {...register("samaj")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select samaj/community</option>
                    {SAMAJ_TYPES.map((samaj) => (
                      <option key={samaj} value={samaj}>
                        {samaj}
                      </option>
                    ))}
                  </select>
                  {errors.samaj && (
                    <p className="mt-1 text-sm text-red-600">{errors.samaj.message}</p>
                  )}
                </div>
              )}

              <Input
                label="Profile Image (Optional)"
                type="file"
                name="profileImage"
                register={register}
                error={errors.profileImage?.message}
                accept="image/*"
              />

              {profileImagePreview && (
                <div className="mt-2">
                  <img
                    src={profileImagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-full border-2 border-gray-300"
                  />
                </div>
              )}

              <Input
                label="Occupation Title (Optional)"
                name="occupationTitle"
                register={register}
                error={errors.occupationTitle?.message}
              />

              <Input
                label="Company/Business Name (Optional)"
                name="companyOrBusinessName"
                register={register}
                error={errors.companyOrBusinessName?.message}
              />

              <Input
                label="Qualification (Optional)"
                name="qualification"
                register={register}
                error={errors.qualification?.message}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
              className="mt-6"
            >
              Complete Registration
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;

