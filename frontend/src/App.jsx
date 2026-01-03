import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "./features/auth/authSlice";
import { fetchEnums } from "./features/enums/enumSlice";

// Auth Pages
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import ForgotPassword from "./features/auth/ForgotPassword";
import ResetPassword from "./features/auth/ResetPassword";
import CompleteProfile from "./features/auth/CompleteProfile";

// User Pages
import Profile from "./features/users/Profile";
import UpdateProfile from "./features/users/UpdateProfile";
import ChangePassword from "./features/auth/ChangePassword";

// Admin Pages
import Dashboard from "./features/admin/Dashboard";
import PendingUsers from "./features/admin/PendingUsers";
import ApprovedUsers from "./features/admin/ApprovedUsers";
import RejectedUsers from "./features/admin/RejectedUsers";
import PendingFamilyMembers from "./features/admin/PendingFamilyMembers";
import FamilyMemberRequests from "./features/admin/FamilyMemberRequests";
import ActivityLog from "./features/admin/ActivityLog";
import EnumManagement from "./features/admin/EnumManagement";
import RoleManagement from "./features/admin/RoleManagement";
import DeletedUsers from "./features/admin/DeletedUsers";
import AllUsersManagement from "./features/admin/AllUsersManagement";

// Committee Page (Public)
import Committee from "./features/committee/Committee";

// Family Connections
import FamilyConnections from "./features/relationships/FamilyConnections";
import FamilyMembersList from "./features/family/FamilyMembersList";

// Search
import FamilySearch from "./features/search/FamilySearch";

// Event Pages
import EventList from "./features/events/EventList";
import EventDetail from "./features/events/EventDetail";
import AdminEvents from "./features/events/AdminEvents";
import EventForm from "./features/events/EventForm";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Restore auth state from localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch(setCredentials({ user, token }));
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    
    // Fetch dynamic enums on app load (will use static fallback if not admin)
    dispatch(fetchEnums());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/committee" element={<Committee />} />

        {/* Complete Profile Route - Must be accessible even if profile not completed */}
        <Route element={<ProtectedRoute skipProfileCheck={true} />}>
          <Route path="/complete-profile" element={<CompleteProfile />} />
        </Route>

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<UpdateProfile />} />
          <Route path="/profile/change-password" element={<ChangePassword />} />
          <Route path="/family-connections" element={<FamilyConnections />} />
          <Route path="/family-members/:subFamilyNumber?" element={<FamilyMembersList />} />
          <Route path="/search" element={<FamilySearch />} />
        </Route>

        {/* Protected Admin Routes - Using Permissions */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="canApproveUsers" />}>
          <Route path="/admin/pending" element={<PendingUsers />} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="canViewUsers" />}>
          <Route path="/admin/approved" element={<ApprovedUsers />} />
          <Route path="/admin/rejected" element={<RejectedUsers />} />
          <Route path="/admin/all-users" element={<AllUsersManagement />} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="canApproveFamilyMembers" />}>
          <Route path="/admin/pending-family" element={<PendingFamilyMembers />} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="canViewPendingFamilyMembers" />}>
          <Route path="/admin/family-member-requests" element={<FamilyMemberRequests />} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="canViewActivityLogs" />}>
          <Route path="/admin/activity-logs" element={<ActivityLog />} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="canManageEnums" />}>
          <Route path="/admin/enums" element={<EnumManagement />} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="canManageRoles" />}>
          <Route path="/admin/roles" element={<RoleManagement />} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="canViewUsers" />}>
          <Route path="/admin/deleted-users" element={<DeletedUsers />} />
        </Route>

        {/* Event Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/events" element={<EventList />} />
          <Route path="/events/:id" element={<EventDetail />} />
        </Route>
        
        {/* Admin Event Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/events/create" element={<EventForm />} />
          <Route path="/admin/events/:id/edit" element={<EventForm />} />
        </Route>

        {/* Default Route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Page not found</p>
                <a
                  href="/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Go to Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
