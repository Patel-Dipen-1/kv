import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Clock, CheckCircle, XCircle, Menu, X, Users, History, Settings, Shield, Calendar, UserX, Network } from "lucide-react";
import { usePermission } from "../../hooks/usePermission";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Permission checks
  const canViewUsers = usePermission("canViewUsers");
  const canApproveUsers = usePermission("canApproveUsers");
  const canViewFamilyMembers = usePermission("canViewFamilyMembers");
  const canApproveFamilyMembers = usePermission("canApproveFamilyMembers");
  const canViewPendingFamilyMembers = usePermission("canViewPendingFamilyMembers");
  const canViewReports = usePermission("canViewReports");
  const canManageSettings = usePermission("canManageSettings");
  const canManageRoles = usePermission("canManageRoles");
  const canViewEvents = usePermission("canViewEvents");

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { 
      path: "/admin/dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      show: true, // Always show dashboard
    },
    { 
      path: "/events", 
      label: "Events", 
      icon: Calendar,
      show: true, // All logged-in users can view events
    },
    { 
      path: "/admin/pending", 
      label: "Pending Users", 
      icon: Clock,
      show: canApproveUsers, // Only if can approve users
    },
    { 
      path: "/admin/approved", 
      label: "Approved Users", 
      icon: CheckCircle,
      show: canViewUsers, // Only if can view users
    },
    { 
      path: "/admin/rejected", 
      label: "Rejected Users", 
      icon: XCircle,
      show: canViewUsers, // Only if can view users
    },
    { 
      path: "/admin/pending-family", 
      label: "Pending Family", 
      icon: Users,
      show: canApproveFamilyMembers, // Only if can approve family members
    },
    { 
      path: "/admin/activity-logs", 
      label: "Activity Log", 
      icon: History,
      show: canViewReports, // Only if can view reports
    },
    { 
      path: "/admin/enums", 
      label: "Enum Management", 
      icon: Settings,
      show: canManageSettings, // Only if can manage settings
    },
    { 
      path: "/admin/roles", 
      label: "Role Management", 
      icon: Shield,
      show: canManageRoles, // Only if can manage roles
    },
    { 
      path: "/admin/deleted-users", 
      label: "Deleted Users", 
      icon: UserX,
      show: canViewUsers, // Only if can view users
    },
    { 
      path: "/family-connections", 
      label: "Family Connections", 
      icon: Network,
      show: true, // All logged-in users can access
    },
  ].filter(item => item.show); // Filter out items user doesn't have permission for

  return (
    <>
      {/* Mobile toggle button - Only show on admin pages, hide on mobile when Navbar menu is open */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-20 left-4 z-40 p-2 bg-white rounded-md shadow-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 w-64`}
      >
        <nav className="p-4 space-y-2">
          {menuItems.length > 0 ? (
            menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] ${
                    isActive(item.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No menu items available</p>
              <p className="text-xs mt-2">You don't have permissions for any admin features</p>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

