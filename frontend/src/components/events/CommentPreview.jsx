import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";

const CommentPreview = ({ comments = [], commentCount = 0, eventId, maxComments = 2 }) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  if (!comments || comments.length === 0) {
    return null;
  }

  const displayComments = showAll ? comments.slice(0, maxComments * 2) : comments.slice(0, maxComments);
  const hasMore = commentCount > displayComments.length;

  return (
    <div className="px-4 pb-2">
      {commentCount > maxComments && !showAll && (
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          View all {commentCount} comments
        </button>
      )}

      <div className="space-y-2">
        {displayComments.map((comment) => (
          <div key={comment._id} className="flex gap-2">
            <div className="flex-shrink-0">
              {comment.userId?.profileImage ? (
                <img
                  src={comment.userId.profileImage}
                  alt={comment.userId.firstName || "User"}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">
                    {comment.userId?.firstName && comment.userId?.lastName
                      ? `${comment.userId.firstName} ${comment.userId.lastName}`
                      : comment.userId?.email || "Anonymous"}
                  </span>
                  {comment.createdAt && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-900 break-words">{comment.commentText}</p>
                {comment.attachedImage && (
                  <img
                    src={comment.attachedImage}
                    alt="Comment attachment"
                    className="mt-2 rounded-lg max-w-full max-h-48 object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && showAll && (
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="text-sm text-gray-500 hover:text-gray-700 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          View all {commentCount} comments
        </button>
      )}
    </div>
  );
};

export default CommentPreview;

