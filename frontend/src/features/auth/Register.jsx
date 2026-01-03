import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { register, clearError, clearMessage } from "./authSlice";
import { registerSchema } from "../../utils/validation";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, message } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: "onChange",
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Re-validate confirmPassword when password changes
  useEffect(() => {
    if (confirmPassword) {
      trigger("confirmPassword");
    }
  }, [password, trigger, confirmPassword]);

  // Handle registration success
  useEffect(() => {
    if (message && (message.includes("submitted") || message.includes("waiting"))) {
      toast.success("Registration submitted. Waiting for approval.");
      dispatch(clearMessage());
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    }
  }, [message, navigate, dispatch]);

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

  const onSubmit = async (data) => {
    try {
      // Format mobile number
      const mobileNumber = data.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
      
      const formData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        email: data.email.toLowerCase(),
        mobileNumber: `+91${mobileNumber}`,
        password: data.password,
        confirmPassword: data.confirmPassword,
      };

      dispatch(register(formData));
    } catch (error) {
      toast.error("Failed to submit registration");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-900">
            Register to Family Community
          </h1>

          <p className="text-center text-gray-600 mb-6">
            Create your account with basic information. Complete your profile after approval.
          </p>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Input
                label="First Name"
                name="firstName"
                register={registerField}
                error={errors.firstName?.message}
                placeholder="Enter first name"
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

            {/* Date of Birth */}
            <Input
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              register={registerField}
              error={errors.dateOfBirth?.message}
              max={new Date().toISOString().split("T")[0]}
              required
            />

            {/* Contact Information */}
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

            {/* Password Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...registerField("password")}
                  placeholder="Enter password (min 8 characters)"
                  className={`w-full px-4 py-2 pr-12 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters with at least one letter and one number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...registerField("confirmPassword")}
                  placeholder="Confirm password"
                  className={`w-full px-4 py-2 pr-12 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isLoading}
              loading={isLoading}
            >
              {isLoading ? "Registering..." : "Register"}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Login here
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
