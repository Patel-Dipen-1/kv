import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCombinedFamilyMembers,
  clearError,
} from "./familySlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Pagination from "../../components/common/Pagination";
import Input from "../../components/common/Input";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import {
  formatDate,
  getFullName,
  formatMobileNumber,
} from "../../utils/helpers";
import { Search, Users, User } from "lucide-react";
import { toast } from "react-toastify";

const FamilyMembersList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subFamilyNumber: urlSubFamilyNumber } = useParams();
  
  // Get current user's subFamilyNumber if not provided in URL
  const { user } = useSelector((state) => state.auth);
  const subFamilyNumber = urlSubFamilyNumber || user?.subFamilyNumber;

  const {
    combinedFamilyMembers,
    combinedCurrentPage,
    combinedTotalPages,
    combinedTotal,
    isLoading,
    error,
  } = useSelector((state) => state.family);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all, users, familyMembers
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (subFamilyNumber) {
      dispatch(
        getCombinedFamilyMembers({
          subFamilyNumber,
          page: currentPage,
          limit: 10,
          search: searchQuery,
          type: typeFilter,
        })
      );
    } else {
      toast.error("Sub-family number is required");
      navigate("/profile");
    }
  }, [dispatch, subFamilyNumber, currentPage, searchQuery, typeFilter, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  if (!subFamilyNumber) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8">
            <Card>
              <p className="text-center text-gray-600">
                Sub-family number not found. Please try again.
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <Card>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Family Members
              </h1>
              <p className="text-gray-600">
                Family Number: <span className="font-semibold">{subFamilyNumber}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Showing {combinedFamilyMembers.length} of {combinedTotal} members
              </p>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search by name, email, or mobile..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10"
                  />
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                </div>
                <Button type="submit" variant="primary">
                  Search
                </Button>
                {searchQuery && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClearSearch}
                  >
                    Clear
                  </Button>
                )}
              </form>

              {/* Type Filter Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Filter:
                </label>
                <select
                  value={typeFilter}
                  onChange={handleTypeFilterChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                >
                  <option value="all">All Members</option>
                  <option value="users">Users Only</option>
                  <option value="familyMembers">Family Members Only</option>
                </select>
              </div>
            </div>

            {error && (
              <ErrorAlert
                message={error}
                onDismiss={() => dispatch(clearError())}
                className="mb-4"
              />
            )}

            {isLoading ? (
              <Loader />
            ) : combinedFamilyMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">
                  {searchQuery
                    ? "No members found matching your search."
                    : "No family members found."}
                </p>
              </div>
            ) : (
              <>
                {/* Members List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {combinedFamilyMembers.map((member) => {
                    const fullName = getFullName(member);
                    const isUser = member.memberType === "user";
                    const displayEmail = member.email || "N/A";
                    const displayMobile = formatMobileNumber(member.mobileNumber);

                    return (
                      <Card key={member.id || member._id} className="p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              {member.profileImage ? (
                                <img
                                  src={member.profileImage}
                                  alt={fullName}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <User className="text-blue-600" size={24} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {fullName}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    isUser
                                      ? "bg-green-100 text-green-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {isUser ? "User" : "Family Member"}
                                </span>
                                {member.relationshipToUser && (
                                  <span className="text-xs text-gray-500 truncate">
                                    {member.relationshipToUser}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          {displayEmail !== "N/A" && (
                            <div className="flex items-center text-gray-600">
                              <span className="font-medium w-16">Email:</span>
                              <span className="truncate">{displayEmail}</span>
                            </div>
                          )}
                          {displayMobile !== "N/A" && (
                            <div className="flex items-center text-gray-600">
                              <span className="font-medium w-16">Mobile:</span>
                              <span>{displayMobile}</span>
                            </div>
                          )}
                          {member.age && (
                            <div className="flex items-center text-gray-600">
                              <span className="font-medium w-16">Age:</span>
                              <span>{member.age}</span>
                            </div>
                          )}
                          {member.dateOfBirth && (
                            <div className="flex items-center text-gray-600">
                              <span className="font-medium w-16">DOB:</span>
                              <span>{formatDate(member.dateOfBirth)}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {combinedTotalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={combinedCurrentPage}
                      totalPages={combinedTotalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default FamilyMembersList;

