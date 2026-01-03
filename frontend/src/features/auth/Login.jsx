import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { login, clearError, clearMessage } from "./authSlice";
import { USER_ROLES } from "../../constants/enums";
import { loginSchema } from "../../utils/validation";
import { normalizePhone } from "../../utils/phoneUtils";
import { MESSAGES } from "../../constants/authMessages";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

const Login = () => {
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
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

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
        navigate("/profile");
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Handle login success message
  useEffect(() => {
    if (message && isAuthenticated) {
      toast.success(message || MESSAGES.AUTH.LOGIN_SUCCESS);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
            Login to Family Community
          </h1>


          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email or Mobile Number"
              type="text"
              name="emailOrMobile"
              register={register}
              error={errors.emailOrMobile?.message}
              placeholder="Enter email or mobile number"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                register={register}
                error={errors.password?.message}
                placeholder="Enter your password"
                required
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

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
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

