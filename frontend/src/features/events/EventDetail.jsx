import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getEventById,
  toggleLike,
  addComment,
  deleteComment,
  voteInPoll,
  clearError,
} from "./eventSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import Navbar from "../../components/layout/Navbar";
import {
  Calendar,
  Heart,
  MessageCircle,
  ArrowLeft,
  Image as ImageIcon,
  Trash2,
  Send,
  Video,
  Link as LinkIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentEvent, isLoading, error } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth);

  const [commentText, setCommentText] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxImage || !currentEvent?.media?.images) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setLightboxImage(null);
      } else if (e.key === "ArrowLeft" && currentEvent?.media?.images) {
        const prevIndex =
          lightboxIndex === 0
            ? currentEvent.media.images.length - 1
            : lightboxIndex - 1;
        setLightboxIndex(prevIndex);
        setLightboxImage(currentEvent.media.images[prevIndex]);
      } else if (e.key === "ArrowRight" && currentEvent?.media?.images) {
        const nextIndex =
          lightboxIndex === currentEvent.media.images.length - 1
            ? 0
            : lightboxIndex + 1;
        setLightboxIndex(nextIndex);
        setLightboxImage(currentEvent.media.images[nextIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage, lightboxIndex, currentEvent?.media?.images]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isAdmin = user?.role === "admin" || user?.roleRef?.roleKey === "admin";

  useEffect(() => {
    if (id) {
      dispatch(getEventById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const hasUserLiked = user && currentEvent
    ? currentEvent.likes?.some(
        (like) => like.userId?._id === user.id || like.userId?._id === user._id
      )
    : false;

  const getUserVote = () => {
    if (!user || !currentEvent?.poll?.options) return null;
    for (const option of currentEvent.poll.options) {
      if (
        option.votes?.some(
          (vote) =>
            vote.userId?._id === user.id ||
            vote.userId?._id === user._id ||
            vote.userId === user.id ||
            vote.userId === user._id
        )
      ) {
        return { optionId: option._id.toString(), optionText: option.text };
      }
    }
    return null;
  };
  const userVote = getUserVote();

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like events");
      return;
    }
    await dispatch(toggleLike(id));
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    if (!user) {
      toast.error("Please login to comment");
      return;
    }
    setIsSubmittingComment(true);
    try {
      await dispatch(addComment({ eventId: id, text: commentText }));
      setCommentText("");
      toast.success("Comment added successfully");
      // Refresh event to get updated comments
      await dispatch(getEventById(id));
    } catch (error) {
      // Error handled by slice
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }
    try {
      await dispatch(deleteComment({ eventId: id, commentId }));
      toast.success("Comment deleted successfully");
      // Refresh event
      await dispatch(getEventById(id));
    } catch (error) {
      // Error handled by slice
    }
  };

  const handleVote = async (optionId) => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }
    try {
      await dispatch(voteInPoll({ eventId: id, optionId }));
      toast.success("Vote recorded successfully");
      // Refresh event
      await dispatch(getEventById(id));
    } catch (error) {
      // Error handled by slice
    }
  };

  // Show loading state
  if (isLoading && !currentEvent) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader size="lg" />
        </div>
      </>
    );
  }

  // Show error state
  if (error && !currentEvent) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <ErrorAlert message={error} onDismiss={() => dispatch(clearError())} />
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

  // Show not found state
  if (!currentEvent) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Event not found.</p>
                <Link to="/events">
                  <Button variant="outline">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Events
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Link to="/events">
            <Button variant="outline" className="mb-4">
              <ArrowLeft size={18} className="mr-2" />
              Back to Events
            </Button>
          </Link>

          <Card className="mb-6">
            {/* Event Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentEvent?.title || "Event"}</h1>

              {/* Event Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                {currentEvent?.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    <span>
                      {format(new Date(currentEvent.startDate), "MMM dd, yyyy h:mm a")}
                      {currentEvent?.endDate &&
                        ` - ${format(new Date(currentEvent.endDate), "MMM dd, yyyy h:mm a")}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                      hasUserLiked
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Heart size={18} fill={hasUserLiked ? "currentColor" : "none"} />
                    <span>{currentEvent?.likeCount || 0}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              {currentEvent?.description && (
                <p className="text-gray-700 whitespace-pre-wrap">{currentEvent.description}</p>
              )}
            </div>

            {/* Media */}
            {currentEvent?.media?.youtubeUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Video</h3>
                <div className="aspect-video">
                  {(() => {
                    // Enhanced YouTube URL parser that handles all formats
                    const youtubeUrl = currentEvent.media.youtubeUrl;
                    let embedUrl = "";

                    // Extract video ID from various YouTube URL formats
                    const patterns = [
                      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
                      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
                      // Short URL: https://youtu.be/VIDEO_ID
                      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
                      // Embed URL: https://www.youtube.com/embed/VIDEO_ID
                      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
                      // Live stream: https://www.youtube.com/live/VIDEO_ID
                      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([^&\n?#]+)/,
                      // Shorts: https://www.youtube.com/shorts/VIDEO_ID
                      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/,
                    ];

                    let videoId = null;
                    for (const pattern of patterns) {
                      const match = youtubeUrl.match(pattern);
                      if (match && match[1]) {
                        videoId = match[1];
                        break;
                      }
                    }

                    // If we found a video ID, create embed URL
                    if (videoId) {
                      embedUrl = `https://www.youtube.com/embed/${videoId}`;
                      // For live streams, add autoplay parameter
                      if (youtubeUrl.includes("/live/")) {
                        embedUrl += "?autoplay=1";
                      }
                    } else {
                      // Fallback: try to use the URL as-is if it's already an embed URL
                      embedUrl = youtubeUrl;
                    }

                    return (
                      <iframe
                        src={embedUrl}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title="YouTube video player"
                      />
                    );
                  })()}
                </div>
              </div>
            )}

            {/* WhatsApp Contact */}
            {currentEvent?.media?.whatsappNumber && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Contact via WhatsApp</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  {(() => {
                    // Format phone number for WhatsApp (remove spaces, +, -, etc.)
                    const formatPhoneNumber = (phone) => {
                      if (!phone) return "";
                      // Remove all non-digit characters except +
                      let cleaned = phone.replace(/[^\d+]/g, "");
                      // If starts with +, keep it, otherwise ensure country code
                      if (!cleaned.startsWith("+")) {
                        // If starts with 0, remove it
                        if (cleaned.startsWith("0")) {
                          cleaned = cleaned.substring(1);
                        }
                        // If doesn't start with country code, assume India (+91)
                        if (cleaned.length === 10) {
                          cleaned = "91" + cleaned;
                        }
                      }
                      // Remove + for WhatsApp URL
                      return cleaned.replace("+", "");
                    };

                    const phoneNumber = formatPhoneNumber(currentEvent?.media?.whatsappNumber || "");
                    const message = currentEvent?.media?.whatsappMessage
                      ? encodeURIComponent(currentEvent.media.whatsappMessage)
                      : encodeURIComponent(`Hello! I'm interested in: ${currentEvent?.title || "this event"}`);
                    const whatsappUrl = `https://wa.me/${phoneNumber}${message ? `?text=${message}` : ""}`;

                    return (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        aria-label={`Contact via WhatsApp: ${currentEvent?.media?.whatsappNumber || ""}`}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        <span>Chat on WhatsApp</span>
                      </a>
                    );
                  })()}
                  {currentEvent?.media?.whatsappNumber && (
                    <p className="mt-2 text-sm text-gray-600 text-center">
                      {currentEvent.media.whatsappNumber}
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentEvent?.media?.externalLink?.url && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">External Link</h3>
                <a
                  href={currentEvent?.media?.externalLink?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border rounded-lg hover:bg-gray-50"
                >
                  {currentEvent?.media?.externalLink?.title && (
                    <h4 className="font-semibold mb-2">{currentEvent.media.externalLink.title}</h4>
                  )}
                  {currentEvent?.media?.externalLink?.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {currentEvent.media.externalLink.description}
                    </p>
                  )}
                  <span className="text-sm text-blue-600">{currentEvent?.media?.externalLink?.url}</span>
                </a>
              </div>
            )}

            {/* Uploaded Videos */}
            {currentEvent?.media?.videos?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Videos</h3>
                <div className="space-y-4">
                  {currentEvent?.media?.videos?.map((video, index) => (
                    <div key={index} className="w-full">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          src={video.url}
                          controls
                          className="w-full h-full"
                          preload="metadata"
                          aria-label={video.name || `Video ${index + 1}`}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      {video.name && (
                        <p className="mt-2 text-sm text-gray-600">{video.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images with Lightbox */}
            {currentEvent?.media?.images?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  Images ({currentEvent.media.images.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {currentEvent.media.images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setLightboxImage(image);
                        setLightboxIndex(index);
                      }}
                      className="relative group aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`View image ${index + 1}: ${image.caption || ""}`}
                    >
                      <img
                        src={image.url}
                        alt={image.caption || `Image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                        <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lightbox Modal */}
            {lightboxImage && (
              <div
                className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
                onClick={() => setLightboxImage(null)}
                role="dialog"
                aria-modal="true"
                aria-label="Image lightbox"
              >
                <button
                  onClick={() => setLightboxImage(null)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2"
                  aria-label="Close lightbox"
                >
                  <X size={24} />
                </button>

                {currentEvent?.media?.images && currentEvent.media.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentEvent?.media?.images) return;
                        const prevIndex =
                          lightboxIndex === 0
                            ? currentEvent.media.images.length - 1
                            : lightboxIndex - 1;
                        setLightboxIndex(prevIndex);
                        setLightboxImage(currentEvent.media.images[prevIndex]);
                      }}
                      className="absolute left-4 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={32} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentEvent?.media?.images) return;
                        const nextIndex =
                          lightboxIndex === currentEvent.media.images.length - 1
                            ? 0
                            : lightboxIndex + 1;
                        setLightboxIndex(nextIndex);
                        setLightboxImage(currentEvent.media.images[nextIndex]);
                      }}
                      className="absolute right-4 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2"
                      aria-label="Next image"
                    >
                      <ChevronRight size={32} />
                    </button>
                  </>
                )}

                <div
                  className="max-w-7xl max-h-full flex flex-col items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={lightboxImage.url}
                    alt={lightboxImage.caption || "Event image"}
                    className="max-w-full max-h-[90vh] object-contain"
                  />
                  {lightboxImage.caption && (
                    <p className="mt-4 text-white text-center max-w-2xl">
                      {lightboxImage.caption}
                    </p>
                  )}
                  {currentEvent?.media?.images && currentEvent.media.images.length > 1 && (
                    <p className="mt-2 text-white text-sm opacity-75">
                      {lightboxIndex + 1} / {currentEvent.media.images.length}
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentEvent?.media?.files?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Files</h3>
                <div className="space-y-2">
                  {currentEvent?.media?.files?.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <LinkIcon size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium">{file.name}</p>
                        {file.size && (
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Poll */}
            {currentEvent?.settings?.pollEnabled && currentEvent?.poll?.question && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Poll</h3>
                <p className="mb-4">{currentEvent?.poll?.question}</p>
                <div className="space-y-3">
                  {currentEvent?.poll?.options?.map((option) => {
                    const totalVotes = (currentEvent?.poll?.options || []).reduce(
                      (sum, opt) => sum + (opt.voteCount || 0),
                      0
                    );
                    const percentage =
                      totalVotes > 0 ? ((option.voteCount || 0) / totalVotes) * 100 : 0;
                    const isUserVote = userVote?.optionId === option._id.toString();

                    return (
                      <div key={option._id} className="space-y-2">
                        <button
                          onClick={() => handleVote(option._id)}
                          disabled={!!userVote}
                          className={`w-full p-3 text-left border-2 rounded-lg transition-colors ${
                            isUserVote
                              ? "border-blue-500 bg-blue-50"
                              : userVote
                              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{option.text}</span>
                            <span className="text-sm text-gray-600">
                              {option.voteCount || 0} votes ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments */}
            {currentEvent?.settings?.commentEnabled && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Comments ({currentEvent?.commentCount || 0})
                </h3>

                {/* Comment Form */}
                {user && (
                  <form onSubmit={handleAddComment} className="mb-6">
                    <div className="flex gap-2">
                      <Input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmittingComment}
                        className="flex items-center gap-2"
                      >
                        <Send size={18} />
                        Post
                      </Button>
                    </div>
                  </form>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {currentEvent?.comments?.length > 0 ? (
                    currentEvent.comments.map((comment) => {
                      const isCommentOwner =
                        user &&
                        (comment.userId?._id === user.id ||
                          comment.userId?._id === user._id ||
                          comment.userId === user.id ||
                          comment.userId === user._id);
                      const canDelete = isAdmin || isCommentOwner;

                      return (
                        <div key={comment._id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">
                                {comment.userId?.firstName} {comment.userId?.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(comment.createdAt), "MMM dd, yyyy h:mm a")}
                              </p>
                            </div>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                          <p className="text-gray-700">{comment.text}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default EventDetail;

