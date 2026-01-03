import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { usePermission } from "../hooks/usePermission";

const ProtectedRoute = ({ allowedRoles = [], requiredPermission = null, skipProfileCheck = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const hasPermission = usePermission(requiredPermission);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if profile is completed - redirect to complete-profile if not
  // Skip this check for the complete-profile route itself
  if (!skipProfileCheck && user && user.status === "approved" && !user.profileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Check permission if provided
  if (requiredPermission && !hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">403 Forbidden</h1>
          <p className="text-gray-600 mb-2">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required permission: {requiredPermission}
          </p>
        </div>
      </div>
    );
  }

  // Check role if provided (backward compatibility)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">403 Forbidden</h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;

