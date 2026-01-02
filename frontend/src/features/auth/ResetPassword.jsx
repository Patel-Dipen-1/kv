import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword, clearError } from "./authSlice";
import { resetPasswordSchema } from "../../utils/validation";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams();
  const { isLoading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Password reset successful!");
      navigate("/profile");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = (data) => {
    dispatch(resetPassword({ token, password: data.password }));
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <Card>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Invalid Reset Token
            </h1>
            <p className="text-gray-600 mb-4">
              The password reset link is invalid or has expired.
            </p>
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-800"
            >
              Request a new reset link
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
            Reset Password
          </h1>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              name="password"
              register={register}
              error={errors.password?.message}
              placeholder="Minimum 8 characters with letter and number"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              register={register}
              error={errors.confirmPassword?.message}
              placeholder="Re-enter your password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
            >
              Reset Password
            </Button>

            <div className="text-center text-sm text-gray-600">
              <Link to="/login" className="text-blue-600 hover:text-blue-800">
                Back to Login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;

