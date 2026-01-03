import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { registerStep1, clearError, clearMessage } from "./authSlice";
import { registerStep1Schema } from "../../utils/validation";
import { normalizePhone } from "../../utils/phoneUtils";
import { MESSAGES } from "../../constants/authMessages";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

const RegisterStep1 = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, message, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(registerStep1Schema),
  });

  const phone = watch("phone");
  const email = watch("email");

  // Redirect if already authenticated and profile completed
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.profileCompleted && user.registrationStep === 2) {
        navigate("/profile");
      } else if (user.registrationStep === 1) {
        navigate("/complete-profile");
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Handle step 1 success - move to step 2
  useEffect(() => {
    if (message && isAuthenticated) {
      toast.success(message || MESSAGES.REGISTER.STEP1_SUCCESS);
      dispatch(clearMessage());
      // Clear the form
      reset();
      // Navigate to complete profile
      navigate("/complete-profile");
    }
  }, [message, isAuthenticated, navigate, dispatch, reset]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data) => {
    // Normalize phone if provided
    if (data.phone) {
      const normalized = normalizePhone(data.phone);
      if (!normalized) {
        toast.error(MESSAGES.REGISTER.PHONE_INVALID);
        return;
      }
      data.phone = normalized;
    }

    dispatch(registerStep1(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="w-12 h-1 bg-gray-300"></div>
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold">
                  2
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900">
              Basic Registration
            </h1>
            <p className="text-sm text-center text-gray-600 mt-2">
              Step 1 of 2 - Create your account
            </p>
          </div>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              name="name"
              register={register}
              error={errors.name?.message}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              name="phone"
              register={register}
              error={errors.phone?.message}
              placeholder="9876543210 or 919876543210"
              helperText={!phone && !email ? "Phone or email is required" : ""}
            />

            <div className="text-center text-sm text-gray-500">OR</div>

            <Input
              label="Email (Optional)"
              type="email"
              name="email"
              register={register}
              error={errors.email?.message}
              placeholder="your.email@example.com"
              helperText={!phone && !email ? "Phone or email is required" : ""}
            />

            <Input
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              register={register}
              error={errors.dateOfBirth?.message}
              required
              max={new Date().toISOString().split("T")[0]}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                register={register}
                error={errors.password?.message}
                placeholder="Enter a strong password"
                required
                helperText="Must be at least 8 characters with letters and numbers"
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
              className="mt-6"
            >
              Continue to Profile
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

export default RegisterStep1;

