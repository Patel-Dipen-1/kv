import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getActivityLogs } from "./adminSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Pagination from "../../components/common/Pagination";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { formatDate, getFullName } from "../../utils/helpers";
import { Filter, Calendar } from "lucide-react";

const ActivityLog = () => {
  const dispatch = useDispatch();
  const { activityLogs = [], isLoading, error, currentPage = {}, totalPages = {}, total = {} } = useSelector(
    (state) => state.admin
  );
  const [actionTypeFilter, setActionTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    dispatch(
      getActivityLogs({
        page: currentPage.activityLogs || 1,
        limit: 20,
        actionType: actionTypeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
    );
  }, [dispatch, currentPage.activityLogs, actionTypeFilter, startDate, endDate]);

  const handlePageChange = (page) => {
    dispatch(
      getActivityLogs({
        page,
        limit: 20,
        actionType: actionTypeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
    );
  };

  const getActionTypeColor = (actionType) => {
    const colors = {
      user_approved: "bg-green-100 text-green-800",
      user_rejected: "bg-red-100 text-red-800",
      role_changed: "bg-blue-100 text-blue-800",
      committee_assigned: "bg-purple-100 text-purple-800",
      family_member_approved: "bg-green-100 text-green-800",
      family_member_rejected: "bg-red-100 text-red-800",
      user_deactivated: "bg-gray-100 text-gray-800",
      user_activated: "bg-green-100 text-green-800",
      password_changed: "bg-yellow-100 text-yellow-800",
    };
    return colors[actionType] || "bg-gray-100 text-gray-800";
  };

  const formatActionType = (actionType) => {
    return actionType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Activity Log ({total.activityLogs || 0})
          </h1>

          {error && (
            <ErrorAlert message={error} className="mb-4" />
          )}

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  value={actionTypeFilter}
                  onChange={(e) => setActionTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                >
                  <option value="">All Actions</option>
                  <option value="user_approved">User Approved</option>
                  <option value="user_rejected">User Rejected</option>
                  <option value="role_changed">Role Changed</option>
                  <option value="committee_assigned">Committee Assigned</option>
                  <option value="family_member_approved">Family Member Approved</option>
                  <option value="family_member_rejected">Family Member Rejected</option>
                  <option value="user_deactivated">User Deactivated</option>
                  <option value="password_changed">Password Changed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionTypeFilter("");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </Card>

          {isLoading && (!activityLogs || activityLogs.length === 0) ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : !activityLogs || activityLogs.length === 0 ? (
            <Card>
              <p className="text-center text-gray-600 py-8">
                No activity logs found.
              </p>
            </Card>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto mb-6">
                <Card padding={false}>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Performed By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activityLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(
                                log.actionType
                              )}`}
                            >
                              {formatActionType(log.actionType)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.performedBy
                              ? getFullName(log.performedBy)
                              : "System"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.targetUser
                              ? getFullName(log.targetUser)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {log.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 mb-6">
                {activityLogs.map((log) => (
                  <Card key={log._id}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(
                            log.actionType
                          )}`}
                        >
                          {formatActionType(log.actionType)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        <p>
                          By:{" "}
                          {log.performedBy
                            ? getFullName(log.performedBy)
                            : "System"}
                        </p>
                        {log.targetUser && (
                          <p>
                            Target: {getFullName(log.targetUser)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages.activityLogs > 1 && (
                <Pagination
                  currentPage={currentPage.activityLogs || 1}
                  totalPages={totalPages.activityLogs || 1}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ActivityLog;

