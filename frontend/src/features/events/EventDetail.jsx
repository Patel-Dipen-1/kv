import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getEventById, rsvpToEvent } from "./eventSlice";
import { getPollsByEvent } from "../../features/polls/pollSlice";
import { getCommentsByEvent } from "../../features/comments/commentSlice";
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
  Edit,
  Trash2,
  Video,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import PollCard from "../../features/polls/PollCard";
import CommentSection from "../../features/comments/CommentSection";

const EventDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentEvent, isLoading, error } = useSelector((state) => state.events);
  const { polls } = useSelector((state) => state.polls);
  const { user } = useSelector((state) => state.auth);

  const canEditEvents = usePermission("canEditEvents");
  const canDeleteEvents = usePermission("canDeleteEvents");

  const [rsvpResponse, setRsvpResponse] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    // Only fetch data if id is a valid MongoDB ObjectId (24 hex characters)
    // Skip if id is "create" or other non-ObjectId values
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      dispatch(getEventById(id))
        .then((result) => {
          if (getEventById.fulfilled.match(result)) {
            // Set initial RSVP response if user has already RSVP'd
            const event = result.payload;
            if (event.rsvp && event.rsvp.length > 0 && user) {
              const userRSVP = event.rsvp.find(
                (r) => r.userId && r.userId.toString() === user._id
              );
              if (userRSVP) {
                setRsvpResponse(userRSVP.response);
              }
            }
            // Fetch polls and comments
            dispatch(getPollsByEvent(id));
            dispatch(getCommentsByEvent({ eventId: id }));
          }
        })
        .catch((error) => {
          console.error("Error fetching event:", error);
        });
    }
  }, [dispatch, id, user]);

  const handleRSVP = async (response) => {
    const result = await dispatch(rsvpToEvent({ eventId: id, response }));
    if (rsvpToEvent.fulfilled.match(result)) {
      setRsvpResponse(response);
    }
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

  if (isLoading && !currentEvent) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="min-h-screen bg-gray-50 md:ml-64">
          <div className="p-4 md:p-8">
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error && !currentEvent) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="min-h-screen bg-gray-50 md:ml-64">
          <div className="p-4 md:p-8">
            <ErrorAlert message={error} />
            <Link to="/events">
              <Button variant="outline" className="mt-4">
                <ArrowLeft size={18} className="mr-2" />
                Back to Events
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!currentEvent) {
    return null;
  }

  const isCreator = user?.id === currentEvent.createdBy?._id;
  const canEdit = isCreator || canEditEvents;
  const canDelete = isCreator || canDeleteEvents;

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <Link to="/events">
              <Button variant="outline" className="mb-4 flex items-center gap-2">
                <ArrowLeft size={18} />
                Back to Events
              </Button>
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {currentEvent.eventName}
                  </h1>
                  {currentEvent.isPinned && (
                    <span className="text-yellow-500 text-2xl">📌</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getEventTypeBadge(
                      currentEvent.eventType
                    )}`}
                  >
                    {getEventTypeLabel(currentEvent.eventType)}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                      currentEvent.status === "upcoming"
                        ? "bg-green-100 text-green-800"
                        : currentEvent.status === "ongoing"
                        ? "bg-blue-100 text-blue-800"
                        : currentEvent.status === "completed"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {currentEvent.status.charAt(0).toUpperCase() +
                      currentEvent.status.slice(1)}
                  </span>
                </div>
              </div>

              {(canEdit || canDelete) && (
                <div className="flex gap-2">
                  {canEdit && (
                    <Link to={`/events/${id}/edit`}>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Edit size={18} />
                        Edit
                      </Button>
                    </Link>
                  )}
                  {canDelete && (
                    <Button
                      variant="danger"
                      className="flex items-center gap-2"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this event?")) {
                          // Handle delete
                        }
                      }}
                    >
                      <Trash2 size={18} />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {["details", "media", "polls", "comments"].map((tab) => (
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
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Event Info */}
              <Card>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Start Date & Time</p>
                      <p className="font-medium">
                        {format(new Date(currentEvent.startDate), "MMMM dd, yyyy 'at' h:mm a")}
                      </p>
                      {currentEvent.endDate && (
                        <>
                          <p className="text-sm text-gray-600 mt-2">End Date & Time</p>
                          <p className="font-medium">
                            {format(new Date(currentEvent.endDate), "MMMM dd, yyyy 'at' h:mm a")}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {currentEvent.location?.venueName && (
                    <div className="flex items-start gap-3">
                      <MapPin className="text-gray-400 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{currentEvent.location.venueName}</p>
                        {currentEvent.location.address && (
                          <p className="text-sm text-gray-600">
                            {currentEvent.location.address}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {currentEvent.location.city}
                          {currentEvent.location.state && `, ${currentEvent.location.state}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {currentEvent.description && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Description</p>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {currentEvent.description}
                      </p>
                    </div>
                  )}

                  {/* Funeral Details */}
                  {currentEvent.eventType === "funeral" &&
                    currentEvent.funeralDetails && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3">Funeral Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentEvent.funeralDetails.deceasedName && (
                            <div>
                              <p className="text-sm text-gray-600">Deceased Name</p>
                              <p className="font-medium">
                                {currentEvent.funeralDetails.deceasedName}
                              </p>
                            </div>
                          )}
                          {currentEvent.funeralDetails.dateOfDeath && (
                            <div>
                              <p className="text-sm text-gray-600">Date of Death</p>
                              <p className="font-medium">
                                {format(
                                  new Date(currentEvent.funeralDetails.dateOfDeath),
                                  "MMMM dd, yyyy"
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* RSVP Section */}
                  {currentEvent.allowRSVP && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">RSVP</p>
                      <div className="flex gap-2">
                        <Button
                          variant={rsvpResponse === "attending" ? "primary" : "outline"}
                          onClick={() => handleRSVP("attending")}
                          disabled={rsvpResponse === "attending"}
                        >
                          Attending ({currentEvent.rsvpCounts?.attending || 0})
                        </Button>
                        <Button
                          variant={rsvpResponse === "not_attending" ? "danger" : "outline"}
                          onClick={() => handleRSVP("not_attending")}
                          disabled={rsvpResponse === "not_attending"}
                        >
                          Not Attending ({currentEvent.rsvpCounts?.notAttending || 0})
                        </Button>
                        <Button
                          variant={rsvpResponse === "maybe" ? "secondary" : "outline"}
                          onClick={() => handleRSVP("maybe")}
                          disabled={rsvpResponse === "maybe"}
                        >
                          Maybe ({currentEvent.rsvpCounts?.maybe || 0})
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-6">
              {/* YouTube Links */}
              {currentEvent.youtubeLinks?.length > 0 && (
                <Card>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Video size={24} />
                    YouTube Videos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentEvent.youtubeLinks.map((link, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="aspect-video bg-gray-200 rounded mb-2 flex items-center justify-center">
                            {link.thumbnail ? (
                              <img
                                src={link.thumbnail}
                                alt={link.title || "Video"}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Video size={48} className="text-gray-400" />
                            )}
                          </div>
                          <h3 className="font-medium">{link.title || "YouTube Video"}</h3>
                          {link.isLive && (
                            <span className="inline-block mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                              LIVE
                            </span>
                          )}
                        </a>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Photos */}
              {currentEvent.photos?.length > 0 && (
                <Card>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon size={24} />
                    Photos ({currentEvent.photos.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentEvent.photos.map((photo, index) => (
                      <div key={index} className="aspect-square">
                        <img
                          src={photo.url}
                          alt={photo.caption || `Photo ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90"
                          onClick={() => window.open(photo.url, "_blank")}
                        />
                        {photo.caption && (
                          <p className="text-xs text-gray-600 mt-1">{photo.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === "polls" && (
            <div className="space-y-6">
              {polls.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <p className="text-gray-600">No polls for this event.</p>
                  </div>
                </Card>
              ) : (
                polls.map((poll) => <PollCard key={poll._id} poll={poll} eventId={id} />)
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <CommentSection eventId={id} eventType={currentEvent.eventType} />
          )}
        </div>
      </div>
    </>
  );
};

export default EventDetail;

