import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { register, clearError, clearMessage } from "./authSlice";
import { registerSchema } from "../../utils/validation";
import { compressImage } from "../../utils/imageUtils";
import { useEnums } from "../../hooks/useEnums";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, message, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Get dynamic enums
  const SAMAJ_TYPES = useEnums("SAMAJ_TYPES");
  const OCCUPATION_TYPES = useEnums("OCCUPATION_TYPES");
  const MARITAL_STATUS = useEnums("MARITAL_STATUS");

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      address: {
        country: "India",
      },
    },
  });

  const profileImage = watch("profileImage");
  const dateOfBirth = watch("dateOfBirth");

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

  useEffect(() => {
    if (message) {
      toast.success(message || "Registration submitted. Waiting for admin approval.");
      dispatch(clearMessage());
      navigate("/login");
    }
  }, [message, navigate, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      // Format mobile number
      const mobileNumber = data.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
      
      const formData = {
        ...data,
        mobileNumber: `+91${mobileNumber}`,
        email: data.email.toLowerCase(),
        // If password not provided, don't send it (backend will use mobile number)
        password: data.password || undefined,
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

      dispatch(register(formData));
    } catch (error) {
      toast.error("Failed to submit registration");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
            Register to Family Community
          </h1>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  register={registerField}
                  error={errors.firstName?.message}
                  required
                />
                <Input
                  label="Middle Name (Optional)"
                  name="middleName"
                  register={registerField}
                  error={errors.middleName?.message}
                />
              </div>

              <Input
                label="Last Name"
                name="lastName"
                register={registerField}
                error={errors.lastName?.message}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  register={registerField}
                  error={errors.email?.message}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date of Birth (Optional)"
                  type="date"
                  name="dateOfBirth"
                  register={registerField}
                  error={errors.dateOfBirth?.message}
                />
                <Input
                  label="Age (Optional - Auto-calculated)"
                  type="number"
                  name="age"
                  register={registerField}
                  error={errors.age?.message}
                  min="0"
                  max="120"
                  disabled={!!dateOfBirth}
                  title={dateOfBirth ? "Age is automatically calculated from date of birth" : ""}
                />
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Group (Optional)
                </label>
                <select
                  {...registerField("bloodGroup")}
                  className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                    errors.bloodGroup ? "border-red-500" : "border-gray-300"
                  }`}
                  defaultValue="Unknown"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
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
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">
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
                label="Address Line 2 (Optional)"
                name="address.line2"
                register={registerField}
                error={errors.address?.line2?.message}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="City"
                  name="address.city"
                  register={registerField}
                  error={errors.address?.city?.message}
                  required
                />
                <Input
                  label="State"
                  name="address.state"
                  register={registerField}
                  error={errors.address?.state?.message}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Pincode"
                  name="address.pincode"
                  register={registerField}
                  error={errors.address?.pincode?.message}
                  placeholder="6-digit pincode"
                  required
                />
                <Input
                  label="Country"
                  name="address.country"
                  register={registerField}
                  error={errors.address?.country?.message}
                  defaultValue="India"
                  disabled
                />
              </div>
            </div>

            {/* Occupation */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">
                Occupation
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerField("occupationType")}
                  className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                    errors.occupationType
                      ? "border-red-500"
                      : "border-gray-300"
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

              <Input
                label="Occupation Title (Optional)"
                name="occupationTitle"
                register={registerField}
                error={errors.occupationTitle?.message}
                placeholder="e.g., Software Engineer"
              />

              <Input
                label="Company/Business Name (Optional)"
                name="companyOrBusinessName"
                register={registerField}
                error={errors.companyOrBusinessName?.message}
              />

              <Input
                label="Position (Optional)"
                name="position"
                register={registerField}
                error={errors.position?.message}
              />

              <Input
                label="Qualification (Optional)"
                name="qualification"
                register={registerField}
                error={errors.qualification?.message}
                placeholder="e.g., B.Com, MCA"
              />
            </div>

            {/* Other Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">
                Other Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marital Status <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerField("maritalStatus")}
                  className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                    errors.maritalStatus
                      ? "border-red-500"
                      : "border-gray-300"
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
                  Samaj/Community <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerField("samaj")}
                  className={`w-full px-4 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                    errors.samaj
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select samaj/community</option>
                  {SAMAJ_TYPES.map((samaj) => (
                    <option key={samaj} value={samaj}>
                      {samaj}
                    </option>
                  ))}
                </select>
                {errors.samaj && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.samaj.message}
                  </p>
                )}
              </div>

              <Input
                label="Sub-Family Number (Optional)"
                name="subFamilyNumber"
                register={registerField}
                error={errors.subFamilyNumber?.message}
                placeholder="Auto-generated if left empty"
                disabled
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
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">
                Password
              </h2>

              <div className="relative">
                <Input
                  label="Password (Optional)"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  register={registerField}
                  error={errors.password?.message}
                  placeholder="Leave empty to use mobile number as password"
                  helperText="If not provided, your mobile number will be used as password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
              className="mt-6"
            >
              Register
            </Button>

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

