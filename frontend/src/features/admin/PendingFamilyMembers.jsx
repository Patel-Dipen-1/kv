import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getPendingFamilyMembers,
  approveFamilyMember,
  rejectFamilyMember,
  clearError,
} from "../family/familySlice";
import { usePermission } from "../../hooks/usePermission";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Pagination from "../../components/common/Pagination";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { formatDate, getFullName, formatMobileNumber } from "../../utils/helpers";
import { toast } from "react-toastify";
import { Search } from "lucide-react";

const PendingFamilyMembers = () => {
  // Permission checks
  const canViewPendingFamilyMembers = usePermission("canViewPendingFamilyMembers");
  const canApproveFamilyMembers = usePermission("canApproveFamilyMembers");
  const canRejectFamilyMembers = usePermission("canRejectFamilyMembers");
  const dispatch = useDispatch();
  const {
    pendingFamilyMembers,
    currentPage,
    totalPages,
    total,
    isLoading,
    error,
  } = useSelector((state) => state.family);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    // Only fetch if user has permission to view pending family members
    if (canViewPendingFamilyMembers) {
      dispatch(getPendingFamilyMembers({ page: 1, limit: 20 }));
    }
  }, [dispatch, canViewPendingFamilyMembers]);

  // Filter users based on search query
  const filteredMembers = pendingFamilyMembers.filter((member) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const fullName = getFullName(member).toLowerCase();
    const email = member.email?.toLowerCase() || "";
    const mobile = member.mobileNumber?.toLowerCase() || "";
    const relationship = member.relationshipToUser?.toLowerCase() || "";
    const addedByName = `${member.userId?.firstName || ""} ${member.userId?.lastName || ""}`.toLowerCase();
    const addedByEmail = member.userId?.email?.toLowerCase() || "";
    const familyId = member.subFamilyNumber?.toLowerCase() || "";
    
    return (
      fullName.includes(query) ||
      email.includes(query) ||
      mobile.includes(query) ||
      relationship.includes(query) ||
      addedByName.includes(query) ||
      addedByEmail.includes(query) ||
      familyId.includes(query)
    );
  });

  const handlePageChange = (page) => {
    dispatch(getPendingFamilyMembers({ page, limit: 20 }));
  };

  const handleApprove = async (id) => {
    try {
      const result = await dispatch(approveFamilyMember(id));
      if (approveFamilyMember.fulfilled.match(result)) {
        toast.success("Family member approved successfully!");
        
        // Use setTimeout to ensure DOM updates complete before refetching
        setTimeout(() => {
          dispatch(getPendingFamilyMembers({ page: currentPage, limit: 20 }));
        }, 300);
      } else {
        toast.error(result.payload || "Failed to approve family member");
      }
    } catch (error) {
      toast.error("Failed to approve family member");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this family member?")) {
      return;
    }
    try {
      const result = await dispatch(rejectFamilyMember(id));
      if (rejectFamilyMember.fulfilled.match(result)) {
        toast.success("Family member rejected successfully!");
        
        // Use setTimeout to ensure DOM updates complete before refetching
        setTimeout(() => {
          dispatch(getPendingFamilyMembers({ page: currentPage, limit: 20 }));
        }, 300);
      } else {
        toast.error(result.payload || "Failed to reject family member");
      }
    } catch (error) {
      toast.error("Failed to reject family member");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
              Pending Family Members
            </h1>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full md:w-auto">
              <div className="flex gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by name, email, phone, relationship, family ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="whitespace-nowrap"
                >
                  Search
                </Button>
                {searchQuery && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClearSearch}
                    className="whitespace-nowrap"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </form>
          </div>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
              className="mb-4"
            />
          )}

          {isLoading && pendingFamilyMembers.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : pendingFamilyMembers.length === 0 ? (
            <Card>
              <p className="text-center text-gray-600 py-8">
                No pending family members found.
              </p>
            </Card>
          ) : filteredMembers.length === 0 ? (
            <Card>
              <p className="text-center text-gray-600 py-8">
                No family members found matching your search.
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
                          Family Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Relationship
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Added By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Family ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Added
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers.map((member) => (
                        <tr key={member._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getFullName(member)}
                            </div>
                            {member.age && (
                              <div className="text-sm text-gray-500">
                                Age: {member.age}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {member.relationshipToUser}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {member.mobileNumber &&
                                formatMobileNumber(member.mobileNumber)}
                            </div>
                            {member.email && (
                              <div className="text-sm text-gray-500">
                                {member.email}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {member.userId?.firstName} {member.userId?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.userId?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900">
                              {member.subFamilyNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(member.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                onClick={() => handleApprove(member._id)}
                                isLoading={isLoading}
                                className="text-xs"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleReject(member._id)}
                                isLoading={isLoading}
                                className="text-xs"
                              >
                                Reject
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
                {filteredMembers.map((member) => (
                  <Card key={member._id}>
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getFullName(member)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {member.relationshipToUser}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {member.mobileNumber && (
                          <p>Phone: {formatMobileNumber(member.mobileNumber)}</p>
                        )}
                        {member.email && <p>Email: {member.email}</p>}
                        <p>Added by: {member.userId?.firstName} {member.userId?.lastName}</p>
                        <p>Family ID: {member.subFamilyNumber}</p>
                        <p>Date: {formatDate(member.createdAt)}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {canApproveFamilyMembers && (
                          <Button
                            variant="primary"
                            onClick={() => handleApprove(member._id)}
                            isLoading={isLoading}
                            fullWidth
                          >
                            Approve
                          </Button>
                        )}
                        {canRejectFamilyMembers && (
                          <Button
                            variant="danger"
                            onClick={() => handleReject(member._id)}
                            isLoading={isLoading}
                            fullWidth
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PendingFamilyMembers;

