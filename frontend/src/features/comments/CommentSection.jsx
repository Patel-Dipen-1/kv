import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCommentsByEvent, createComment, likeComment } from "./commentSlice";
import { usePermission } from "../../hooks/usePermission";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { Heart, MessageCircle, Flag, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CommentInput from "./CommentInput";
import CommentReply from "./CommentReply";

const CommentSection = ({ eventId, eventType }) => {
  const dispatch = useDispatch();
  const { comments, isLoading, pagination } = useSelector((state) => state.comments);
  const { user } = useSelector((state) => state.auth);
  const canPostComments = usePermission("canPostComments");
  const canViewComments = usePermission("canViewComments");

  const [sortBy, setSortBy] = useState("recent");
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    if (eventId && canViewComments) {
      dispatch(getCommentsByEvent({ eventId, sort: sortBy }));
    }
  }, [dispatch, eventId, sortBy, canViewComments]);

  const handleLike = async (commentId) => {
    await dispatch(likeComment(commentId));
    dispatch(getCommentsByEvent({ eventId, sort: sortBy }));
  };

  const getCommentTypeLabel = (type) => {
    if (eventType === "funeral" || eventType === "condolence") {
      return "Condolences";
    }
    if (eventType === "marriage" || eventType === "birthday" || eventType === "anniversary") {
      return "Wishes & Congratulations";
    }
    return "Comments";
  };

  if (!canViewComments) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      {canPostComments && (
        <CommentInput
          eventId={eventId}
          eventType={eventType}
          onCommentPosted={() => {
            dispatch(getCommentsByEvent({ eventId, sort: sortBy }));
          }}
        />
      )}

      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {getCommentTypeLabel(eventType)} ({pagination.total || 0})
        </h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        >
          <option value="recent">Recent</option>
          <option value="oldest">Oldest</option>
          <option value="most_liked">Most Liked</option>
        </select>
      </div>

      {/* Comments List */}
      {isLoading && comments.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      ) : comments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No comments yet. Be the first to comment!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment._id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  {comment.userId?.profileImage ? (
                    <img
                      src={comment.userId.profileImage}
                      alt={comment.userId.firstName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-semibold">
                      {comment.userId?.firstName?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {comment.userId?.firstName} {comment.userId?.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {comment.editedAt && (
                      <span className="text-xs text-gray-400">(edited)</span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                    {comment.commentText}
                  </p>
                  {comment.attachedImage && (
                    <img
                      src={comment.attachedImage}
                      alt="Attached"
                      className="max-w-xs rounded-lg mb-3"
                    />
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(comment._id)}
                      className={`flex items-center gap-1 text-sm ${
                        comment.userLiked
                          ? "text-red-600"
                          : "text-gray-600 hover:text-red-600"
                      }`}
                    >
                      <Heart
                        size={18}
                        className={comment.userLiked ? "fill-current" : ""}
                      />
                      <span>{comment.likeCount || 0}</span>
                    </button>
                    {canPostComments && (
                      <button
                        onClick={() =>
                          setReplyingTo(replyingTo === comment._id ? null : comment._id)
                        }
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                      >
                        <MessageCircle size={18} />
                        <span>Reply</span>
                      </button>
                    )}
                    {comment.canEdit && (
                      <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                        <Edit size={18} />
                        <span>Edit</span>
                      </button>
                    )}
                    {comment.canDelete && (
                      <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600">
                        <Trash2 size={18} />
                        <span>Delete</span>
                      </button>
                    )}
                    <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600">
                      <Flag size={18} />
                      <span>Report</span>
                    </button>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {reply.userId?.profileImage ? (
                              <img
                                src={reply.userId.profileImage}
                                alt={reply.userId.firstName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 text-xs font-semibold">
                                {reply.userId?.firstName?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {reply.userId?.firstName} {reply.userId?.lastName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(reply.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{reply.commentText}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                onClick={() => handleLike(reply._id)}
                                className={`flex items-center gap-1 text-xs ${
                                  reply.userLiked
                                    ? "text-red-600"
                                    : "text-gray-600 hover:text-red-600"
                                }`}
                              >
                                <Heart
                                  size={14}
                                  className={reply.userLiked ? "fill-current" : ""}
                                />
                                <span>{reply.likeCount || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingTo === comment._id && (
                    <div className="mt-4">
                      <CommentReply
                        parentCommentId={comment._id}
                        eventId={eventId}
                        onReplyPosted={() => {
                          setReplyingTo(null);
                          dispatch(getCommentsByEvent({ eventId, sort: sortBy }));
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;

