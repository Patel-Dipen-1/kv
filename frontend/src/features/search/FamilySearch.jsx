import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Users, ChevronDown, ChevronUp, User, MapPin, Mail, Phone } from "lucide-react";
import { toast } from "react-toastify";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { searchFamily, getUserFamilyMembers } from "./searchSlice";
import { formatDate, getFullName, formatMobileNumber } from "../../utils/helpers";

const FamilySearch = () => {
  const dispatch = useDispatch();
  const { searchResults, isLoading, error } = useSelector((state) => state.search);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [loadingFamilies, setLoadingFamilies] = useState(new Set());
  const [familyData, setFamilyData] = useState({}); // userId -> family members
  const debounceTimerRef = useRef(null);
  const searchAbortControllerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    // Cancel previous search
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    if (searchInput.trim().length < 2) {
      setSearchQuery("");
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Create new AbortController
    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;

    // Debounce search
    debounceTimerRef.current = setTimeout(() => {
      if (!abortController.signal.aborted) {
        setSearchQuery(searchInput.trim());
        dispatch(searchFamily({ q: searchInput.trim() }));
      }
    }, 300);

    return () => {
      clearTimeout(debounceTimerRef.current);
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, [searchInput, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Toggle user card expansion
  const toggleUserExpansion = useCallback(async (userId) => {
    const isExpanded = expandedUsers.has(userId);
    
    if (isExpanded) {
      // Collapse
      setExpandedUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } else {
      // Expand - fetch family members if not already loaded
      setExpandedUsers((prev) => new Set(prev).add(userId));
      
      if (!familyData[userId]) {
        setLoadingFamilies((prev) => new Set(prev).add(userId));
        try {
          const result = await dispatch(getUserFamilyMembers({ userId })).unwrap();
          setFamilyData((prev) => ({
            ...prev,
            [userId]: result.members || [],
          }));
        } catch (err) {
          toast.error("Failed to load family members");
        } finally {
          setLoadingFamilies((prev) => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
    }
  }, [expandedUsers, familyData, dispatch]);

  // Highlight matched text
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const isFamilyIdSearch = searchQuery.toUpperCase().startsWith("FAM-");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div>
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Search Users & Families
            </h1>
            <p className="text-gray-600 text-sm">
              Search by name or Family ID (e.g., FAM-20260103-D8RM)
            </p>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or family ID..."
                className="w-full px-4 py-3 pl-12 pr-4 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            {isLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Results */}
          {searchQuery && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  {error}
                </div>
              ) : !searchResults || searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">
                    {isFamilyIdSearch
                      ? "No family found with this Family ID"
                      : "No users found matching your search"}
                  </p>
                </div>
              ) : (
                <>
                  {isFamilyIdSearch ? (
                    // Family ID Search Results
                    searchResults.map((family, index) => (
                      <FamilyGroupCard
                        key={family.familyId || index}
                        family={family}
                        query={searchQuery}
                        highlightText={highlightText}
                      />
                    ))
                  ) : (
                    // Name Search Results
                    searchResults.map((user) => (
                      <UserCard
                        key={user._id}
                        user={user}
                        query={searchQuery}
                        highlightText={highlightText}
                        isExpanded={expandedUsers.has(user._id)}
                        isLoading={loadingFamilies.has(user._id)}
                        familyMembers={familyData[user._id] || []}
                        onToggle={() => toggleUserExpansion(user._id)}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {/* Empty State */}
          {!searchQuery && (
            <div className="text-center py-12">
              <Search className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">
                Start typing to search by name or Family ID
              </p>
            </div>
          )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

// User Card Component (for name search)
const UserCard = ({
  user,
  query,
  highlightText,
  isExpanded,
  isLoading,
  familyMembers,
  onToggle,
}) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="text-blue-600" size={24} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {highlightText(user.name, query)}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                {user.familyId && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {user.familyId}
                  </span>
                )}
                {user.isPrimary && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    Primary
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                {user.city && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{user.city}{user.state && `, ${user.state}`}</span>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user.mobileNumber && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>{formatMobileNumber(user.mobileNumber)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expanded Family Members */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader />
              </div>
            ) : familyMembers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No family members found</p>
            ) : (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Family Members ({familyMembers.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {familyMembers.map((member) => (
                    <FamilyMemberCard key={`${member.memberType}-${member._id}`} member={member} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// Family Group Card Component (for Family ID search)
const FamilyGroupCard = ({ family, query, highlightText }) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900">
            Family ID: {highlightText(family.familyId, query)}
          </h3>
          <span className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
            {family.totalMembers} {family.totalMembers === 1 ? "Member" : "Members"}
          </span>
        </div>
        {family.primaryUser && (
          <div className="text-sm text-gray-700">
            <span className="font-medium">Primary:</span> {family.primaryUser.name}
            {family.primaryUser.city && ` • ${family.primaryUser.city}`}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {family.members && family.members.map((member) => (
            <FamilyMemberCard key={`${member.memberType}-${member._id}`} member={member} />
          ))}
        </div>
      </div>
    </Card>
  );
};

// Family Member Card Component
const FamilyMemberCard = ({ member }) => {
  const fullName = getFullName(member);
  const isUser = member.memberType === "user";

  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          {member.profileImage ? (
            <img
              src={member.profileImage}
              alt={fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <User className="text-gray-400" size={18} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-medium text-gray-900 text-sm truncate">{fullName}</h5>
            {member.isPrimary && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                Primary
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            {member.relationshipToUser && (
              <p className="capitalize">{member.relationshipToUser}</p>
            )}
            {member.age && <p>Age: {member.age}</p>}
            {member.dateOfBirth && <p>DOB: {formatDate(member.dateOfBirth)}</p>}
            {member.gender && <p className="capitalize">Gender: {member.gender}</p>}
            {member.address?.city && (
              <p className="flex items-center gap-1">
                <MapPin size={12} />
                {member.address.city}
                {member.address.state && `, ${member.address.state}`}
              </p>
            )}
            {isUser && member.email && (
              <p className="flex items-center gap-1 truncate">
                <Mail size={12} />
                {member.email}
              </p>
            )}
            {member.mobileNumber && (
              <p className="flex items-center gap-1">
                <Phone size={12} />
                {formatMobileNumber(member.mobileNumber)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilySearch;

