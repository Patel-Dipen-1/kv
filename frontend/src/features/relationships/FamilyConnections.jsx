import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  sendConnectionRequest,
  getRelationships,
  acceptRelationship,
  rejectRelationship,
  deleteRelationship,
  clearError,
  clearMessage,
} from "./relationshipSlice";
import { searchUsers } from "../users/userSlice";
import { useEnums } from "../../hooks/useEnums";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import ErrorAlert from "../../components/common/ErrorAlert";
import Card from "../../components/common/Card";
import Navbar from "../../components/layout/Navbar";
import { toast } from "react-toastify";
import {
  UserPlus,
  Check,
  X,
  Trash2,
  Search,
  Users,
  Clock,
  UserCheck,
} from "lucide-react";

const FamilyConnections = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { relationships, isLoading, error, message } = useSelector(
    (state) => state.relationships
  );
  const [activeTab, setActiveTab] = useState("all"); // all, sent, received, accepted
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const RELATIONSHIP_TYPES = useEnums("RELATIONSHIP_TYPES");
  const RELATIONSHIP_DIRECTIONS = useEnums("RELATIONSHIP_DIRECTIONS");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const selectedRelationshipType = watch("relationshipType");
  const selectedUser2Id = watch("user2Id");

  useEffect(() => {
    if (user?._id) {
      dispatch(getRelationships({}));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (message) {
      toast.success(message);
      dispatch(clearMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [message, error, dispatch]);

  // Search users for connection
  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Filter out current user
      const filtered = response.data.users.filter((u) => u._id !== user?._id);
      setSearchResults(filtered);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const onSubmitRequest = async (data) => {
    try {
      const result = await dispatch(sendConnectionRequest(data));
      if (sendConnectionRequest.fulfilled.match(result)) {
        toast.success("Connection request sent successfully!");
        reset();
        setShowRequestForm(false);
        setSearchQuery("");
        setSearchResults([]);
        dispatch(getRelationships({}));
      }
    } catch (error) {
      // Error handled by Redux
    }
  };

  const handleAccept = async (relationshipId) => {
    try {
      const result = await dispatch(acceptRelationship(relationshipId));
      if (acceptRelationship.fulfilled.match(result)) {
        dispatch(getRelationships({}));
      }
    } catch (error) {
      // Error handled by Redux
    }
  };

  const handleReject = async (relationshipId) => {
    if (window.confirm("Are you sure you want to reject this connection request?")) {
      try {
        const result = await dispatch(rejectRelationship(relationshipId));
        if (rejectRelationship.fulfilled.match(result)) {
          dispatch(getRelationships({}));
        }
      } catch (error) {
        // Error handled by Redux
      }
    }
  };

  const handleDelete = async (relationshipId) => {
    if (window.confirm("Are you sure you want to delete this relationship?")) {
      try {
        const result = await dispatch(deleteRelationship(relationshipId));
        if (deleteRelationship.fulfilled.match(result)) {
          dispatch(getRelationships({}));
        }
      } catch (error) {
        // Error handled by Redux
      }
    }
  };

  // Early return if user not loaded
  if (!user?._id) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 px-4 py-8">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-600">Loading...</p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  // Filter relationships based on active tab
  const filteredRelationships = relationships.filter((rel) => {
    const isUser1 = rel.user1Id?._id === user._id;
    const isUser2 = rel.user2Id?._id === user._id;
    const isRequestedByMe = rel.requestedBy?._id === user._id;

    if (activeTab === "sent") return isRequestedByMe && rel.status === "pending";
    if (activeTab === "received")
      return !isRequestedByMe && rel.status === "pending";
    if (activeTab === "accepted") return rel.status === "accepted";
    return true; // all
  });

  const getRelationshipLabel = (rel) => {
    const isUser1 = rel.user1Id?._id === user._id;
    const otherUser = isUser1 ? rel.user2Id : rel.user1Id;

    if (rel.relationshipFrom === "bidirectional") {
      return `${otherUser.firstName} ${otherUser.lastName} (${rel.relationshipType})`;
    }

    if (isUser1) {
      if (rel.relationshipFrom === "user1_to_user2") {
        return `${otherUser.firstName} ${otherUser.lastName} (My ${rel.relationshipType})`;
      } else {
        return `${otherUser.firstName} ${otherUser.lastName} (My ${rel.relationshipType})`;
      }
    } else {
      if (rel.relationshipFrom === "user1_to_user2") {
        return `${otherUser.firstName} ${otherUser.lastName} (My ${rel.relationshipType})`;
      } else {
        return `${otherUser.firstName} ${otherUser.lastName} (My ${rel.relationshipType})`;
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Family Connections
            </h1>
            <Button
              variant="primary"
              onClick={() => setShowRequestForm(!showRequestForm)}
            >
              <UserPlus size={20} className="mr-2" />
              Link Family Member
            </Button>
          </div>

          {/* Request Form */}
          {showRequestForm && (
            <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Send Connection Request</h2>
              <form onSubmit={handleSubmit(onSubmitRequest)} className="space-y-4">
                {/* Search User */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Family Member
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, or mobile number"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result._id}
                          type="button"
                          onClick={() => {
                            reset({ user2Id: result._id });
                            setSearchQuery(`${result.firstName} ${result.lastName}`);
                            setSearchResults([]);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">
                            {result.firstName} {result.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.email} • {result.mobileNumber}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="hidden"
                  {...register("user2Id", { required: "Please select a user" })}
                />

                {/* Relationship Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("relationshipType", {
                      required: "Relationship type is required",
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  >
                    <option value="">Select relationship</option>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.relationshipType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.relationshipType.message}
                    </p>
                  )}
                </div>

                {/* Relationship Direction */}
                {selectedRelationshipType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Direction <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("relationshipFrom", {
                        required: "Direction is required",
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    >
                      <option value="">Select direction</option>
                      <option value="user1_to_user2">
                        He/She is my {selectedRelationshipType}
                      </option>
                      <option value="user2_to_user1">
                        I am his/her {selectedRelationshipType}
                      </option>
                      {["Brother", "Sister", "Cousin"].includes(
                        selectedRelationshipType
                      ) && (
                        <option value="bidirectional">
                          We are {selectedRelationshipType}s
                        </option>
                      )}
                    </select>
                    {errors.relationshipFrom && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.relationshipFrom.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note (Optional)
                  </label>
                  <textarea
                    {...register("note")}
                    rows={3}
                    placeholder="Add a note for the connection request"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowRequestForm(false);
                      reset();
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isLoading}>
                    Send Request
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 font-medium ${
                activeTab === "all"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`px-4 py-2 font-medium ${
                activeTab === "sent"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sent ({relationships.filter((r) => r.requestedBy?._id === user?._id && r.status === "pending").length})
            </button>
            <button
              onClick={() => setActiveTab("received")}
              className={`px-4 py-2 font-medium ${
                activeTab === "received"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Received ({relationships.filter((r) => r.requestedBy?._id !== user?._id && r.status === "pending").length})
            </button>
            <button
              onClick={() => setActiveTab("accepted")}
              className={`px-4 py-2 font-medium ${
                activeTab === "accepted"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Accepted ({relationships.filter((r) => r.status === "accepted").length})
            </button>
          </div>

          {/* Relationships List */}
          {isLoading && filteredRelationships.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRelationships.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No relationships found</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRelationships.map((rel) => {
                if (!user?._id) return null;
                const isUser1 = rel.user1Id?._id === user._id;
                const otherUser = isUser1 ? rel.user2Id : rel.user1Id;
                const isRequestedByMe = rel.requestedBy?._id === user._id;

                return (
                  <Card key={rel._id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users size={24} className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {otherUser.firstName} {otherUser.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getRelationshipLabel(rel)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {otherUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {rel.status === "pending" && !isRequestedByMe && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAccept(rel._id)}
                              isLoading={isLoading}
                            >
                              <Check size={16} className="mr-1" />
                              Accept
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReject(rel._id)}
                              isLoading={isLoading}
                            >
                              <X size={16} className="mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {rel.status === "pending" && isRequestedByMe && (
                          <span className="flex items-center text-sm text-gray-600">
                            <Clock size={16} className="mr-1" />
                            Pending
                          </span>
                        )}
                        {rel.status === "accepted" && (
                          <span className="flex items-center text-sm text-green-600">
                            <UserCheck size={16} className="mr-1" />
                            Connected
                          </span>
                        )}
                        {rel.status === "accepted" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDelete(rel._id)}
                            isLoading={isLoading}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FamilyConnections;

