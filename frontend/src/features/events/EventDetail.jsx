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

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader size="lg" />
        </div>
      </>
    );
  }

  if (!currentEvent) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <ErrorAlert message="Event not found" />
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

  const hasUserLiked = user
    ? currentEvent.likes?.some(
        (like) => like.userId?._id === user.id || like.userId?._id === user._id
      )
    : false;

  const getUserVote = () => {
    if (!user || !currentEvent.poll?.options) return null;
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
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentEvent.title}</h1>

              {/* Event Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span>
                    {format(new Date(currentEvent.startDate), "MMM dd, yyyy h:mm a")}
                    {currentEvent.endDate &&
                      ` - ${format(new Date(currentEvent.endDate), "MMM dd, yyyy h:mm a")}`}
                  </span>
                </div>
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
                    <span>{currentEvent.likeCount || 0}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              {currentEvent.description && (
                <p className="text-gray-700 whitespace-pre-wrap">{currentEvent.description}</p>
              )}
            </div>

            {/* Media */}
            {currentEvent.media?.youtubeUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Video</h3>
                <div className="aspect-video">
                  <iframe
                    src={currentEvent.media.youtubeUrl.replace(
                      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
                      "https://www.youtube.com/embed/$1"
                    )}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {currentEvent.media?.externalLink?.url && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">External Link</h3>
                <a
                  href={currentEvent.media.externalLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border rounded-lg hover:bg-gray-50"
                >
                  {currentEvent.media.externalLink.title && (
                    <h4 className="font-semibold mb-2">{currentEvent.media.externalLink.title}</h4>
                  )}
                  {currentEvent.media.externalLink.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {currentEvent.media.externalLink.description}
                    </p>
                  )}
                  <span className="text-sm text-blue-600">{currentEvent.media.externalLink.url}</span>
                </a>
              </div>
            )}

            {currentEvent.media?.images?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {currentEvent.media.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={image.caption || `Image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {currentEvent.media?.files?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Files</h3>
                <div className="space-y-2">
                  {currentEvent.media.files.map((file, index) => (
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
            {currentEvent.settings?.pollEnabled && currentEvent.poll?.question && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Poll</h3>
                <p className="mb-4">{currentEvent.poll.question}</p>
                <div className="space-y-3">
                  {currentEvent.poll.options?.map((option) => {
                    const totalVotes = currentEvent.poll.options.reduce(
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
            {currentEvent.settings?.commentEnabled && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Comments ({currentEvent.commentCount || 0})
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
                  {currentEvent.comments?.length > 0 ? (
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

