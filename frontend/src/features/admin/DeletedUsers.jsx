import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { usePermission } from "../../hooks/usePermission";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { toast } from "react-toastify";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  UserX,
  Calendar,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { formatDate } from "../../utils/helpers";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const DeletedUsers = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("soft"); // soft or hard
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteType, setDeleteType] = useState("soft");
  const [deletionReason, setDeletionReason] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  const canDeleteUsers = usePermission("canDeleteUsers");
  const canViewUsers = usePermission("canViewUsers");

  useEffect(() => {
    if (canViewUsers) {
      fetchDeletedUsers();
    }
  }, [activeTab, page, canViewUsers]);

  const fetchDeletedUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/users/deleted?deleteType=${activeTab}&page=${page}&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDeletedUsers(response.data.users || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to fetch deleted users"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSoftDelete = async (userId) => {
    setSelectedUser(deletedUsers.find((u) => u._id === userId));
    setDeleteType("soft");
    setShowDeleteModal(true);
  };

  const handleHardDelete = async (userId) => {
    const userToDelete = deletedUsers.find((u) => u._id === userId);
    setSelectedUser(userToDelete);
    setDeleteType("hard");
    setShowDeleteModal(true);
  };

  const handleRestore = async (userId) => {
    if (!window.confirm("Are you sure you want to restore this user?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/users/${userId}/restore`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("User restored successfully");
      fetchDeletedUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to restore user"
      );
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    if (deleteType === "hard") {
      if (confirmEmail !== selectedUser.email) {
        toast.error("Email confirmation does not match");
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const endpoint =
        deleteType === "soft"
          ? `${API_URL}/users/${selectedUser._id}/soft-delete`
          : `${API_URL}/users/${selectedUser._id}/hard`;

      const payload =
        deleteType === "hard"
          ? {
              deletionReason,
              deleteDependentData: true,
            }
          : { deletionReason };

      await axios({
        method: deleteType === "soft" ? "PATCH" : "DELETE",
        url: endpoint,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(
        deleteType === "soft"
          ? "User soft deleted successfully"
          : "User permanently deleted"
      );
      setShowDeleteModal(false);
      setSelectedUser(null);
      setDeletionReason("");
      setConfirmEmail("");
      fetchDeletedUsers();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to delete user";
      if (error.response?.data?.dependencies) {
        toast.error(
          `User has dependent data: ${JSON.stringify(
            error.response.data.dependencies
          )}`
        );
      } else {
        toast.error(errorMsg);
      }
    }
  };

  if (!canViewUsers) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="min-h-screen bg-gray-50 md:ml-64 p-8">
          <Card>
            <div className="text-center py-12">
              <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don't have permission to view deleted users.
              </p>
            </div>
          </Card>
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Deleted Users Management
            </h1>
          </div>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab("soft");
                setPage(1);
              }}
              className={`px-4 py-2 font-medium ${
                activeTab === "soft"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Soft Deleted ({total})
            </button>
            <button
              onClick={() => {
                setActiveTab("hard");
                setPage(1);
              }}
              className={`px-4 py-2 font-medium ${
                activeTab === "hard"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Deletion Log
            </button>
          </div>

          {/* Content */}
          {isLoading && deletedUsers.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </Card>
          ) : activeTab === "hard" ? (
            <Card>
              <div className="text-center py-12">
                <UserX size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Hard deleted users are permanently removed from the database.
                  Check activity logs for deletion history.
                </p>
              </div>
            </Card>
          ) : deletedUsers.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <UserX size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No soft deleted users found.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {deletedUsers.map((deletedUser) => {
                if (!deletedUser?._id) return null;
                return (
                <Card key={deletedUser._id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <UserX size={24} className="text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {deletedUser.firstName} {deletedUser.lastName}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Mail size={14} className="mr-1" />
                            {deletedUser.email}
                          </span>
                          {deletedUser.mobileNumber && (
                            <span className="flex items-center">
                              <Phone size={14} className="mr-1" />
                              {deletedUser.mobileNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar size={12} className="mr-1" />
                            Deleted: {formatDate(deletedUser.deletedAt)}
                          </span>
                          {deletedUser.deletedBy && (
                            <span className="flex items-center">
                              <User size={12} className="mr-1" />
                              By: {deletedUser.deletedBy.firstName}{" "}
                              {deletedUser.deletedBy.lastName}
                            </span>
                          )}
                        </div>
                        {deletedUser.deletionReason && (
                          <p className="text-xs text-gray-500 mt-1">
                            Reason: {deletedUser.deletionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canDeleteUsers && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleRestore(deletedUser._id)}
                          >
                            <RotateCcw size={16} className="mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleHardDelete(deletedUser._id)}
                          >
                            <Trash2 size={16} className="mr-1" />
                            Hard Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
                );
              })}

              {/* Pagination */}
              {total > 20 && (
                <div className="flex justify-center mt-6">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 text-gray-700">
                      Page {page} of {Math.ceil(total / 20)}
                    </span>
                    <Button
                      variant="secondary"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(total / 20)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {deleteType === "soft" ? "Soft Delete" : "Hard Delete"} User
            </h2>
            <p className="text-gray-600 mb-4">
              {deleteType === "soft"
                ? "User will be hidden but data preserved. Can be restored later."
                : "User and all data will be permanently removed. This cannot be undone!"}
            </p>

            <div className="mb-4">
              <p className="font-semibold text-gray-900 mb-2">
                User: {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p className="text-sm text-gray-600">{selectedUser.email}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter deletion reason"
              />
            </div>

            {deleteType === "hard" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={selectedUser.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Type the user's email to confirm permanent deletion
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                  setDeletionReason("");
                  setConfirmEmail("");
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant={deleteType === "hard" ? "danger" : "primary"}
                onClick={confirmDelete}
                fullWidth
              >
                {deleteType === "soft" ? "Soft Delete" : "Permanently Delete"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default DeletedUsers;

