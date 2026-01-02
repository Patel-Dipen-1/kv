import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllFamilyMemberRequests,
  approveFamilyMemberRequest,
  rejectFamilyMemberRequest,
  clearError,
  clearMessage,
} from "../family/familyRequestSlice";
import { usePermission } from "../../hooks/usePermission";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Pagination from "../../components/common/Pagination";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { formatDate, getFullName } from "../../utils/helpers";
import { toast } from "react-toastify";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";

const FamilyMemberRequests = () => {
  const dispatch = useDispatch();
  const {
    allRequests,
    currentPage,
    totalPages,
    total,
    isLoading,
    error,
    message,
  } = useSelector((state) => state.familyRequest);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const canApproveFamilyMembers = usePermission("canApproveFamilyMembers");
  const canRejectFamilyMembers = usePermission("canRejectFamilyMembers");

  useEffect(() => {
    if (canApproveFamilyMembers || canRejectFamilyMembers) {
      dispatch(getAllFamilyMemberRequests({ status: statusFilter, page: 1, limit: 20 }));
    }
  }, [dispatch, statusFilter, canApproveFamilyMembers, canRejectFamilyMembers]);

  useEffect(() => {
    if (message) {
      toast.success(message);
      dispatch(clearMessage());
      // Delay refetch to avoid DOM conflicts
      setTimeout(() => {
        dispatch(getAllFamilyMemberRequests({ status: statusFilter, page: currentPage, limit: 20 }));
      }, 100);
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [message, error, dispatch, statusFilter, currentPage]);

  const handlePageChange = (page) => {
    dispatch(getAllFamilyMemberRequests({ status: statusFilter, page, limit: 20, search: searchQuery }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    dispatch(getAllFamilyMemberRequests({ status: statusFilter, page: 1, limit: 20, search: searchInput }));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    dispatch(getAllFamilyMemberRequests({ status: statusFilter, page: 1, limit: 20 }));
  };

  // Filter requests locally for instant search
  const filteredRequests = searchQuery
    ? allRequests.filter((request) => {
        const query = searchQuery.toLowerCase();
        const requesterName = getFullName(request.requestedBy || {}).toLowerCase();
        const memberName = `${request.familyMemberDetails?.firstName || ""} ${request.familyMemberDetails?.lastName || ""}`.toLowerCase();
        const subFamily = (request.subFamilyNumber || "").toLowerCase();
        const email = (request.requestedBy?.email || "").toLowerCase();
        const mobile = (request.requestedBy?.mobileNumber || "").toLowerCase();
        return (
          requesterName.includes(query) ||
          memberName.includes(query) ||
          subFamily.includes(query) ||
          email.includes(query) ||
          mobile.includes(query)
        );
      })
    : allRequests;

  const handleApprove = async (requestId) => {
    if (!window.confirm("Are you sure you want to approve this request?")) {
      return;
    }

    try {
      const result = await dispatch(approveFamilyMemberRequest(requestId));
      if (approveFamilyMemberRequest.fulfilled.match(result)) {
        toast.success("Request approved and family member added successfully!");
        // Use setTimeout to ensure state updates happen after current render cycle
        setTimeout(() => {
          dispatch(getAllFamilyMemberRequests({ status: statusFilter, page: currentPage, limit: 20 }));
        }, 100);
      } else {
        toast.error(result.payload || "Failed to approve request");
      }
    } catch (error) {
      toast.error("An error occurred while approving the request");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const result = await dispatch(
        rejectFamilyMemberRequest({
          requestId: selectedRequest._id,
          rejectionReason,
        })
      );

      if (rejectFamilyMemberRequest.fulfilled.match(result)) {
        toast.success("Request rejected successfully");
        // Close modal first, then update state
        setShowRejectModal(false);
        setRejectionReason("");
        const requestIdToRemove = selectedRequest._id;
        setSelectedRequest(null);
        
        // Use setTimeout to ensure modal closes before refetching
        setTimeout(() => {
          dispatch(getAllFamilyMemberRequests({ status: statusFilter, page: currentPage, limit: 20 }));
        }, 100);
      } else {
        toast.error(result.payload || "Failed to reject request");
      }
    } catch (error) {
      toast.error("An error occurred while rejecting the request");
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason("");
    }
  };

  if (!canApproveFamilyMembers && !canRejectFamilyMembers) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="min-h-screen bg-gray-50 md:ml-64 p-8">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-600">You don't have permission to view family member requests.</p>
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
          <div className="flex flex-col gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Family Member Requests ({searchQuery ? filteredRequests.length : total})
            </h1>

            {/* Search Bar */}
            <Card className="p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by requester name, family member name, sub-family number, email, or phone..."
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

          {/* Status Filter */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              Pending ({allRequests.filter((r) => r.status === "pending").length})
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === "approved"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              Approved ({allRequests.filter((r) => r.status === "approved").length})
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              Rejected ({allRequests.filter((r) => r.status === "rejected").length})
            </button>
            <button
              onClick={() => setStatusFilter("")}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === ""
                  ? "bg-gray-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              All
            </button>
          </div>

          {isLoading && filteredRequests.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <p className="text-center text-gray-600 py-8">
                No family member requests found.
              </p>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <Card key={request._id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.firstName} {request.lastName}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {request.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p>
                              <strong>Requested by:</strong>{" "}
                              {request.requestedBy
                                ? getFullName(request.requestedBy)
                                : "Unknown"}
                            </p>
                            <p>
                              <strong>Relationship:</strong> {request.relationshipToUser}
                            </p>
                            <p>
                              <strong>Requested on:</strong>{" "}
                              {formatDate(request.createdAt)}
                            </p>
                          </div>
                          <div>
                            {request.mobileNumber && (
                              <p>
                                <strong>Mobile:</strong> {request.mobileNumber}
                              </p>
                            )}
                            {request.email && (
                              <p>
                                <strong>Email:</strong> {request.email}
                              </p>
                            )}
                            {request.createLoginAccount && (
                              <p className="text-blue-600">
                                <strong>✓ Login account requested</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        {request.requestReason && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700">
                              <strong>Reason:</strong> {request.requestReason}
                            </p>
                          </div>
                        )}

                        {request.reviewedBy && (
                          <div className="mt-2 text-xs text-gray-500">
                            Reviewed by {getFullName(request.reviewedBy)} on{" "}
                            {formatDate(request.reviewedAt)}
                            {request.rejectionReason && (
                              <span className="text-red-600">
                                {" "}
                                - {request.rejectionReason}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {request.status === "pending" && (
                          <>
                            {canApproveFamilyMembers && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(request._id)}
                                isLoading={isLoading}
                              >
                                <CheckCircle size={16} className="mr-1" />
                                Approve
                              </Button>
                            )}
                            {canRejectFamilyMembers && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectModal(true);
                                }}
                                isLoading={isLoading}
                              >
                                <XCircle size={16} className="mr-1" />
                                Reject
                              </Button>
                            )}
                          </>
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

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            // Close modal when clicking outside
            if (e.target === e.currentTarget) {
              setShowRejectModal(false);
              setSelectedRequest(null);
              setRejectionReason("");
            }
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Reject Family Member Request
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to reject the request to add{" "}
              <strong>
                {selectedRequest.firstName} {selectedRequest.lastName}
              </strong>
              ?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  // Use setTimeout to ensure state updates happen smoothly
                  setShowRejectModal(false);
                  setTimeout(() => {
                    setSelectedRequest(null);
                    setRejectionReason("");
                  }, 100);
                }}
                fullWidth
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={isLoading}
                disabled={isLoading}
                fullWidth
              >
                Reject Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FamilyMemberRequests;

