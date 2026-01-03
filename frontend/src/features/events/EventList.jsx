import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllEvents, clearError } from "./eventSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import EventCard from "../../components/events/EventCard";
import EventCardSkeleton from "../../components/events/EventCardSkeleton";
import { Calendar, Grid, List, Instagram, Image as ImageIcon, Heart, MessageCircle } from "lucide-react";
import { format } from "date-fns";

const EventList = () => {
  const dispatch = useDispatch();
  const { events, isLoading, error, pagination } = useSelector((state) => state.events);
  const observerTarget = useRef(null);

  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("feed"); // "feed" or "grid"

  useEffect(() => {
    dispatch(getAllEvents({ page, limit: 20 }));
  }, [dispatch, page]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && pagination && page < pagination.pages) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [isLoading, pagination, page]);

  const handleCommentSubmit = () => {
    // Refresh events to get updated comment counts
    dispatch(getAllEvents({ page, limit: 20 }));
  };

  const getEventTypeColor = (eventType) => {
    const colors = {
      normal: "bg-blue-100 text-blue-800",
      invitation: "bg-purple-100 text-purple-800",
      announcement: "bg-yellow-100 text-yellow-800",
      link: "bg-green-100 text-green-800",
      youtube: "bg-red-100 text-red-800",
      instagram: "bg-pink-100 text-pink-800",
    };
    return colors[eventType] || colors.normal;
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      instagram: "Instagram Post",
      youtube: "YouTube",
    };
    return labels[eventType] || eventType.charAt(0).toUpperCase() + eventType.slice(1);
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <Link key={event._id} to={`/events/${event._id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
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
            <div className="space-y-2 mb-4 flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                <span>{format(new Date(event.startDate), "MMM dd, yyyy h:mm a")}</span>
              </div>
              {event.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              {event.eventType === "instagram" && (
                <div className="flex items-center gap-1 text-pink-600">
                  <Instagram size={14} />
                  <span>Instagram Post</span>
                </div>
              )}
              {event.media?.images?.length > 0 && (
                <div className="flex items-center gap-1">
                  <ImageIcon size={14} />
                  <span>{event.media.images.length}</span>
                </div>
              )}
            </div>
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
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6 md:px-6">
          {/* Header with View Toggle */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Events</h1>
              <p className="text-gray-600 mt-1">Discover and engage with events</p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode("feed")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === "feed"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Grid
              </button>
            </div>
          </div>

          {error && (
            <ErrorAlert message={error} onDismiss={() => dispatch(clearError())} className="mb-4" />
          )}

          {isLoading && events.length === 0 ? (
            <div className="space-y-0">
              {[...Array(3)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
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
              {viewMode === "feed" ? (
                <div className="space-y-0">
                  {events.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      onCommentSubmit={handleCommentSubmit}
                    />
                  ))}
                  {/* Infinite scroll trigger */}
                  <div ref={observerTarget} className="h-10 flex items-center justify-center py-4">
                    {isLoading && <Loader size="sm" />}
                  </div>
                </div>
              ) : (
                renderGridView()
              )}

              {/* Pagination for Grid View */}
              {viewMode === "grid" && pagination && pagination.pages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      disabled={page === 1 || isLoading}
                      onClick={() => setPage(page - 1)}
                      className="min-w-[100px]"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            disabled={isLoading}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors min-w-[40px] ${
                              page === pageNum
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      disabled={page === pagination.pages || isLoading}
                      onClick={() => setPage(page + 1)}
                      className="min-w-[100px]"
                    >
                      Next
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Page {page} of {pagination.pages} ({pagination.total} total)
                  </p>
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

