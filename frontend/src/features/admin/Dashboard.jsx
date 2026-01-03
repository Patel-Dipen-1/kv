import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getUserStats, getPendingUsers, approveUser, rejectUser } from "./adminSlice";
import { usePermission } from "../../hooks/usePermission";
import {
  exportAllUsers,
  exportPendingUsers,
  exportCommitteeMembers,
} from "../../utils/exportUtils";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { Users, Clock, CheckCircle, XCircle, Download, UserCheck, UserX } from "lucide-react";
import { toast } from "react-toastify";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, pendingUsers, isLoading, error } = useSelector((state) => state.admin);
  
  // Permission checks
  const canApproveUsers = usePermission("canApproveUsers");
  const canViewUsers = usePermission("canViewUsers");
  const canViewReports = usePermission("canViewReports");
  const canViewStats = usePermission("canViewStats");
  const canExportData = usePermission("canExportData");

  useEffect(() => {
    // Always fetch stats for admin dashboard (even without specific permission)
    dispatch(getUserStats());
    // Load first 5 pending users for quick actions (if has permission)
    if (canApproveUsers) {
      dispatch(getPendingUsers({ page: 1, limit: 5 }));
    }
  }, [dispatch, canApproveUsers]);

  const statCards = [
    {
      title: "Pending Approvals",
      value: stats.pending || 0,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800",
      link: "/admin/pending",
    },
    {
      title: "Approved Users",
      value: stats.approved || 0,
      icon: CheckCircle,
      color: "bg-green-100 text-green-800",
      link: "/admin/approved",
    },
    {
      title: "Rejected Users",
      value: stats.rejected || 0,
      icon: XCircle,
      color: "bg-red-100 text-red-800",
      link: "/admin/rejected",
    },
    {
      title: "Total Users",
      value: stats.total || 0,
      icon: Users,
      color: "bg-blue-100 text-blue-800",
      link: "/admin/approved",
    },
    {
      title: "Total Families",
      value: stats.totalFamilies || 0,
      icon: Users,
      color: "bg-purple-100 text-purple-800",
      link: "/admin/approved",
    },
    {
      title: "Family Members",
      value: stats.totalFamilyMembers || 0,
      icon: Users,
      color: "bg-indigo-100 text-indigo-800",
      link: "/admin/pending-family",
    },
  ];

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

          {error && (
            <ErrorAlert message={error} className="mb-4" />
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.title} to={stat.link}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.color}`}>
                        <Icon size={32} />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Quick Approve/Reject - Recent Pending Users */}
          {pendingUsers && pendingUsers.length > 0 && (
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions - Recent Pending Users
              </h2>
              <div className="space-y-3">
                {pendingUsers.slice(0, 5).map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    {canApproveUsers && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            try {
                              const result = await dispatch(approveUser(user._id));
                              if (approveUser.fulfilled.match(result)) {
                                toast.success("User approved successfully!");
                                dispatch(getUserStats());
                                dispatch(getPendingUsers({ page: 1, limit: 5 }));
                              } else {
                                toast.error(result.payload || "Failed to approve");
                              }
                            } catch (error) {
                              toast.error("Failed to approve user");
                            }
                          }}
                          isLoading={isLoading}
                          className="flex items-center gap-1"
                        >
                          <UserCheck size={16} />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={async () => {
                            if (!window.confirm(`Reject ${user.firstName} ${user.lastName}?`)) {
                              return;
                            }
                            try {
                              const result = await dispatch(rejectUser(user._id));
                              if (rejectUser.fulfilled.match(result)) {
                                toast.success("User rejected successfully!");
                                dispatch(getUserStats());
                                dispatch(getPendingUsers({ page: 1, limit: 5 }));
                              } else {
                                toast.error(result.payload || "Failed to reject");
                              }
                            } catch (error) {
                              toast.error("Failed to reject user");
                            }
                          }}
                          isLoading={isLoading}
                          className="flex items-center gap-1"
                        >
                          <UserX size={16} />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {stats.pending > 5 && (
                  <Link
                    to="/admin/pending"
                    className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2"
                  >
                    View all {stats.pending} pending users →
                  </Link>
                )}
              </div>
            </Card>
          )}

          {/* Quick Links */}
          {(canApproveUsers || canViewUsers) && (
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {canApproveUsers && (
                  <Link
                    to="/admin/pending"
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
                  >
                    <Clock size={20} className="mr-2 text-yellow-600" />
                    View Pending Users
                  </Link>
                )}
                {canViewUsers && (
                  <>
                    <Link
                      to="/admin/approved"
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
                    >
                      <CheckCircle size={20} className="mr-2 text-green-600" />
                      View Approved Users
                    </Link>
                    <Link
                      to="/admin/rejected"
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
                    >
                      <XCircle size={20} className="mr-2 text-red-600" />
                      View Rejected Users
                    </Link>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Export Data */}
          {canExportData && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Export Data
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await exportAllUsers();
                      toast.success("All users exported successfully!");
                    } catch (error) {
                      toast.error(error.message || "Failed to export users");
                    }
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Export All Users
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await exportPendingUsers();
                      toast.success("Pending users exported successfully!");
                    } catch (error) {
                      toast.error(error.message || "Failed to export pending users");
                    }
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Export Pending Users
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await exportCommitteeMembers();
                      toast.success("Committee members exported successfully!");
                    } catch (error) {
                      toast.error(error.message || "Failed to export committee members");
                    }
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Export Committee
                </Button>
                <Link to="/admin/pending-family">
                  <Button
                    variant="outline"
                    fullWidth
                    className="flex items-center justify-center gap-2"
                  >
                    <Users size={18} />
                    Pending Family
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

