import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { useEnums } from "../../hooks/useEnums";
import { usePermission } from "../../hooks/usePermission";
import { Menu, X, User, LogOut, Network, Users, Calendar } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get dynamic enums
  const USER_ROLES = useEnums("USER_ROLES");
  
  // Permission checks - all hooks must be called unconditionally
  const canViewUsers = usePermission("canViewUsers");
  const canViewCommittee = usePermission("canViewCommittee");
  const canApproveUsers = usePermission("canApproveUsers");
  const canViewReports = usePermission("canViewReports");
  const canManageSettings = usePermission("canManageSettings");
  const canManageRoles = usePermission("canManageRoles");
  
  // Check if user has any admin permissions (admin/moderator)
  const hasAdminPermissions = canViewUsers || canApproveUsers || canViewReports || 
    canManageSettings || canManageRoles;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setIsUserMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === "/family-members") {
      return location.pathname.startsWith("/family-members");
    }
    return location.pathname === path;
  };

  // Base nav links for all authenticated users
  const baseNavLinks = [
    { path: "/profile", label: "Profile", icon: User, show: isAuthenticated },
    { path: "/events", label: "Events", icon: Calendar, show: isAuthenticated },
    { 
      path: "/family-connections", 
      label: "Family Connections", 
      icon: Network, 
      show: isAuthenticated 
    },
    { 
      path: `/family-members${user?.subFamilyNumber ? `/${user.subFamilyNumber}` : ""}`, 
      label: "Family Members", 
      icon: Users, 
      show: isAuthenticated && user?.subFamilyNumber 
    },
    { path: "/committee", label: "Committee", icon: null, show: true }, // Public link
  ];

  // Admin link (only show if has admin permissions)
  const adminLink = {
    path: "/admin/dashboard",
    label: "Admin",
    icon: null,
    show: isAuthenticated && hasAdminPermissions,
  };

  // Combine all nav links
  const navLinks = [
    ...baseNavLinks,
    ...(adminLink.show ? [adminLink] : []),
  ].filter((link) => link.show);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-blue-600">
              Family Community
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center gap-2 ${
                    isActive(link.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {Icon && <Icon size={18} />}
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 min-h-[44px]"
                >
                  <User size={20} />
                  <span className="hidden lg:inline">
                    {user?.firstName || "User"}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 min-h-[44px] flex items-center"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User size={16} className="mr-2" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 min-h-[44px] flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px] flex items-center"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium min-h-[44px] flex items-center gap-2 ${
                    isActive(link.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {Icon && <Icon size={20} />}
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 min-h-[44px] flex items-center"
                >
                  <User size={20} className="mr-2" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 min-h-[44px] flex items-center"
                >
                  <LogOut size={20} className="mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 bg-blue-600 text-white rounded-md text-base font-medium hover:bg-blue-700 min-h-[44px] flex items-center justify-center"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

