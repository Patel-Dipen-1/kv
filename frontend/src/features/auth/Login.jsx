import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login, clearError, clearMessage } from "./authSlice";
import { USER_ROLES } from "../../constants/enums";
import { loginSchema } from "../../utils/validation";
import { normalizePhone } from "../../utils/phoneUtils";
import { MESSAGES } from "../../constants/authMessages";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import { toast } from "react-toastify";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, message, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  // Get credentials from registration if available
  const registrationData = location.state;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: "onChange", // Validate on change for real-time feedback
    defaultValues: {
      emailOrMobile: registrationData?.email || "",
      password: registrationData?.password || "",
    },
  });

  // Pre-fill form if coming from registration
  useEffect(() => {
    if (registrationData?.email) {
      setValue("emailOrMobile", registrationData.email);
    }
    if (registrationData?.password) {
      setValue("password", registrationData.password);
    }
  }, [registrationData, setValue]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user needs to complete profile
      if (user.registrationStep === 1 && !user.profileCompleted) {
        navigate("/complete-profile");
        return;
      }
      
      // Check if user is using default password (mobile number)
      // Backend should return needsPasswordChange flag
      if (user.needsPasswordChange) {
        navigate("/profile/change-password", {
          state: { message: "Please set a new password for your account" }
        });
        return;
      }
      
      // Redirect based on role
      if ([USER_ROLES[2], USER_ROLES[3]].includes(user?.role)) { // moderator, admin
        navigate("/admin/dashboard");
      } else {
        // Redirect to profile (user dashboard)
        navigate("/profile");
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Handle login success message
  useEffect(() => {
    if (message && isAuthenticated) {
      toast.success("Login successful");
      dispatch(clearMessage());
    }
  }, [message, isAuthenticated, dispatch]);

  // Handle login error
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

  const onSubmit = (data) => {
    let { emailOrMobile } = data;
    
    // Normalize phone number if it's not an email
    if (emailOrMobile && !String(emailOrMobile).includes("@")) {
      const normalized = normalizePhone(emailOrMobile);
      if (normalized) {
        emailOrMobile = normalized;
      } else {
        toast.error(MESSAGES.REGISTER.PHONE_INVALID);
        return;
      }
    }
    
    dispatch(login({ emailOrMobile, password: data.password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <Card>
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-900">
            Login to Family Community
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <Input
              label="Email or Mobile Number"
              type="text"
              name="emailOrMobile"
              register={register}
              error={errors.emailOrMobile?.message}
              placeholder="Enter email or mobile number"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              register={register}
              error={errors.password?.message}
              placeholder="Enter your password"
              required
              showPasswordToggle={true}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth={true}
              isLoading={isLoading}
              disabled={isLoading || !isValid}
            >
              Login
            </Button>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:text-blue-800">
                Register here
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;

