import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  bulkApproveUsers,
  bulkRejectUsers,
  getUserById,
  clearError,
  setSelectedUser,
  clearSelectedUser,
} from "./adminSlice";
import { usePermission } from "../../hooks/usePermission";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Pagination from "../../components/common/Pagination";
import UserDetailModal from "./UserDetailModal";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import {
  formatDate,
  getFullName,
  getStatusColor,
  getRoleDisplay,
  getRoleBadgeColor,
  getPositionBadgeColor,
} from "../../utils/helpers";
import { exportPendingUsers } from "../../utils/exportUtils";
import { toast } from "react-toastify";
import { Download } from "lucide-react";

const PendingUsers = () => {
  const dispatch = useDispatch();
  const {
    pendingUsers,
    currentPage,
    totalPages,
    total,
    isLoading,
    error,
    selectedUser,
  } = useSelector((state) => state.admin);
  const [showModal, setShowModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Permission checks
  const canApproveUsers = usePermission("canApproveUsers");
  const canRejectUsers = usePermission("canRejectUsers"); // Use canRejectUsers permission
  const canBulkApproveUsers = usePermission("canBulkApproveUsers");
  const canBulkRejectUsers = usePermission("canBulkRejectUsers");
  const canExportData = usePermission("canExportData");

  useEffect(() => {
    dispatch(getPendingUsers({ page: currentPage.pending, limit: 20 }));
  }, [dispatch, currentPage.pending]);

  // Clear selections when users list changes
  useEffect(() => {
    setSelectedUsers([]);
  }, [pendingUsers]);

  const handlePageChange = (page) => {
    dispatch(getPendingUsers({ page, limit: 20, search: searchQuery }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    dispatch(getPendingUsers({ page: 1, limit: 20, search: searchInput }));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    dispatch(getPendingUsers({ page: 1, limit: 20 }));
  };

  // Filter users locally for instant search (or use backend search)
  const filteredUsers = searchQuery
    ? pendingUsers.filter((user) => {
        const query = searchQuery.toLowerCase();
        const fullName = getFullName(user).toLowerCase();
        const email = (user.email || "").toLowerCase();
        const mobile = (user.mobileNumber || "").toLowerCase();
        const subFamily = (user.subFamilyNumber || "").toLowerCase();
        return (
          fullName.includes(query) ||
          email.includes(query) ||
          mobile.includes(query) ||
          subFamily.includes(query)
        );
      })
    : pendingUsers;

  const handleViewDetails = async (userId) => {
    await dispatch(getUserById(userId));
    setShowModal(true);
  };

  const handleApprove = async (userId) => {
    try {
      const result = await dispatch(approveUser(userId));
      if (approveUser.fulfilled.match(result)) {
        toast.success("User approved successfully!");
        
        // Close modal first, then update state
        setShowModal(false);
        
        // Use setTimeout to ensure modal closes before state updates
        setTimeout(() => {
          dispatch(clearSelectedUser());
          
          // Auto-redirect: If there's a next pending user, show it in modal
          if (result.payload.nextPendingUser) {
            dispatch(getUserById(result.payload.nextPendingUser._id)).then(() => {
              setShowModal(true);
            });
          } else {
            // No more pending users, refresh list
            dispatch(getPendingUsers({ page: currentPage.pending, limit: 20 }));
          }
        }, 100);
      } else {
        toast.error(result.payload || "Failed to approve user");
      }
    } catch (error) {
      toast.error("Failed to approve user");
      setShowModal(false);
      setTimeout(() => {
        dispatch(clearSelectedUser());
      }, 100);
    }
  };

  const handleReject = async (userId) => {
    try {
      const result = await dispatch(rejectUser(userId));
      if (rejectUser.fulfilled.match(result)) {
        toast.success("User rejected successfully!");
        
        // Close modal first, then update state
        setShowModal(false);
        
        // Use setTimeout to ensure modal closes before state updates
        setTimeout(() => {
          dispatch(clearSelectedUser());
          dispatch(getPendingUsers({ page: currentPage.pending, limit: 20 }));
        }, 100);
      } else {
        toast.error(result.payload || "Failed to reject user");
      }
    } catch (error) {
      toast.error("Failed to reject user");
      setShowModal(false);
      setTimeout(() => {
        dispatch(clearSelectedUser());
      }, 100);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Delay clearing selected user to avoid DOM conflicts
    setTimeout(() => {
      dispatch(clearSelectedUser());
    }, 100);
  };

  const handleRoleUpdate = () => {
    dispatch(getPendingUsers({ page: currentPage.pending, limit: 20 }));
    setShowModal(false);
    dispatch(clearSelectedUser());
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === pendingUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(pendingUsers.map((u) => u._id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) {
      toast.warning("Please select at least one user");
      return;
    }

    try {
      const result = await dispatch(bulkApproveUsers(selectedUsers));
      if (bulkApproveUsers.fulfilled.match(result)) {
        toast.success(`${result.payload.modifiedCount} user(s) approved successfully!`);
        setSelectedUsers([]);
        // Delay refetch to avoid DOM conflicts
        setTimeout(() => {
          dispatch(getPendingUsers({ page: currentPage.pending, limit: 20 }));
        }, 100);
      } else {
        toast.error(result.payload || "Failed to approve users");
      }
    } catch (error) {
      toast.error("Failed to approve users");
    }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.length === 0) {
      toast.warning("Please select at least one user");
      return;
    }

    if (!window.confirm(`Are you sure you want to reject ${selectedUsers.length} user(s)?`)) {
      return;
    }

    try {
      const result = await dispatch(bulkRejectUsers(selectedUsers));
      if (bulkRejectUsers.fulfilled.match(result)) {
        toast.success(`${result.payload.modifiedCount} user(s) rejected successfully!`);
        setSelectedUsers([]);
        // Delay refetch to avoid DOM conflicts
        setTimeout(() => {
          dispatch(getPendingUsers({ page: currentPage.pending, limit: 20 }));
        }, 100);
      } else {
        toast.error(result.payload || "Failed to reject users");
      }
    } catch (error) {
      toast.error("Failed to reject users");
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Pending Users ({searchQuery ? filteredUsers.length : total.pending})
              </h1>
              <div className="flex flex-wrap gap-2">
              {selectedUsers.length > 0 && (canBulkApproveUsers || canBulkRejectUsers) && (
                <>
                  {canBulkApproveUsers && (
                    <Button
                      variant="primary"
                      onClick={handleBulkApprove}
                      isLoading={isLoading}
                      className="flex items-center gap-2"
                    >
                      Approve Selected ({selectedUsers.length})
                    </Button>
                  )}
                  {canBulkRejectUsers && (
                    <Button
                      variant="danger"
                      onClick={handleBulkReject}
                      isLoading={isLoading}
                      className="flex items-center gap-2"
                    >
                      Reject Selected ({selectedUsers.length})
                    </Button>
                  )}
                </>
              )}
              {canExportData && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await exportPendingUsers();
                      toast.success("Pending users exported successfully!");
                    } catch (error) {
                      toast.error(error.message || "Failed to export");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Download size={18} />
                  Export CSV
                </Button>
              )}
              </div>
            </div>

            {/* Search Bar */}
            <Card className="p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, email, phone, or sub-family number..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit" variant="primary">
                  Search
                </Button>
                {searchQuery && (
                  <Button type="button" variant="outline" onClick={handleClearSearch}>
                    Clear
                  </Button>
                )}
              </form>
            </Card>
          </div>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
              className="mb-4"
            />
          )}

          {isLoading && filteredUsers.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <p className="text-center text-gray-600 py-8">
                No pending users found.
              </p>
            </Card>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Card padding={false}>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === pendingUsers.length && pendingUsers.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 min-w-[20px] min-h-[20px]"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mobile
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role / Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user._id)}
                              onChange={() => handleSelectUser(user._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 min-w-[20px] min-h-[20px]"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getFullName(user)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {user.mobileNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-2">
                              {(() => {
                                const { role, position } = getRoleDisplay(user);
                                return (
                                  <>
                                    <span
                                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                        role
                                      )}`}
                                    >
                                      {role}
                                    </span>
                                    {position && (
                                      <span
                                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPositionBadgeColor(
                                          position
                                        )}`}
                                      >
                                        {position}
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => handleViewDetails(user._id)}
                                className="text-xs"
                              >
                                View
                              </Button>
                              {canApproveUsers && (
                                <Button
                                  variant="primary"
                                  onClick={() => handleApprove(user._id)}
                                  isLoading={isLoading}
                                  className="text-xs"
                                >
                                  Approve
                                </Button>
                              )}
                              {canRejectUsers && (
                                <Button
                                  variant="danger"
                                  onClick={() => handleReject(user._id)}
                                  isLoading={isLoading}
                                  className="text-xs"
                                >
                                  Reject
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredUsers.map((user) => (
                  <Card key={user._id}>
                    <div className="flex items-start space-x-4">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xl text-gray-400">
                            {user.firstName?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">
                          {getFullName(user)}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {user.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.mobileNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(user.createdAt)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(() => {
                            const { role, position } = getRoleDisplay(user);
                            return (
                              <>
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                    role
                                  )}`}
                                >
                                  {role}
                                </span>
                                {position && (
                                  <span
                                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPositionBadgeColor(
                                      position
                                    )}`}
                                  >
                                    {position}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleViewDetails(user._id)}
                            className="text-xs flex-1 min-w-[80px]"
                          >
                            View
                          </Button>
                          {canApproveUsers && (
                            <Button
                              variant="primary"
                              onClick={() => handleApprove(user._id)}
                              isLoading={isLoading}
                              className="text-xs flex-1 min-w-[80px]"
                            >
                              Approve
                            </Button>
                          )}
                          {canRejectUsers && (
                            <Button
                              variant="danger"
                              onClick={() => handleReject(user._id)}
                              isLoading={isLoading}
                              className="text-xs flex-1 min-w-[80px]"
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages.pending > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage.pending}
                    totalPages={totalPages.pending}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}

          {showModal && selectedUser && (
            <UserDetailModal
              key={selectedUser._id} // Add key to force remount when user changes
              user={selectedUser}
              onClose={handleCloseModal}
              onApprove={handleApprove}
              onReject={handleReject}
              onRoleUpdate={handleRoleUpdate}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default PendingUsers;

