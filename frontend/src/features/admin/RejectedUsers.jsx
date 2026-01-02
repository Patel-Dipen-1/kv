import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getRejectedUsers,
  getUserById,
  clearError,
  setSelectedUser,
  clearSelectedUser,
  approveUser,
  rejectUser,
} from "./adminSlice";
import { toast } from "react-toastify";
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
  getRoleDisplay,
  getRoleBadgeColor,
  getPositionBadgeColor,
} from "../../utils/helpers";

const RejectedUsers = () => {
  const dispatch = useDispatch();
  const {
    rejectedUsers,
    currentPage,
    totalPages,
    total,
    isLoading,
    error,
    selectedUser,
  } = useSelector((state) => state.admin);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    dispatch(getRejectedUsers({ page: currentPage.rejected, limit: 20 }));
  }, [dispatch, currentPage.rejected]);

  const handlePageChange = (page) => {
    dispatch(getRejectedUsers({ page, limit: 20, search: searchQuery }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    dispatch(getRejectedUsers({ page: 1, limit: 20, search: searchInput }));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    dispatch(getRejectedUsers({ page: 1, limit: 20 }));
  };

  // Filter users locally for instant search
  const filteredUsers = searchQuery
    ? rejectedUsers.filter((user) => {
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
    : rejectedUsers;

  const handleViewDetails = async (userId) => {
    await dispatch(getUserById(userId));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Delay clearing selected user to allow modal to fully close
    setTimeout(() => {
      dispatch(clearSelectedUser());
    }, 300);
  };

  const handleRoleUpdate = () => {
    dispatch(getRejectedUsers({ page: currentPage.rejected, limit: 20 }));
  };

  const handleApprove = async (userId) => {
    try {
      const result = await dispatch(approveUser(userId));
      if (approveUser.fulfilled.match(result)) {
        toast.success("User approved successfully!");
        // Close modal first
        setShowModal(false);
        // Delay state updates to allow modal to fully unmount
        setTimeout(() => {
          dispatch(clearSelectedUser());
          dispatch(getRejectedUsers({ page: currentPage.rejected, limit: 20 }));
        }, 300);
      } else {
        toast.error(result.payload || "Failed to approve user");
      }
    } catch (error) {
      toast.error("Failed to approve user");
      // Ensure modal closes even on error
      setShowModal(false);
      setTimeout(() => {
        dispatch(clearSelectedUser());
      }, 300);
    }
  };

  const handleReject = async (userId) => {
    // User is already rejected, no need to reject again
    toast.info("User is already rejected");
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Rejected Users ({total.rejected})
          </h1>

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
                No rejected users found.
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
                          Rejected
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
                              {formatDate(user.updatedAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="outline"
                              onClick={() => handleViewDetails(user._id)}
                              className="text-xs"
                            >
                              View Details
                            </Button>
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
                          Rejected: {formatDate(user.updatedAt)}
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
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            onClick={() => handleViewDetails(user._id)}
                            className="text-xs w-full"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages.rejected > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage.rejected}
                    totalPages={totalPages.rejected}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}

          {showModal && selectedUser && (
            <UserDetailModal
              key={selectedUser._id}
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

export default RejectedUsers;

