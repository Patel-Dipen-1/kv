import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { format, formatDistanceToNow } from "date-fns";
import { MoreVertical, Heart, MessageCircle, Share2, Instagram, User } from "lucide-react";
import { toggleLike, addComment } from "../../features/events/eventSlice";
import { toast } from "react-toastify";
import MediaCarousel from "./MediaCarousel";
import ActionBar from "./ActionBar";
import CommentPreview from "./CommentPreview";
import Input from "../common/Input";
import Button from "../common/Button";

const EventCard = ({ event, onCommentSubmit }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isLiked, setIsLiked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const commentInputRef = useRef(null);

  const descriptionMaxLength = 150;
  const shouldTruncate = event.description && event.description.length > descriptionMaxLength;
  const displayDescription = shouldTruncate && !showFullDescription
    ? event.description.substring(0, descriptionMaxLength) + "..."
    : event.description;

  // Check if user has liked
  useEffect(() => {
    if (user && event.likes) {
      const hasLiked = event.likes.some(
        (like) => like.userId?._id === user.id || like.userId?._id === user._id
      );
      setIsLiked(hasLiked);
    }
  }, [user, event.likes]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to like events");
      return;
    }
    try {
      await dispatch(toggleLike(event._id));
      setIsLiked(!isLiked);
    } catch (error) {
      // Error handled by slice
    }
  };

  const handleComment = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to comment");
      return;
    }
    setShowCommentInput(true);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const handleCommentSubmit = async (e) => {
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
      await dispatch(addComment({ eventId: event._id, text: commentText.trim() }));
      setCommentText("");
      setShowCommentInput(false);
      toast.success("Comment added successfully");
      if (onCommentSubmit) {
        onCommentSubmit();
      }
    } catch (error) {
      // Error handled by slice
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/events/${event._id}`;
    const shareData = {
      title: event.title,
      text: event.description,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard!");
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleViewDetails = () => {
    navigate(`/events/${event._id}`);
  };

  const creatorName = event.createdBy?.firstName && event.createdBy?.lastName
    ? `${event.createdBy.firstName} ${event.createdBy.lastName}`
    : event.createdBy?.email || "Event Organizer";

  const creatorInitial = creatorName[0].toUpperCase();

  return (
    <article className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden shadow-sm">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {event.createdBy?.profileImage ? (
              <img
                src={event.createdBy.profileImage}
                alt={creatorName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              creatorInitial
            )}
          </div>
          <div className="flex-1 min-w-0">
            <button
              onClick={handleViewDetails}
              className="font-semibold text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {creatorName}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <time dateTime={event.startDate}>
                {formatDistanceToNow(new Date(event.startDate), { addSuffix: true })}
              </time>
              {event.eventType === "instagram" && (
                <span className="flex items-center gap-1 text-pink-600">
                  <Instagram size={12} />
                  <span>Instagram</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="More options"
        >
          <MoreVertical size={20} className="text-gray-600" />
        </button>
      </header>

      {/* Media Section - Combined Carousel */}
      {(event.media?.images?.length > 0 || 
        event.media?.videos?.length > 0 || 
        event.media?.youtubeUrl || 
        (Array.isArray(event.media?.youtubeUrls) && event.media.youtubeUrls.length > 0) ||
        event.media?.externalLink?.url ||
        (Array.isArray(event.media?.externalLinks) && event.media.externalLinks.length > 0)) && (
        <div onClick={handleViewDetails} className="cursor-pointer">
          <MediaCarousel
            images={event.media.images || []}
            videos={event.media.videos || []}
            youtubeUrls={
              Array.isArray(event.media?.youtubeUrls) 
                ? event.media.youtubeUrls 
                : event.media?.youtubeUrl 
                  ? [event.media.youtubeUrl] 
                  : []
            }
            externalLinks={
              Array.isArray(event.media?.externalLinks)
                ? event.media.externalLinks
                : event.media?.externalLink?.url
                  ? [event.media.externalLink]
                  : []
            }
            className="w-full"
          />
        </div>
      )}

      {/* Action Bar */}
      <ActionBar
        isLiked={isLiked}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        likeCount={event.likeCount || 0}
        commentCount={event.commentCount || 0}
      />

      {/* Content Section */}
      <div className="px-4 pb-2">
        {event.title && (
          <h3
            onClick={handleViewDetails}
            className="font-semibold text-gray-900 mb-1 cursor-pointer hover:underline"
          >
            {event.title}
          </h3>
        )}
        {event.description && (
          <div className="text-gray-900">
            <p className="inline">{displayDescription}</p>
            {shouldTruncate && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-gray-500 hover:text-gray-700 ml-1 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {showFullDescription ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}
        {event.startDate && (
          <p className="text-xs text-gray-500 mt-2">
            {format(new Date(event.startDate), "MMM dd, yyyy 'at' h:mm a")}
          </p>
        )}
      </div>

      {/* Comments Preview */}
      {event.settings?.commentEnabled && event.comments && event.comments.length > 0 && (
        <CommentPreview
          comments={event.comments}
          commentCount={event.commentCount || event.comments.length}
          eventId={event._id}
          maxComments={2}
        />
      )}

      {/* Comment Input */}
      {showCommentInput && event.settings?.commentEnabled && (
        <form onSubmit={handleCommentSubmit} className="px-4 py-3 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              ref={commentInputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isSubmittingComment}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!commentText.trim() || isSubmittingComment}
              isLoading={isSubmittingComment}
              className="px-4"
            >
              Post
            </Button>
          </div>
        </form>
      )}
    </article>
  );
};

export default EventCard;

