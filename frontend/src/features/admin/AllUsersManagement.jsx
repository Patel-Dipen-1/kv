import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsersAndFamilyMembers,
  adminUpdateFamilyMember,
  adminDeleteFamilyMember,
  updateUserRole,
  approveUser,
  rejectUser,
  deleteUser,
  getUserById,
  clearError,
} from "./adminSlice";
import { toast } from "react-toastify";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import UserDetailModal from "./UserDetailModal";
import FamilyMemberEditModal from "./FamilyMemberEditModal";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import {
  formatDate,
  getFullName,
  getRoleBadgeColor,
  getStatusColor,
} from "../../utils/helpers";
import { usePermission } from "../../hooks/usePermission";
import {
  Edit,
  Trash2,
  Eye,
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  X,
} from "lucide-react";

const AllUsersManagement = () => {
  const dispatch = useDispatch();
  const {
    allUsersAndFamilyMembers,
    currentPage,
    totalPages,
    total,
    isLoading,
    error,
    selectedUser,
  } = useSelector((state) => state.admin);

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // '', 'user', 'family_member'
  const [statusFilter, setStatusFilter] = useState(""); // '', 'pending', 'approved', 'rejected'
  const [approvalStatusFilter, setApprovalStatusFilter] = useState(""); // '', 'pending', 'approved', 'rejected'
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const canManageUsers = usePermission("canManageUsers");
  const canViewUsers = usePermission("canViewUsers");

  useEffect(() => {
    dispatch(clearError());
    dispatch(
      getAllUsersAndFamilyMembers({
        page,
        limit: 20,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        approvalStatus: approvalStatusFilter || undefined,
        search: searchQuery || undefined,
      })
    );
  }, [dispatch, page, typeFilter, statusFilter, approvalStatusFilter, searchQuery]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  const handleClearFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setApprovalStatusFilter("");
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleViewDetails = async (item) => {
    try {
      if (item._type === "user") {
        const result = await dispatch(getUserById(item._id));
        if (getUserById.fulfilled.match(result)) {
          setShowModal(true);
        } else {
          toast.error(result.payload || "Failed to load user details");
        }
      } else {
        // For family members, show a simple info modal or details
        toast.info(
          `Family Member: ${item.displayName}\nRelationship: ${item.displayRelationship || "N/A"}\nStatus: ${item.displayStatus}`,
          { autoClose: 3000 }
        );
      }
    } catch (error) {
      toast.error("Failed to load details");
      console.error("Error loading details:", error);
    }
  };

  const handleEdit = async (item) => {
    try {
      if (item._type === "user") {
        // For users, open the detail modal which has edit capabilities
        const result = await dispatch(getUserById(item._id));
        if (getUserById.fulfilled.match(result)) {
          setShowModal(true);
        } else {
          toast.error(result.payload || "Failed to load user details");
        }
      } else if (item._type === "family_member" && canManageUsers) {
        // For family members, set item to edit and show edit modal
        setItemToEdit(item);
        setShowEditModal(true);
      }
    } catch (error) {
      toast.error("Failed to load item for editing");
      console.error("Error loading item:", error);
    }
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete._type === "family_member") {
        const result = await dispatch(adminDeleteFamilyMember(itemToDelete._id));
        if (adminDeleteFamilyMember.fulfilled.match(result)) {
          toast.success("Family member deleted successfully");
          setItemToDelete(null);
          dispatch(
            getAllUsersAndFamilyMembers({
              page,
              limit: 20,
              type: typeFilter || undefined,
              status: statusFilter || undefined,
              approvalStatus: approvalStatusFilter || undefined,
              search: searchQuery || undefined,
            })
          );
        } else {
          toast.error(result.payload || "Failed to delete family member");
        }
      } else if (itemToDelete._type === "user") {
        if (!window.confirm(`Are you sure you want to delete user ${itemToDelete.displayName}?`)) {
          setItemToDelete(null);
          return;
        }
        const result = await dispatch(
          deleteUser({
            userId: itemToDelete._id,
            deletionReason: "Admin deletion",
            deleteDependentData: false,
          })
        );
        if (deleteUser.fulfilled.match(result)) {
          toast.success("User deleted successfully");
          setItemToDelete(null);
          dispatch(
            getAllUsersAndFamilyMembers({
              page,
              limit: 20,
              type: typeFilter || undefined,
              status: statusFilter || undefined,
              approvalStatus: approvalStatusFilter || undefined,
              search: searchQuery || undefined,
            })
          );
        } else {
          toast.error(result.payload || "Failed to delete user");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
      setItemToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      dispatch(clearError());
    }, 300);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setItemToEdit(null);
  };

  const handleSaveFamilyMember = async (formData) => {
    if (!itemToEdit) return;

    try {
      const result = await dispatch(
        adminUpdateFamilyMember({
          id: itemToEdit._id,
          updateData: formData,
        })
      );

      if (adminUpdateFamilyMember.fulfilled.match(result)) {
        toast.success("Family member updated successfully");
        handleCloseEditModal();
        dispatch(
          getAllUsersAndFamilyMembers({
            page,
            limit: 20,
            type: typeFilter || undefined,
            status: statusFilter || undefined,
            approvalStatus: approvalStatusFilter || undefined,
            search: searchQuery || undefined,
          })
        );
      } else {
        toast.error(result.payload || "Failed to update family member");
      }
    } catch (error) {
      toast.error("An error occurred while updating");
      console.error("Error updating family member:", error);
    }
  };

  const getTypeBadge = (type) => {
    if (type === "user") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          User Account
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
        Family Member
      </span>
    );
  };

  const getStatusBadge = (item) => {
    const status = item._type === "user" ? item.status || item.displayStatus : item.displayStatus || item.approvalStatus;
    const statusColors = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    };
    const color = statusColors[status] || "bg-gray-100 text-gray-800";
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
        {status || "Unknown"}
      </span>
    );
  };

  const hasActiveFilters = typeFilter || statusFilter || approvalStatusFilter || searchQuery;

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Users & Family Members</h1>
              <p className="text-gray-600 mt-1">Manage all users and family members in one place</p>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by name, email, phone..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button type="submit" variant="primary" className="flex items-center gap-2">
                  <Search size={18} />
                  Search
                </Button>
                {searchQuery && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearSearch}
                    className="flex items-center gap-2"
                  >
                    <X size={18} />
                    Clear
                  </Button>
                )}
              </form>

              {/* Filter Toggle */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter size={18} />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <X size={18} />
                    Clear All Filters
                  </Button>
                )}
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="user">Users Only</option>
                      <option value="family_member">Family Members Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Family Member Approval
                    </label>
                    <select
                      value={approvalStatusFilter}
                      onChange={(e) => {
                        setApprovalStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Results */}
          {isLoading && allUsersAndFamilyMembers.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : allUsersAndFamilyMembers.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No users or family members found.</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allUsersAndFamilyMembers.map((item) => (
                  <Card
                    key={item._id}
                    className="hover:shadow-lg transition-shadow h-full flex flex-col"
                  >
                    {/* Header */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                          {item.displayName || getFullName(item)}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getTypeBadge(item._type)}
                        {getStatusBadge(item)}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4 flex-1">
                      {item.displayEmail && item.displayEmail !== "-" && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={16} className="text-gray-400" />
                          <span className="truncate">{item.displayEmail}</span>
                        </div>
                      )}
                      {item.displayMobile && item.displayMobile !== "-" && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={16} className="text-gray-400" />
                          <span>{item.displayMobile}</span>
                        </div>
                      )}
                      {item._type === "family_member" && item.displayRelationship && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users size={16} className="text-gray-400" />
                          <span>{item.displayRelationship}</span>
                        </div>
                      )}
                      {item._type === "user" && item.role && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User size={16} className="text-gray-400" />
                          <span>
                            {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                            {item.role === "committee" && item.committeePosition
                              ? ` - ${item.committeePosition}`
                              : ""}
                          </span>
                        </div>
                      )}
                      {item.createdAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={16} className="text-gray-400" />
                          <span>Joined {formatDate(item.createdAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 flex items-center justify-center gap-2"
                          onClick={() => handleViewDetails(item)}
                        >
                          <Eye size={16} />
                          View
                        </Button>
                        {canManageUsers && (
                          <>
                            <Button
                              variant="outline"
                              className="flex items-center justify-center gap-2 px-3"
                              onClick={() => handleEdit(item)}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="danger"
                              className="flex items-center justify-center gap-2 px-3"
                              onClick={() => handleDelete(item)}
                              title="Delete"
                              disabled={isLoading}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages.allUsers > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-600 flex items-center">
                    Page {page} of {totalPages.allUsers}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === totalPages.allUsers}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}

              <div className="mt-4 text-center text-sm text-gray-600">
                Showing {allUsersAndFamilyMembers.length} of {total.allUsers} total
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {itemToDelete.displayName}? This action cannot be
              undone.
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setItemToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={handleCloseModal}
          onApprove={(id) => {
            dispatch(approveUser(id)).then((result) => {
              if (approveUser.fulfilled.match(result)) {
                toast.success("User approved");
                handleCloseModal();
                dispatch(
                  getAllUsersAndFamilyMembers({
                    page,
                    limit: 20,
                    type: typeFilter || undefined,
                    status: statusFilter || undefined,
                    approvalStatus: approvalStatusFilter || undefined,
                    search: searchQuery || undefined,
                  })
                );
              }
            });
          }}
          onReject={(id) => {
            dispatch(rejectUser(id)).then((result) => {
              if (rejectUser.fulfilled.match(result)) {
                toast.success("User rejected");
                handleCloseModal();
                dispatch(
                  getAllUsersAndFamilyMembers({
                    page,
                    limit: 20,
                    type: typeFilter || undefined,
                    status: statusFilter || undefined,
                    approvalStatus: approvalStatusFilter || undefined,
                    search: searchQuery || undefined,
                  })
                );
              }
            });
          }}
          isLoading={isLoading}
          onRoleUpdate={() => {
            dispatch(
              getAllUsersAndFamilyMembers({
                page,
                limit: 20,
                type: typeFilter || undefined,
                status: statusFilter || undefined,
                approvalStatus: approvalStatusFilter || undefined,
                search: searchQuery || undefined,
              })
            );
          }}
        />
      )}

      {/* Family Member Edit Modal */}
      {showEditModal && itemToEdit && itemToEdit._type === "family_member" && (
        <FamilyMemberEditModal
          familyMember={itemToEdit}
          onClose={handleCloseEditModal}
          onSave={handleSaveFamilyMember}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default AllUsersManagement;
