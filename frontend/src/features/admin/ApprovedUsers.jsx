import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getApprovedUsers,
  getUserById,
  clearError,
  setSelectedUser,
  clearSelectedUser,
  approveUser,
  rejectUser,
  deleteUser,
  getFamilyMembers,
  transferPrimaryAccount,
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
import { usePermission } from "../../hooks/usePermission";
import axiosInstance from "../../api/axiosConfig";

const ApprovedUsers = () => {
  const dispatch = useDispatch();
  const {
    approvedUsers,
    currentPage,
    totalPages,
    total,
    isLoading,
    error,
    selectedUser,
    familyMembers,
  } = useSelector((state) => state.admin);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [deleteDependentData, setDeleteDependentData] = useState(false);
  const [transferPrimaryTo, setTransferPrimaryTo] = useState("");
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Permission checks
  const canManageUsers = usePermission("canManageUsers");

  useEffect(() => {
    dispatch(getApprovedUsers({ page: currentPage.approved, limit: 20 }));
  }, [dispatch, currentPage.approved]);

  const handlePageChange = (page) => {
    dispatch(getApprovedUsers({ page, limit: 20, search: searchQuery }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    dispatch(getApprovedUsers({ page: 1, limit: 20, search: searchInput }));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    dispatch(getApprovedUsers({ page: 1, limit: 20 }));
  };

  // Filter users locally for instant search
  const filteredUsers = searchQuery
    ? approvedUsers.filter((user) => {
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
    : approvedUsers;

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
    dispatch(getApprovedUsers({ page: currentPage.approved, limit: 20 }));
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
          dispatch(getApprovedUsers({ page: currentPage.approved, limit: 20 }));
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
    if (!window.confirm("Are you sure you want to reject this approved user? They will lose access to the system.")) {
      return;
    }
    try {
      const result = await dispatch(rejectUser(userId));
      if (rejectUser.fulfilled.match(result)) {
        toast.success("User rejected successfully!");
        // Close modal first
        setShowModal(false);
        // Delay state updates to allow modal to fully unmount
        setTimeout(() => {
          dispatch(clearSelectedUser());
          dispatch(getApprovedUsers({ page: currentPage.approved, limit: 20 }));
        }, 300);
      } else {
        toast.error(result.payload || "Failed to reject user");
      }
    } catch (error) {
      toast.error("Failed to reject user");
      // Ensure modal closes even on error
      setShowModal(false);
      setTimeout(() => {
        dispatch(clearSelectedUser());
      }, 300);
    }
  };

  const handleDelete = async (user) => {
    setUserToDelete(user);
    setTransferPrimaryTo("");
    setSelectedFamilyMembers([]);
    // Fetch family members if user has subFamilyNumber
    if (user.subFamilyNumber) {
      try {
        await dispatch(getFamilyMembers(user.subFamilyNumber));
      } catch (error) {
        console.error("Failed to fetch family members:", error);
      }
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      let wasPrimaryAccount = userToDelete.isPrimaryAccount;
      let shouldDeleteDependentData = deleteDependentData;

      // If primary account and has family members, transfer primary first
      if (userToDelete.isPrimaryAccount && familyMembers && familyMembers.length > 1) {
        if (!transferPrimaryTo && !deleteDependentData) {
          toast.error("Please transfer primary account or select to delete all family members");
          return;
        }

        // Transfer primary account if selected
        if (transferPrimaryTo) {
          const transferResult = await dispatch(transferPrimaryAccount({
            userId: userToDelete._id,
            newPrimaryUserId: transferPrimaryTo,
            reason: `Transferring primary account before deletion: ${deletionReason || "User deletion"}`,
          }));

          if (transferPrimaryAccount.rejected.match(transferResult)) {
            toast.error(transferResult.payload || "Failed to transfer primary account");
            return;
          }
          toast.success("Primary account transferred successfully");
          
          // After transfer, user is no longer primary, so we don't need to delete dependent data for family
          // unless explicitly selected
          wasPrimaryAccount = false;
          // Only delete dependent data if explicitly selected (not required after transfer)
          shouldDeleteDependentData = deleteDependentData;
        }
      }

      // Now proceed with deletion
      // After transfer, deleteDependentData is only needed if explicitly selected
      const result = await dispatch(deleteUser({
        userId: userToDelete._id,
        deletionReason,
        deleteDependentData: shouldDeleteDependentData,
      }));

      if (deleteUser.fulfilled.match(result)) {
        toast.success("User deleted successfully!");
        setShowDeleteModal(false);
        setUserToDelete(null);
        setDeletionReason("");
        setDeleteDependentData(false);
        setTransferPrimaryTo("");
        setSelectedFamilyMembers([]);
        // Delay refetch to allow modal to close
        setTimeout(() => {
          dispatch(getApprovedUsers({ page: currentPage.approved, limit: 20 }));
        }, 300);
      } else {
        // Check if error is about dependencies
        const errorMessage = result.payload || "Failed to delete user";
        if (errorMessage.includes("dependent data") || errorMessage.includes("family members")) {
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setTimeout(() => {
      setUserToDelete(null);
      setDeletionReason("");
      setDeleteDependentData(false);
      setTransferPrimaryTo("");
      setSelectedFamilyMembers([]);
    }, 300);
  };

  const handleSelectAllFamilyMembers = (checked) => {
    if (checked) {
      const otherMembers = familyMembers.filter((fm) => fm._id !== userToDelete._id);
      setSelectedFamilyMembers(otherMembers.map((fm) => fm._id));
      setDeleteDependentData(true);
    } else {
      setSelectedFamilyMembers([]);
      setDeleteDependentData(false);
    }
  };

  const handleToggleFamilyMember = (memberId) => {
    if (selectedFamilyMembers.includes(memberId)) {
      setSelectedFamilyMembers(selectedFamilyMembers.filter((id) => id !== memberId));
      if (selectedFamilyMembers.length === 1) {
        setDeleteDependentData(false);
      }
    } else {
      setSelectedFamilyMembers([...selectedFamilyMembers, memberId]);
      if (selectedFamilyMembers.length === familyMembers.filter((fm) => fm._id !== userToDelete._id).length - 1) {
        setDeleteDependentData(true);
      }
    }
  };


  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          <div className="flex flex-col gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Approved Users ({searchQuery ? filteredUsers.length : total.approved})
            </h1>

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
                No approved users found.
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
                          Account Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approved
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
                            <div className="flex items-center gap-2">
                              {user.isPrimaryAccount === true ? (
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Primary Account
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  Family Member
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(user.updatedAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="danger"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(user);
                                }}
                                className="text-xs"
                              >
                                Delete
                              </Button>
                              <Button
                                variant="outline"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleViewDetails(user._id);
                                }}
                                className="text-xs"
                              >
                                View Details
                              </Button>
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
                      {(() => {
                        const profileImageUrl = typeof user.profileImage === 'string' ? user.profileImage : null;
                        return profileImageUrl ? (
                          <img
                            src={profileImageUrl}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xl text-gray-400">
                              {user.firstName?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                        );
                      })()}
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">
                          {getFullName(user)}
                          {user.isPrimaryAccount && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {user.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.mobileNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Approved: {formatDate(user.updatedAt)}
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
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <Button
                            variant="danger"
                            onClick={() => handleDelete(user)}
                            className="text-xs flex-1"
                          >
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleViewDetails(user._id);
                            }}
                            className="text-xs flex-1"
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
              {totalPages.approved > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage.approved}
                    totalPages={totalPages.approved}
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

          {/* Delete Confirmation Modal */}
          {showDeleteModal && userToDelete && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={handleCloseDeleteModal}
            >
              <div
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Delete User
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to permanently delete{" "}
                    <strong>{getFullName(userToDelete)}</strong>? This action
                    cannot be undone.
                  </p>

                  {/* Primary Account Transfer Option */}
                  {userToDelete.isPrimaryAccount && familyMembers && familyMembers.length > 1 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-blue-800 font-semibold mb-3">
                        🔄 This is a Primary Account with {familyMembers.length - 1} family member(s)
                      </p>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Transfer Primary Account to:
                        </label>
                        <select
                          value={transferPrimaryTo}
                          onChange={(e) => setTransferPrimaryTo(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={deleteDependentData}
                        >
                          <option value="">Select a family member...</option>
                          {familyMembers
                            .filter((fm) => fm._id !== userToDelete._id && !fm.isPrimaryAccount)
                            .map((fm) => (
                              <option key={fm._id} value={fm._id}>
                                {getFullName(fm)} {fm.email ? `(${fm.email})` : ""}
                              </option>
                            ))}
                        </select>
                        <p className="text-xs text-blue-700 mt-1">
                          Select a family member to transfer primary account ownership before deletion
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Family Members Selection */}
                  {familyMembers && familyMembers.length > 1 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-yellow-800 font-semibold">
                          ⚠️ Family Members ({familyMembers.length - 1}):
                        </p>
                        {!userToDelete.isPrimaryAccount || transferPrimaryTo ? (
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={deleteDependentData}
                              onChange={(e) => handleSelectAllFamilyMembers(e.target.checked)}
                              className="mr-2"
                              disabled={userToDelete.isPrimaryAccount && !transferPrimaryTo}
                            />
                            <span className="text-yellow-800 text-sm">
                              Select All Family Members
                            </span>
                          </label>
                        ) : null}
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {familyMembers
                          .filter((fm) => fm._id !== userToDelete._id)
                          .map((fm) => (
                            <label
                              key={fm._id}
                              className="flex items-center p-2 bg-white rounded border border-yellow-200 cursor-pointer hover:bg-yellow-100"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFamilyMembers.includes(fm._id) || deleteDependentData}
                                onChange={() => handleToggleFamilyMember(fm._id)}
                                className="mr-3"
                                disabled={
                                  (userToDelete.isPrimaryAccount && !transferPrimaryTo) ||
                                  deleteDependentData
                                }
                              />
                              <div className="flex-1">
                                <span className="text-yellow-900 font-medium">
                                  {getFullName(fm)}
                                </span>
                                {fm.email && (
                                  <span className="text-yellow-700 text-sm ml-2">
                                    ({fm.email})
                                  </span>
                                )}
                                {fm.isPrimaryAccount && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    Primary
                                  </span>
                                )}
                              </div>
                            </label>
                          ))}
                      </div>
                      {!transferPrimaryTo && userToDelete.isPrimaryAccount && (
                        <p className="text-xs text-yellow-700 mt-2">
                          ⚠️ You must transfer primary account first or select to delete all family members
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deletion Reason (Optional)
                    </label>
                    <textarea
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Enter reason for deletion..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCloseDeleteModal}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleConfirmDelete}
                      disabled={isLoading}
                    >
                      {isLoading ? "Deleting..." : "Delete User"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default ApprovedUsers;

