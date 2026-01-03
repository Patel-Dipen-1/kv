import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllEvents, clearError } from "./eventSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import { Calendar, MapPin, Heart, MessageCircle, Image as ImageIcon, Link as LinkIcon, Video } from "lucide-react";
import { format } from "date-fns";

const EventList = () => {
  const dispatch = useDispatch();
  const { events, isLoading, error, pagination } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth);

  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(getAllEvents({ page, limit: 20 }));
  }, [dispatch, page]);

  const getEventTypeColor = (eventType) => {
    const colors = {
      normal: "bg-blue-100 text-blue-800",
      invitation: "bg-purple-100 text-purple-800",
      announcement: "bg-yellow-100 text-yellow-800",
      link: "bg-green-100 text-green-800",
      youtube: "bg-red-100 text-red-800",
    };
    return colors[eventType] || colors.normal;
  };

  const getEventTypeLabel = (eventType) => {
    return eventType.charAt(0).toUpperCase() + eventType.slice(1);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600 mt-1">View all upcoming and past events</p>
          </div>

          {error && (
            <ErrorAlert message={error} onDismiss={() => dispatch(clearError())} className="mb-4" />
          )}

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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Link key={event._id} to={`/events/${event._id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                      {/* Event Header */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {event.title}
                          </h3>
                        </div>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(
                            event.eventType
                          )}`}
                        >
                          {getEventTypeLabel(event.eventType)}
                        </span>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} />
                          <span>
                            {format(new Date(event.startDate), "MMM dd, yyyy h:mm a")}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Media Indicators */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        {event.media?.images?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <ImageIcon size={14} />
                            <span>{event.media.images.length}</span>
                          </div>
                        )}
                        {event.media?.youtubeUrl && (
                          <div className="flex items-center gap-1">
                            <Video size={14} />
                            <span>Video</span>
                          </div>
                        )}
                        {event.media?.externalLink?.url && (
                          <div className="flex items-center gap-1">
                            <LinkIcon size={14} />
                            <span>Link</span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Heart size={16} />
                            <span>{event.likeCount || 0}</span>
                          </div>
                          {event.settings?.commentEnabled && (
                            <div className="flex items-center gap-1">
                              <MessageCircle size={16} />
                              <span>{event.commentCount || 0}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === pagination.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default EventList;

