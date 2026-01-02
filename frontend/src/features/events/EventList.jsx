import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllEvents, setFilters, resetFilters } from "./eventSlice";
import { usePermission } from "../../hooks/usePermission";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import {
  Calendar,
  MapPin,
  Plus,
  Search,
  Filter,
  X,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";

const EventList = () => {
  const dispatch = useDispatch();
  const { events, isLoading, error, filters, pagination } = useSelector(
    (state) => state.events
  );
  const canCreateEvents = usePermission("canCreateEvents");
  // Events should be viewable by all logged-in users (public events)
  // Permission check removed - events list is accessible to all authenticated users

  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Load events for all authenticated users
    loadEvents();
  }, [dispatch, filters, activeTab]);

  const loadEvents = () => {
    const queryFilters = { ...filters };
    
    if (activeTab === "upcoming") {
      queryFilters.status = "upcoming";
    } else if (activeTab === "past") {
      queryFilters.status = "completed";
    } else if (activeTab === "funeral") {
      queryFilters.eventType = ["funeral", "condolence"];
    } else if (activeTab === "festival") {
      queryFilters.eventType = "festival";
    } else if (activeTab === "youtube") {
      queryFilters.eventType = "youtube_live";
    }

    if (searchTerm) {
      queryFilters.search = searchTerm;
    }

    dispatch(getAllEvents(queryFilters));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
    loadEvents();
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const clearFilters = () => {
    dispatch(resetFilters());
    setSearchTerm("");
    setShowFilters(false);
  };

  const getEventTypeBadge = (eventType) => {
    const badges = {
      funeral: "bg-gray-100 text-gray-800",
      condolence: "bg-gray-100 text-gray-800",
      festival: "bg-yellow-100 text-yellow-800",
      marriage: "bg-pink-100 text-pink-800",
      youtube_live: "bg-red-100 text-red-800",
      religious: "bg-purple-100 text-purple-800",
    };
    return badges[eventType] || "bg-blue-100 text-blue-800";
  };

  const getEventTypeLabel = (eventType) => {
    return eventType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Removed permission check - events list is accessible to all authenticated users
  // Public events will be visible, role-based events will be filtered by backend

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            {canCreateEvents && (
              <Link to="/events/create">
                <Button variant="primary" className="flex items-center gap-2">
                  <Plus size={18} />
                  Create Event
                </Button>
              </Link>
            )}
          </div>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch({ type: "events/clearError" })}
              className="mb-4"
            />
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
            {["all", "upcoming", "past", "funeral", "festival", "youtube"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                    activeTab === tab
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>
              <Button type="submit" variant="outline">
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter size={18} />
                Filters
              </Button>
            </form>

            {showFilters && (
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type
                    </label>
                    <select
                      value={filters.eventType || ""}
                      onChange={(e) => handleFilterChange("eventType", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    >
                      <option value="">All Types</option>
                      <option value="funeral">Funeral</option>
                      <option value="festival">Festival</option>
                      <option value="marriage">Marriage</option>
                      <option value="youtube_live">YouTube Live</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={filters.city || ""}
                      onChange={(e) => handleFilterChange("city", e.target.value)}
                      placeholder="Filter by city"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <input
                      type="date"
                      value={filters.startDate || ""}
                      onChange={(e) => handleFilterChange("startDate", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Events List */}
          {isLoading && events.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : events.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No events found.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link key={event._id} to={`/events/${event._id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {/* Event Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {event.eventName}
                          </h3>
                          {event.isPinned && (
                            <span className="text-yellow-500">📌</span>
                          )}
                        </div>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getEventTypeBadge(
                            event.eventType
                          )}`}
                        >
                          {getEventTypeLabel(event.eventType)}
                        </span>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>
                          {format(new Date(event.startDate), "MMM dd, yyyy h:mm a")}
                        </span>
                      </div>
                      {event.location?.city && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={16} />
                          <span>{event.location.city}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {/* Media Indicators */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {event.youtubeLinks?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Video size={14} />
                          <span>{event.youtubeLinks.length} Video(s)</span>
                        </div>
                      )}
                      {event.photos?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <ImageIcon size={14} />
                          <span>{event.photos.length} Photo(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4 pt-4 border-t">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          event.status === "upcoming"
                            ? "bg-green-100 text-green-800"
                            : event.status === "ongoing"
                            ? "bg-blue-100 text-blue-800"
                            : event.status === "completed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => {
                  dispatch(setFilters({ page: pagination.page - 1 }));
                  loadEvents();
                }}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => {
                  dispatch(setFilters({ page: pagination.page + 1 }));
                  loadEvents();
                }}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EventList;

